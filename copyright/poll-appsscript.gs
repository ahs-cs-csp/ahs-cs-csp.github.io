/**
 * Station A live poll backend — AHS CS Principles, Unit 2 Lab 5.
 *
 * Paste this into a Google Sheet's Apps Script editor (Extensions > Apps Script),
 * then deploy as a Web app. Setup steps are in poll-README.md.
 *
 * Everything goes through doGet + JSONP on purpose: Apps Script web apps do not
 * send usable CORS headers, so a normal fetch() POST from the page is blocked by
 * the browser. A JSONP <script> tag is not subject to that, and the payload here
 * is six yes/no answers, which fits in a query string with room to spare.
 */

// Change this before deploying. Anyone who knows it can wipe a period's votes.
var ADMIN_KEY = 'change-me';

var QUESTIONS = ['music', 'movies', 'games'];
var HEADERS = ['timestamp', 'period', 'has_music', 'has_movies', 'has_games',
               'ok_music', 'ok_movies', 'ok_games', 'stage'];

// stage '1' = the three behaviour questions, '2' = the three opinion questions,
// 'all' = both at once (what older rows, written before the split, look like).

function doGet(e) {
  var p = (e && e.parameter) || {};
  var callback = p.callback || 'callback';
  var out;

  try {
    switch (p.action) {
      case 'vote':    out = vote(p);    break;
      case 'results': out = results(p); break;
      case 'reset':   out = reset(p);   break;
      case 'ping':    out = {ok: true, pong: true}; break;
      default:        out = {ok: false, error: 'unknown action'};
    }
  } catch (err) {
    out = {ok: false, error: String(err)};
  }

  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(out) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('votes');
  if (!sh) {
    sh = ss.insertSheet('votes');
    sh.appendRow(HEADERS);
  }
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}

function vote(p) {
  var period = String(p.period || '1').slice(0, 12);
  var stage = (p.stage === '1' || p.stage === '2') ? p.stage : 'all';
  var row = [new Date(), period];
  for (var i = 0; i < QUESTIONS.length; i++) row.push(p['has_' + QUESTIONS[i]] === '1' ? 1 : 0);
  for (var j = 0; j < QUESTIONS.length; j++) row.push(p['ok_' + QUESTIONS[j]] === '1' ? 1 : 0);
  row.push(stage);

  // Two students can submit in the same instant; without the lock one row overwrites the other.
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    sheet_().appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return {ok: true};
}

function results(p) {
  var period = p.period ? String(p.period) : null;
  var sh = sheet_();
  var last = sh.getLastRow();
  // n_has and n_ok are tracked apart: a student can answer the first three and
  // stop, and dividing both sets by one shared total would misreport the second.
  var counts = {n: 0, n_has: 0, n_ok: 0,
                has: {music: 0, movies: 0, games: 0}, ok: {music: 0, movies: 0, games: 0}};
  if (last < 2) return {ok: true, counts: counts};

  var values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  for (var r = 0; r < values.length; r++) {
    var v = values[r];
    if (period && String(v[1]) !== period) continue;
    var stage = String(v[8] || 'all');
    if (stage === '1' || stage === 'all') {
      counts.n_has++;
      for (var i = 0; i < QUESTIONS.length; i++) if (v[2 + i]) counts.has[QUESTIONS[i]]++;
    }
    if (stage === '2' || stage === 'all') {
      counts.n_ok++;
      for (var j = 0; j < QUESTIONS.length; j++) if (v[5 + j]) counts.ok[QUESTIONS[j]]++;
    }
  }
  counts.n = Math.max(counts.n_has, counts.n_ok);
  return {ok: true, counts: counts};
}

function reset(p) {
  if (String(p.key || '') !== ADMIN_KEY) return {ok: false, error: 'bad key'};
  var period = p.period ? String(p.period) : null;
  var sh = sheet_();
  var last = sh.getLastRow();
  if (last < 2) return {ok: true, cleared: 0};

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (!period) {
      sh.deleteRows(2, last - 1);
      return {ok: true, cleared: last - 1};
    }
    // Walk bottom-up: deleting a row shifts everything below it up by one.
    var values = sh.getRange(2, 1, last - 1, 2).getValues();
    var cleared = 0;
    for (var r = values.length - 1; r >= 0; r--) {
      if (String(values[r][1]) === period) { sh.deleteRow(r + 2); cleared++; }
    }
    return {ok: true, cleared: cleared};
  } finally {
    lock.releaseLock();
  }
}
