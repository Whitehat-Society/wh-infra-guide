# Start here

This guide shows you how to put the Whitehacks CTF online and take it down again. It assumes you have a computer and an internet connection, and nothing else: no cloud account, no tools installed, and no experience with servers.

A CTF ("capture the flag") is a security competition. Teams solve challenges, each challenge hides a secret string called a *flag*, and teams score points by submitting flags. To run one, the club needs three things on the internet:

- **A scoreboard website**, where players register, read challenges, submit flags and see rankings. We use free software called **CTFd**.
- **Web challenges**: small, deliberately vulnerable websites that players attack in a browser.
- **Pwn challenges**: vulnerable programs that players connect to from their own terminal.

Some challenges (crypto, forensics, OSINT, misc) are only a description, a file and a flag. They live inside CTFd and need nothing else.

## How the guide is organised

Work through the sections in order the first time. Later, use the sidebar to jump to what you need.

<div class="wh">
<div class="layers">
  <div class="layer l-node"><b>1 · How the system works</b><span>Plain-language explanations of every part. Read this before you touch anything</span></div>
  <div class="layer l-node"><b>2 · Your computer</b><span>Open a terminal, learn the few commands you need, install the tools</span></div>
  <div class="layer l-node"><b>3 · Accounts</b><span>Amazon Web Services, a spending alert, a domain name, Discord and GitHub</span></div>
  <div class="layer l-node"><b>4 · Code and settings</b><span>Download the club's code and fill in your own details</span></div>
  <div class="layer l-node"><b>5 · Deploy</b><span>Build the system, one part at a time, checking each part works</span></div>
  <div class="layer l-man"><b>6 · Run the event</b><span>What to watch on event day and what to do when something breaks</span><span class="pill p-warn">event day</span></div>
  <div class="layer l-none"><b>7 · Tear down</b><span>Delete everything so the club stops paying</span><span class="pill p-crit">always do this</span></div>
</div>
</div>

## What it costs

The system runs on rented computers from Amazon Web Services (AWS). AWS charges by the hour for as long as the system exists, whether or not anyone is playing.

| Item | Cost |
|---|---|
| The running system | about US$0.45 per hour, or US$11 per day |
| The domain name, e.g. `example-ctf.com` | about US$15 per year |
| Database backups kept after the event | a few cents per month |

These are estimates from WH-2026. Check current AWS prices before you budget. A typical event needs the system for two or three days: one for a test run, and one or two for the event itself.

!!! warning "The bill keeps growing until you tear down"
    A forgotten system costs about US$330 a month. Section 3 sets up an email alert, and section 7 deletes everything. Do both.

## How each task page works

Every page that asks you to do something has the same parts:

1. **Numbered steps.** Each step starts with what to type or click.
2. **Check it worked.** A command to run and the output you should see. Don't move on until it matches.
3. **If it fails.** The usual errors and what fixes them.

Commands appear in grey boxes. Click the copy icon at the right edge of a box to copy its contents, then paste them into your terminal. Text in angle brackets, like `<your-domain>`, is a placeholder: replace the whole thing, brackets included, with your own value.

Steps that can only be done in a web browser, such as creating the AWS account, have a screen recording above the written steps.

## Getting help

Post in the club's tech and infra channel. Include the page you're on, the step number, the command you ran and the first line of the error. Those four things are usually enough for someone to help.

**Next:** [The big picture](concepts/big-picture.md).
