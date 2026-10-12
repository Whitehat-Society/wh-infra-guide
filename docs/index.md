# Start here

**First action:** open [1 · Your PC → Install the tools](setup/pc.md) and start the installs. They run in the background while you read the rest of this page.

This guide takes you from a blank computer with no AWS account to a live CTF:
a scoreboard at `ctf.<your-domain>`, web challenges at `<name>.challenges.<your-domain>`, and pwn challenges reachable over `nc`. You don't need any cloud experience. Every step tells you what to type, how long it takes and how to check that it worked.

<div class="wh">
<div class="layers">
  <div class="layer l-node"><b>1 · Your PC</b><span>Install about 10 command-line tools</span><span class="pill p-mute">~45 min</span></div>
  <div class="layer l-node"><b>2 · Accounts</b><span>AWS account, CLI sign-in, budget alert, domain, Discord webhook</span><span class="pill p-mute">~1 h + up to 1 day for domain DNS</span></div>
  <div class="layer l-node"><b>3 · Code & config</b><span>Clone the repos, swap in your account ID and domain, store the secrets</span><span class="pill p-mute">~30 min</span></div>
  <div class="layer l-node"><b>4 · Deploy</b><span>Cluster, scoreboard, challenges, backups, final checks</span><span class="pill p-mute">~1.5 h, mostly waiting</span></div>
  <div class="layer l-man"><b>5 · Run the event</b><span>Watch alarms, scale up, back up the database</span><span class="pill p-warn">event day</span></div>
  <div class="layer l-none"><b>6 · Tear down</b><span>Delete everything and confirm the bill stops</span><span class="pill p-crit">must do</span></div>
</div>
</div>

## What you're building

<div class="wh">
<div class="facts" style="display:flex;flex-wrap:wrap;gap:8px 22px;font:13px/1.4 var(--f-mono);color:var(--muted)">
  <span>region <b>ap-southeast-1 (Singapore)</b></span>
  <span>cluster <b>&lt;event&gt;-eks</b></span>
  <span>nodes <b>t3.medium · 2–6</b></span>
  <span>IaC <b>Terraform + Pulumi (Go)</b></span>
  <span>WH-2026 load <b>106 teams · 39 challenges · 9,316 submissions</b></span>
</div>
</div>

One Kubernetes cluster on AWS (EKS) runs everything:

- **CTFd**, the scoreboard, plus its MariaDB database and Redis cache. One pod each.
- **Web challenges**: one Deployment per challenge behind a shared NGINX ingress, at `https://<name>.challenges.<your-domain>`.
- **Pwn challenges**: one Deployment per challenge, each with its own Network Load Balancer, reached with `nc <hostname> <port>`.
- **Static challenges** (crypto, forensics, OSINT, misc) are only files and flags inside CTFd. They need no infrastructure of their own.

Every player shares the same challenge instance. Click around the live map below, or open it full size in [Architecture explorer](reference/architecture.md).

<div class="wh">
<div class="explorer">
  <div class="tabs" id="tabs" role="tablist"></div>
  <div class="figure" style="min-width:0">
    <div><h3 id="vtitle"></h3><p class="tag" id="vdesc"></p></div>
    <div class="scroll"><svg id="map" role="img" aria-label="Interactive architecture diagram"></svg></div>
    <div class="legend" id="legend"></div>
    <div class="flows" id="flows"></div>
    <div id="walk" aria-live="polite"></div>
  </div>
  <aside class="card" id="inspect" aria-live="polite"></aside>
</div>
</div>

## What it costs

!!! warning "AWS bills by the hour while the cluster exists"
    A running stack costs roughly **US$0.45 per hour (about US$11 per day)**: EKS control plane $0.10/h, 3 × t3.medium nodes ~$0.16/h, NAT gateway ~$0.06/h, and load balancers ~$0.12/h. These are rough figures; check current AWS pricing. Nothing costs money once you finish [6 · Tear down](teardown.md), apart from the domain (~US$15 per year) and a few cents of S3 storage for backups.

    Set up the [budget alert](accounts/budget.md) **before** you deploy anything.

## How each page works

Every task page has the same shape:

1. A time estimate, like <span class="time">⏱ 20 min</span>
2. Numbered steps, each one starting with the command
3. **Check it worked**: a command and the output you should see
4. **If it fails**: the common errors and their fixes

Some steps can only be done in a web browser, such as creating the AWS account. Those pages have a screen recording, with the same steps written out underneath it.

!!! tip "Where commands run"
    Unless a step says otherwise, run commands in a terminal **inside the `wh-2026/utils` folder**. On Windows that terminal is Ubuntu (WSL), not PowerShell.

## Who to ask

Post in the tech & infra channel with: the page you're on, the step number, the command you ran, and the first error line. That's usually enough for someone to help you.
