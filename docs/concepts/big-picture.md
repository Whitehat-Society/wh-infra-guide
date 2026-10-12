# The big picture

<span class="time">Time: about 10 minutes to read</span>

This page follows a player through the system, from typing an address into a browser to seeing a challenge. Each later page in this section explains one part of that journey in more detail.

## Where the system runs

The system runs on computers that the club rents from **Amazon Web Services (AWS)**, Amazon's computer-rental business. The computers sit in an Amazon data centre in Singapore. The club never sees or touches them. You control them over the internet by typing commands on your own computer.

Renting this way is called using **the cloud**. You pay by the hour, you can add more computers in minutes, and you can delete everything when the event ends.

## Following a player

Suppose the club owns the domain name `example-ctf.com`. Here is what happens when a player uses the system.

**Opening the scoreboard.** The player types `ctf.example-ctf.com` into a browser.

1. The browser asks the internet's address book, called **DNS**, where `ctf.example-ctf.com` lives. DNS answers with the address of a **load balancer**, a machine that receives incoming connections and passes each one to a computer that can handle it.
2. The load balancer passes the connection to **NGINX**, a program that reads the name the player asked for and forwards the request to the right application.
3. NGINX forwards it to **CTFd**, the scoreboard. CTFd looks up the player's team and scores in its **database**, and sends back the page.

**Opening a web challenge.** The player opens `xssive-login.challenges.example-ctf.com`. The first two steps are the same. NGINX sees a different name, so it forwards the request to the `xssive-login` challenge instead of CTFd.

**Connecting to a pwn challenge.** The player types `nc <address> 7331` in their terminal. `nc` opens a plain connection that sends text back and forth, with no web pages involved. Each pwn challenge has its own load balancer, which passes the connection straight to the challenge program. NGINX is not involved.

**Every player shares the same copy of each challenge.** Two teams attacking `xssive-login` reach the same running program. The [Known weak spots](../operate/risks.md) page explains what that means in practice.

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

You don't build any of this by hand. The club's code repository, `wh-2026`, contains files that describe every part. Two tools, **Terraform** and **Pulumi**, read those files and create the matching resources in AWS. A file called the **Makefile** wraps the long commands into short ones, so most of the deploy is five commands such as `make deploy-eks`.

Because everything is described in code, you can delete the whole system after the event and rebuild it exactly next year.

## Read next

The next three pages explain the parts in more detail:

1. [Cloud, networks and names](cloud-and-networks.md): AWS, addresses, DNS, web traffic and load balancers.
2. [Containers and Kubernetes](containers-and-kubernetes.md): how the programs are packaged and kept running.
3. [Infrastructure as code](infrastructure-as-code.md): how Terraform, Pulumi and the Makefile build the system.

If you prefer pictures, the [Architecture explorer](../reference/architecture.md) is an interactive map of the system. It uses the technical names, which those three pages explain.
