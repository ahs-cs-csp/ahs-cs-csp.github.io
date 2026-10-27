# Station A live poll — setup

Ten minutes, once. Do it from your **personal** Google account — school Workspace
accounts usually refuse to publish a web app with "Anyone" access, which is what
makes the poll reachable from student devices.

## 1. Make the Sheet

New Google Sheet, any name (`CSP Copyright Poll` is fine). The script creates the
`votes` tab itself on first use.

## 2. Add the script

In that Sheet: **Extensions → Apps Script**. Delete the stub `myFunction`, paste
all of `poll-appsscript.gs`, and change this line near the top:

    var ADMIN_KEY = 'change-me';

to anything only you know. Anyone with that key can wipe a period's votes. Save.

## 3. Deploy

**Deploy → New deployment → ⚙ → Web app**

| field | value |
|---|---|
| Execute as | **Me** |
| Who has access | **Anyone** |

Not "Anyone with Google account" — students on school Chromebooks are signed into
school accounts, and that setting makes them hit a login wall.

Authorize when prompted. Google will warn that the app is unverified: **Advanced →
Go to (project)**. That warning is normal for your own scripts.

Copy the **Web app URL**. It ends in `/exec`.

## 4. Wire it up

Paste the `/exec` URL into `poll.html`:

    var ENDPOINT = '';   // <- put it between the quotes

Commit and push. Until that line is filled in, the page runs in hand-count mode
instead, so it is never broken — just not live.

## 5. Check it

Open `poll.html?view=results&period=0` on your laptop and `poll.html?period=0` on
your phone. Vote on the phone; the laptop bars should move within five seconds.
Then clear the test data (step below) before class.

## Using it in class

| who | URL |
|---|---|
| Students | `.../copyright/poll.html?period=3` |
| Projector | `.../copyright/poll.html?view=results&period=3&key=YOUR_KEY` |

Change `period=` for each class. **The results view only shows that period**, so
period 3 never sees period 2's numbers — and with `key=` on the URL you get a
*Clear period* button, which you should press between classes only if you want to
re-run it, not routinely (the data is worth keeping).

Put the student link on the board as a QR code or a short link; nobody wants to
type that.

## Things worth knowing

- **One vote per device per period** is enforced in the browser's localStorage.
  A student who knows what they're doing can clear it and vote again. For a
  classroom that's fine; don't use this to grade anything.
- **Answers are anonymous.** The Sheet stores a timestamp, the period and six
  0/1 values. No names, no accounts, no IP addresses.
- **Changing the script needs a redeploy** — Deploy → Manage deployments → ✏ →
  Version: New version. The `/exec` URL stays the same, so nothing in `poll.html`
  has to change.
- **If it dies mid-class**, the page shows a banner with a link that switches to
  hand-count mode. You keep the lesson, you just lose the animation. You can also
  go straight there with `poll.html?view=hand`.
- **Why JSONP and not a normal POST?** Apps Script web apps don't return usable
  CORS headers, so a `fetch()` from the page would be blocked by the browser.
  A `<script>` tag isn't subject to that rule, and six yes/no answers fit in a
  query string easily.

## The questions

Verbatim from BJC Unit 2 Lab 5 page 1, which runs it as a show of hands. The order
matters: students answer all three *behaviour* questions before they ever see the
word "steal". Don't reorder them.
