# Cloud, networks and names

The AWS side of the system, and how computers find each other. Terms in **bold** appear later in the guide; the [Glossary](../reference/glossary.md) repeats them.

## AWS accounts and logins

| Term | What it is |
|---|---|
| **AWS account** | The club's account with Amazon Web Services. Everything the system uses belongs to it, and its bill goes to the card on file. |
| **Root user** | The login created with the account. It can do anything, including close the account, so it is protected with **MFA**: a password plus a code from your phone. |
| **IAM Identity Center** | The AWS service that gives you an everyday login with fewer powers. **IAM** is the part of AWS that decides who may do what. |
| **Console** and **CLI** | Two ways to control AWS: a website with buttons, and the `aws` program in your terminal. This guide uses the CLI wherever it can, because a typed command can be copied exactly. |

## Regions and the private network

AWS has data centres in many cities. One city's group of data centres is a **region**; Singapore's code is `ap-southeast-1`. A region contains separate buildings called **availability zones** (zones a, b and c), so a power cut in one leaves the others running.

<figure class="diagram">
--8<-- "diagrams/network.svg"
<figcaption>The load balancer is the only way in. The computers can make outgoing connections, through the NAT gateway, but nobody on the internet can reach them directly.</figcaption>
</figure>

| Term | What it is |
|---|---|
| **VPC** | The club's own private network inside the region. |
| **Subnet** | A slice of the VPC. **Public** subnets can be reached from the internet; **private** subnets can't. |
| **EC2** | The service that rents out computers. Each one is a **virtual machine**, a slice of a large physical server. This system uses three `t3.medium` machines: 2 processor cores and 4 GB of memory each. |
| **NAT gateway** | Lets computers in private subnets download software without accepting incoming connections, like a home router. |
| **Load balancer** | Receives incoming connections and passes each one to a computer that is working. AWS's **NLB** (Network Load Balancer) does this without reading the traffic. |

## Disks and storage

| Term | What it is |
|---|---|
| **EBS** | A network disk attached to one computer. The scoreboard's database lives on one. |
| **S3** | File storage. Files go into **buckets**. The system keeps backups and its build records there. Bucket names are shared by every AWS customer, so each must be unique. |
| **Secrets Manager** | A locked store for passwords, keys and tokens. The system reads its **secrets** from here, never from files in the code. |

## Addresses, ports and names

Every computer has an **IP address**, such as `13.250.10.4`. A **port**, a number from 1 to 65535, says which program on that computer a connection is for: websites use 443, the pwn challenge `loop` uses 7331. Most connections use **TCP**, a reliable way to send data between two programs; `nc` opens a plain TCP connection.

People remember names, not numbers. The club rents a **domain name**, such as `example-ctf.com`, from a **registrar**, and can create any name under it. **DNS** turns names into addresses.

<figure class="diagram">
--8<-- "diagrams/dns.svg"
<figcaption>The registrar points the domain at Route 53. ExternalDNS, a program in the cluster, keeps the records up to date. A browser asks first (1), then connects (2).</figcaption>
</figure>

| Term | What it is |
|---|---|
| **Route 53** | AWS's DNS service. |
| **Hosted zone** | The set of DNS records for one domain, kept in Route 53. |
| **DNS record** | One entry: a name and the address it points to. |

## HTTPS and certificates

Browsers fetch pages with **HTTP**. **HTTPS** is HTTP inside an encrypted connection, shown by a padlock. To get the padlock, the site needs a **TLS certificate**, a file that proves it owns the name. **Let's Encrypt** issues them free, and the system requests and renews them by itself.

## Alarms

**CloudWatch** collects measurements, such as memory use, and raises an **alarm** when one crosses a limit.

<figure class="diagram">
--8<-- "diagrams/alerts.svg"
<figcaption>SNS (Simple Notification Service) sends every alarm by email, and to a small Lambda program that reposts it in Discord.</figcaption>
</figure>

**Next:** [Containers and Kubernetes](containers-and-kubernetes.md).
