# The big picture

This page follows a player through the system, from the moment they type an address into their browser until a challenge appears on their screen. The later pages in this section each explain one part of that journey in more detail.

## Where the system runs

The system runs on computers that the club rents from Amazon Web Services (AWS), which is Amazon's computer rental business. The computers sit in an Amazon data centre in Singapore, so nobody in the club ever sees or touches them. Instead, you control them over the internet by typing commands on your own computer.

Renting computers this way is called using *the cloud*. You pay only for the hours you use, you can add more computers within minutes, and you can delete everything when the event is over.

## Following a player

Suppose the club owns the domain name `example-ctf.com`. The numbers in the diagram match the steps in the table below it.

<figure class="diagram">
--8<-- "diagrams/journey.svg"
<figcaption>Solid arrows carry the player's traffic. The dashed arrow is a lookup only.</figcaption>
</figure>

| Step | What happens |
|---|---|
| 1 | The browser asks DNS, the internet's address book, where `ctf.example-ctf.com` lives. |
| 2 | DNS answers with the address of the load balancer, which is the machine that receives every incoming connection, and the browser connects to it. |
| 3 | The load balancer passes the connection on to NGINX. |
| 4 | NGINX looks at the name the player typed and sends the request to the right program. A name starting with `ctf.` goes to CTFd, the scoreboard, and `xssive-login.challenges.…` goes to that web challenge. |
| 5 | CTFd reads the player's team and score from its database and sends the finished page back. |
| A, B | A pwn player runs `nc <address> 7331` instead. Each pwn challenge has its own load balancer, which connects straight to the challenge without going through NGINX. |

Every player shares the same running copy of each challenge. [Known weak spots](../operate/risks.md) explains what that means in practice.

## What runs where

All of the programs above, including CTFd, NGINX and every challenge, run on a small group of rented computers, usually three of them. A system called Kubernetes decides which program runs on which computer, and it restarts any program that crashes.

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

Nobody builds this system by hand. Files in the club's code repository, `wh-2026`, describe every part of it, and four commands turn those files into the running system. [Infrastructure as code](infrastructure-as-code.md) shows which command builds which part.

## Read next

1. [Cloud, networks and names](cloud-and-networks.md) covers accounts, regions, the private network, DNS and certificates.
2. [Containers and Kubernetes](containers-and-kubernetes.md) explains how the programs are packaged and kept running.
3. [Infrastructure as code](infrastructure-as-code.md) shows how Terraform, Pulumi and the Makefile build the system.

If you prefer to explore, the [Architecture explorer](../reference/architecture.md) is an interactive map of the whole system.
