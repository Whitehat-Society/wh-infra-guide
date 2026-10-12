# Cloud, networks and names

This page explains the AWS side of the system and how computers find each other on the internet. The terms in **bold** come up again later in the guide, and the [Glossary](../reference/glossary.md) collects them in one place.

## AWS accounts and logins

| Term | What it is |
|---|---|
| **AWS account** | The club's account with Amazon Web Services. Everything the system uses belongs to this account, and its bill goes to the card on file. |
| **Root user** | The login that is created together with the account. It can do anything, including closing the account, so it is protected with **MFA**, which asks for a code from your phone as well as the password. |
| **IAM Identity Center** | The AWS service that gives you an everyday login with fewer powers than the root user. **IAM** is the part of AWS that decides who may do what. |
| **Console** and **CLI** | The two ways to control AWS. The console is a website with buttons, and the CLI is the `aws` program in your terminal. This guide uses the CLI wherever it can, because a typed command can be copied exactly. |

## Regions and the private network

AWS has data centres in many cities, and the group of data centres in one city is called a **region**. The code for Singapore's region is `ap-southeast-1`. Each region contains several separate buildings called **availability zones**, named a, b and c, so that a power cut in one building leaves the others running.

<figure class="diagram">
--8<-- "diagrams/network.svg"
<figcaption>The load balancer is the only way in. The computers can make outgoing connections through the NAT gateway, but nobody on the internet can reach them directly.</figcaption>
</figure>

| Term | What it is |
|---|---|
| **VPC** | The club's own private network inside the region. |
| **Subnet** | A slice of the VPC. A **public** subnet can be reached from the internet, and a **private** subnet can't. |
| **EC2** | The service that rents out computers. Each one is a **virtual machine**, which is a slice of a large physical server. This system uses three `t3.medium` machines, each with 2 processor cores and 4 GB of memory. |
| **NAT gateway** | A device that lets computers in private subnets download software without accepting any incoming connections, much like a home router. |
| **Load balancer** | A service that receives incoming connections and passes each one to a computer that is working. AWS's **NLB** (Network Load Balancer) does this without reading the traffic. |

## Disks and storage

| Term | What it is |
|---|---|
| **EBS** | A network disk attached to one computer. The scoreboard's database lives on one of these. |
| **S3** | AWS's file storage, where files go into containers called **buckets**. The system keeps its backups and its build records there. Every AWS customer shares one set of bucket names, so each bucket name must be unique. |
| **Secrets Manager** | A locked store for passwords, keys and tokens. The system reads its **secrets** from here and never from files in the code. |

## Addresses, ports and names

Every computer on the internet has an **IP address**, such as `13.250.10.4`. A **port** is a number from 1 to 65535 that says which program on that computer a connection is meant for. Websites use port 443, for example, and the pwn challenge `loop` uses port 7331. Most connections use **TCP**, which is a reliable way to send data between two programs, and the `nc` command opens a plain TCP connection.

People remember names more easily than numbers, so the club rents a **domain name** such as `example-ctf.com` from a **registrar**, and it can then create any name under that domain. **DNS** is the system that turns those names into addresses.

<figure class="diagram">
--8<-- "diagrams/dns.svg"
<figcaption>The registrar points the domain at Route 53, and ExternalDNS, a program in the cluster, keeps the records up to date. A browser first looks the name up (1) and then connects (2).</figcaption>
</figure>

| Term | What it is |
|---|---|
| **Route 53** | AWS's DNS service. |
| **Hosted zone** | The set of DNS records for one domain, kept in Route 53. |
| **DNS record** | One entry in a hosted zone, made up of a name and the address it points to. |

## HTTPS and certificates

Browsers fetch pages with **HTTP**. **HTTPS** is HTTP sent inside an encrypted connection, and the browser shows a padlock when it is in use. To get the padlock, a site needs a **TLS certificate**, which is a file that proves the site owns its name. **Let's Encrypt** issues these certificates for free, and the system requests and renews them by itself.

## Alarms

**CloudWatch** collects measurements from the system, such as memory use, and raises an **alarm** when one of them crosses a limit you have set.

<figure class="diagram">
--8<-- "diagrams/alerts.svg"
<figcaption>SNS (Simple Notification Service) sends every alarm by email, and also to a small Lambda program that reposts it in Discord.</figcaption>
</figure>

**Next:** [Containers and Kubernetes](containers-and-kubernetes.md).
