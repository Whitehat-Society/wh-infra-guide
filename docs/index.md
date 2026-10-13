# Start here

This guide shows you how to put the Whitehacks CTF online and how to take it down again afterwards. All it assumes is that you have a computer and an internet connection. You don't need a cloud account, any tools installed, or any experience with servers, because the guide covers each of those as you reach it.

A CTF ("capture the flag") is a security competition in which teams solve challenges. Each challenge hides a secret string called a *flag*, and a team scores points by finding the flag and submitting it. To run a CTF, the club needs three things on the internet.

- A **scoreboard website**, where players register, read the challenges, submit flags and follow the rankings. The club uses free software called CTFd for this.
- **Web challenges**, which are small websites with deliberate weaknesses that players attack from their browser.
- **Pwn challenges**, which are vulnerable programs that players connect to from their own terminal.

The other categories, such as crypto, forensics, OSINT and misc, are usually just a description, a file and a flag. Those challenges live entirely inside CTFd and need nothing else.

## How the guide is organised

The first time you read the guide, work through the sections in order, because each one relies on the ones before it. Later you can use the sidebar to jump straight to the page you need. The button with three lines at the top left hides the sidebar when you want more room.

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

The system runs on computers rented from Amazon Web Services (AWS). AWS charges by the hour for as long as the system exists, whether or not anyone is playing on it.

| Item | Cost |
|---|---|
| The running system | about US$0.45 per hour, or US$11 per day |
| The domain name, e.g. `example-ctf.com` | about US$15 per year |
| Database backups kept after the event | a few cents per month |

These figures come from WH-2026, so check the current AWS prices before you set a budget. A typical event keeps the system running for two or three days, which covers one day for a test run and one or two days for the event itself.

!!! warning "The bill keeps growing until you tear down"
    A system that someone forgets to delete costs about US$330 a month. Section 3 sets up an email alert that warns you about spending, and section 7 deletes everything. Make sure you do both.

## How each task page works

Every page that asks you to do something is laid out the same way.

1. The numbered steps come first, and each one starts with what to type or click.
2. Next, a section called *Check it worked* gives you a command to run and the output you should see. Don't move on until your output matches it.
3. Finally, a section called *If it fails* lists the usual errors and how to fix them.

Commands appear in grey boxes. To copy a command, click the copy icon at the right edge of its box, then paste it into your terminal. Text in angle brackets, like `<your-domain>`, is a placeholder, which means you replace the whole thing, brackets included, with your own value.

Some steps can only be done in a web browser, such as creating the AWS account. Those steps have a screen recording above the written instructions.

## Getting help

If you get stuck, post in the club's tech and infra channel. Mention the page you're on, the step number, the command you ran and the first line of the error, because those four things are usually enough for someone to help you.

**Next:** [What we're building](concepts/big-picture.md).
