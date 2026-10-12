# Cloud, networks and names

<span class="time">Time: about 10 minutes to read</span>

This page explains the AWS side of the system and the basic ideas of how computers find and talk to each other. Each term in **bold** is used later in the guide.

## AWS accounts, regions and billing

An **AWS account** is the club's account with Amazon Web Services. Everything the system uses belongs to it, and its bill goes to the card on file. The person who creates the account gets the **root user**, a login that can do anything, including closing the account. You protect it with **MFA** (multi-factor authentication): signing in needs both the password and a code from your phone.

For everyday work you create a separate login with fewer powers, managed by an AWS service called **IAM Identity Center**. **IAM** (Identity and Access Management) is the part of AWS that decides who may do what.

AWS has data centres in many cities. Each city's group of data centres is a **region**. This system uses the Singapore region, whose code is `ap-southeast-1`. A region contains several separate buildings called **availability zones**, so a fire or power cut in one doesn't take down the others.

You can control AWS in two ways: the **console**, a website where you click buttons, and the **AWS CLI** (command-line interface), a program you run in your terminal. This guide uses the CLI wherever it can, because a typed command can be copied exactly and checked afterwards.

## Computers you rent

**EC2** (Elastic Compute Cloud) is the AWS service that rents out computers. Each rented computer is a **virtual machine**: a slice of a large physical server that behaves like a separate computer. This system uses three of the `t3.medium` size, each with 2 processor cores and 4 GB of memory.

Rented computers need disks. **EBS** (Elastic Block Store) provides network disks that attach to one machine at a time. The scoreboard's database lives on one. **S3** (Simple Storage Service) stores files, called *objects*, in containers called **buckets**. The system keeps database backups and its own build records in S3. Bucket names are shared across all AWS customers worldwide, so every name must be unique.

## The private network

The rented computers sit on a private network that only the club can use, called a **VPC** (virtual private cloud). The VPC is divided into **subnets**:

- **Public subnets** can reach the internet directly. The load balancers sit here.
- **Private subnets** have no public address, so nobody on the internet can reach them directly. The computers that run the programs sit here.

Computers in a private subnet still need to download software. A **NAT gateway** lets them make outgoing connections without accepting incoming ones, the way a home router lets your laptop browse without exposing it.

## Addresses and ports

Every computer on a network has an **IP address**, a number like `13.250.10.4`. One computer runs many programs, so each connection also names a **port**, a number from 1 to 65535 that says which program it is for. Websites use port 443. The pwn challenge `loop` uses port 7331.

Most connections on the internet use **TCP**, a method of sending data reliably between two programs. A website is TCP plus a set of rules for web pages. A pwn challenge is plain TCP: what the player types goes to the program, and what the program prints comes back. The `nc` (netcat) command opens such a plain connection.

## Names: domains and DNS

People remember names, not numbers. A **domain name** like `example-ctf.com` is a name the club rents from a **registrar**, a company that sells domains, for about US$15 a year. You can create any number of names under it, such as `ctf.example-ctf.com`.

**DNS** (Domain Name System) is the internet's address book. It turns a name into an IP address. Each entry is a **DNS record**. The club's records are kept in **Route 53**, AWS's DNS service, in a **hosted zone**: the collection of records for one domain. The system creates and updates these records by itself.

## Web traffic and padlocks

Browsers fetch web pages using **HTTP**. **HTTPS** is HTTP sent through an encrypted connection, so nobody in between can read or change it. The browser shows a padlock when the connection is encrypted and the site has proved its identity.

The site proves its identity with a **TLS certificate**, a file signed by a trusted organisation. **Let's Encrypt** issues certificates for free, after the site proves it controls the domain. The system requests and renews them by itself.

## Load balancers

A **load balancer** is a machine that receives incoming connections and passes each one on to one of several computers behind it. If one of those computers fails, the load balancer stops sending it work. AWS's **NLB** (Network Load Balancer) passes connections on without reading them. This system uses one NLB for all web traffic and one NLB for each pwn challenge.

## Alerts

**CloudWatch** is the AWS service that collects measurements, such as memory use, and raises an **alarm** when one crosses a limit. An alarm sends a message to **SNS** (Simple Notification Service), which forwards it by email. A small program then reposts it to the club's Discord.

## Secrets

Passwords, keys and tokens are **secrets**. Anyone who sees one can use it. The system keeps its secrets in **AWS Secrets Manager**, a locked store inside the AWS account, instead of in files on your computer or in the code.

**Next:** [Containers and Kubernetes](containers-and-kubernetes.md).
