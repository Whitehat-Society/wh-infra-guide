# 1 · The AWS account and the domain

Everything else in the chain is rented from Amazon Web Services (AWS), so the first part is an account to rent it with. Players also need a name to type into their browser, so the club needs a domain name as well. Neither of these runs any software. They are the ground that the rest of the system stands on.

## The account

The system runs on computers that the club rents from AWS, which is Amazon's computer rental business. You pay only for the hours you use, you can add computers within minutes, and you can delete everything when the event is over. Renting computers this way is called using *the cloud*.

| Term | What it is |
|---|---|
| **AWS account** | The club's account with AWS. Everything the system uses belongs to this account, and its bill goes to the card on file. |
| **Root user** | The login that is created together with the account. It can do anything, including closing the account, so it is protected with **MFA**, which asks for a code from your phone as well as the password. |
| **IAM Identity Center** | The AWS service that gives you an everyday login with fewer powers than the root user. **IAM** is the part of AWS that decides who may do what. |
| **Console** and **CLI** | The two ways to control AWS. The console is a website with buttons, and the CLI is the `aws` program in your terminal. This guide uses the CLI wherever it can, because a typed command can be copied exactly. |

AWS has data centres in many cities, and the group of data centres in one city is called a **region**. The system runs in Singapore, whose region code is `ap-southeast-1`. Each region contains several separate buildings called **availability zones**, named a, b and c, so that a power cut in one building leaves the others running. Part 2 spreads the computers across all three.

## The domain name

Every computer on the internet has an **IP address**, such as `13.250.10.4`. A **port** is a number from 1 to 65535 that says which program on that computer a connection is meant for. Websites use port 443, for example, and the pwn challenge `loop` uses port 7331. Most connections use **TCP**, which is a reliable way to send data between two programs, and the `nc` command that pwn players use opens a plain TCP connection.

People remember names more easily than numbers, so the club rents a **domain name** such as `example-ctf.com` from a **registrar**, and it can then create any name under that domain. **DNS** is the system that turns those names into addresses.

<figure class="diagram">
--8<-- "diagrams/dns.svg"
<figcaption>The registrar points the domain at Route 53, and ExternalDNS, a helper program from part 3, writes the records. A browser first looks the name up (1) and then connects to the address it gets back (2).</figcaption>
</figure>

| Term | What it is |
|---|---|
| **Route 53** | AWS's DNS service. |
| **Hosted zone** | The set of DNS records for one domain, kept in Route 53. |
| **DNS record** | One entry in a hosted zone, made up of a name and the address it points to. |

In this part you only create the empty hosted zone and point the domain at it. The records inside it, such as `ctf.<your-domain>`, appear later by themselves, because a helper program in part 3 writes them.

## Where it lives

This is the only part that isn't described by files in the repository, because an account has to exist before any tool can use it.

| Kind | What you touch |
|---|---|
| Web dashboards | The AWS sign-up page, the root user's MFA settings, IAM Identity Center, and the registrar's nameserver form if you bought the domain elsewhere. Each has a screen recording in section 3. |
| Commands | `aws configure sso` to sign in from the terminal, `aws budgets create-budget` for the spending alert, and `aws route53 create-hosted-zone` for the domain. |
| Files on your computer | `~/.aws/config` remembers how to sign in. It stays on your computer and never goes into the repository. |

You set this part up in [section 3 · Accounts](../accounts/aws.md).

**Next:** [2 · The network and the computers](network.md).
