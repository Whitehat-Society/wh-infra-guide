# Putting it together

You have now met every part of the chain. This page follows one player's request through all of them, and then shows the commands that build the whole chain in order.

## Following a player

Suppose the club owns the domain `example-ctf.com`. The numbers in the diagram match the steps in the table below it, and the last column names the part that handles each step.

<figure class="diagram">
--8<-- "diagrams/journey.svg"
<figcaption>Solid arrows carry the player's traffic. The dashed arrow is a lookup only.</figcaption>
</figure>

| Step | What happens | Part |
|---|---|---|
| 1 | The browser asks DNS where `ctf.example-ctf.com` lives. | 1 · the domain, with a record written by part 3 |
| 2 | DNS answers with the address of the web load balancer, and the browser connects to it. | 2 · the network |
| 3 | The load balancer passes the connection on to NGINX. | 3 · Kubernetes and its helpers |
| 4 | NGINX looks at the name the player typed and sends the request on. A name starting with `ctf.` goes to CTFd, and `xssive-login.challenges.…` goes to that web challenge. | 3, using the Ingresses from parts 4 and 5 |
| 5 | CTFd reads the player's team and score from its database and sends the finished page back. | 4 · the scoreboard |
| A, B | A pwn player runs `nc <address> 7331` instead, and that challenge's own load balancer connects them straight to the challenge. | 5 · the challenges |

All the while, part 6 is checking every challenge every 5 minutes and copying the database every hour.

## The build, in four commands

The chain is built from the bottom up, and each command below builds one or more parts. Section 5 of this guide runs them one at a time and checks each result before moving on.

<figure class="diagram">
--8<-- "diagrams/who-builds.svg"
<figcaption>Each deploy step is one short command, and teardown runs the same tools in reverse order.</figcaption>
</figure>

| Command | Parts it builds |
|---|---|
| `make deploy-eks` | 2, 3 and the alarms from 6 |
| `make deploy-ctfd` | 4 |
| `make build-images` | 5 |
| `make deploy-ctfd-backup-cronjob` and `make deploy-healthcheck-cronjob` | The scheduled jobs from 6 |

Part 1 has no command of its own, because you create the account and the domain by hand in section 3.

## Your own settings

The files in the repository are the same for every event. What makes a deploy yours is a handful of settings files, which hold values such as the event's name and its domain. None of them contains a password, and git ignores all of them, so they are never uploaded to GitHub.

| File | Read by |
|---|---|
| `utils/eks/terraform.tfvars.json` | Terraform, for parts 2, 3 and 6 |
| `utils/ecr/terraform.tfvars` | Terraform, for the image store in ECR |
| `utils/config.ini` | The Makefile, `builder.py` and the helper scripts |
| `.ctf/config` | ctfcli, which reads the scoreboard's address and an access token from it |

The passwords and tokens themselves are kept in Secrets Manager, and `utils/secrets.py` reads and writes them.

If you prefer to explore, the [Architecture explorer](../reference/architecture.md) is an interactive map of the whole system.

**Next:** [Open a terminal](../setup/terminal.md).
