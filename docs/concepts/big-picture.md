# The big picture

This page follows a player through the system, from typing an address into a browser to seeing a challenge. Each later page in this section explains one part of that journey in more detail.

## Where the system runs

The system runs on computers that the club rents from **Amazon Web Services (AWS)**, Amazon's computer-rental business. The computers sit in an Amazon data centre in Singapore. The club never sees or touches them. You control them over the internet by typing commands on your own computer.

Renting this way is called using **the cloud**. You pay by the hour, you can add more computers in minutes, and you can delete everything when the event ends.

## Following a player

Suppose the club owns the domain name `example-ctf.com`. Follow the numbers.

<figure class="diagram">
--8<-- "diagrams/journey.svg"
<figcaption>Solid arrows carry the player's traffic. The dashed arrow is a lookup only.</figcaption>
</figure>

| Step | What happens |
|---|---|
| 1 | The browser asks **DNS**, the internet's address book, where `ctf.example-ctf.com` lives. |
| 2 | DNS answers with the address of the **load balancer**, a machine that receives every incoming connection. The browser connects to it. |
| 3 | The load balancer passes the connection to **NGINX**. |
| 4 | NGINX reads the name the player typed. `ctf.…` goes to **CTFd**, the scoreboard; `xssive-login.challenges.…` goes to that web challenge. |
| 5 | CTFd reads the player's team and score from its **database** and sends the page back. |
| A, B | A pwn player runs `nc <address> 7331`. Each pwn challenge has its own load balancer, which connects straight to the challenge. NGINX isn't involved. |

Every player shares the same running copy of each challenge. [Known weak spots](../operate/risks.md) explains what that means.

## What runs where

All of the programs above, including CTFd, NGINX and every challenge, run on a small group of rented computers, usually three. A system called **Kubernetes** decides which program runs on which computer, and restarts any program that crashes.

<div class="wh">
<div class="layers">
  <div class="layer l-node"><b>The internet</b><span>Players' browsers and terminals</span><span class="pill p-mute">outside AWS</span></div>
  <div class="layer l-auto"><b>DNS and load balancers</b><span>Turn names into addresses and receive every incoming connection</span><span class="pill p-ok">run by AWS</span></div>
  <div class="layer l-man"><b>NGINX</b><span>Forwards web requests to CTFd or to the right web challenge</span><span class="pill p-warn">runs in Kubernetes</span></div>
  <div class="layer l-man"><b>CTFd, its database, the challenges</b><span>The programs players actually use</span><span class="pill p-warn">runs in Kubernetes</span></div>
  <div class="layer l-node"><b>Three rented computers</b><span>Kubernetes spreads the programs across them</span><span class="pill p-mute">AWS EC2</span></div>
</div>
</div>

## How the system gets built

Nobody builds this by hand. Files in the club's repository, `wh-2026`, describe every part, and four commands turn them into the running system. [Infrastructure as code](infrastructure-as-code.md) shows which command builds what.

## Read next

1. [Cloud, networks and names](cloud-and-networks.md): accounts, regions, the private network, DNS and certificates.
2. [Containers and Kubernetes](containers-and-kubernetes.md): how the programs are packaged and kept running.
3. [Infrastructure as code](infrastructure-as-code.md): how Terraform, Pulumi and the Makefile build the system.

The [Architecture explorer](../reference/architecture.md) is an interactive map of the whole system.
