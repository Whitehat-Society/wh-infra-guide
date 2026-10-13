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
| 4 | NGINX looks at the name the player typed and sends the request on. A name starting with `ctf.` goes to CTFd, and `example-web.challenges.…` goes to that web challenge. | 3, using the Ingresses from parts 4 and 5 |
| 5 | CTFd reads the player's team and score from its database and sends the finished page back. | 4 · the scoreboard |
| A, B | A pwn player runs `nc <address> 1337` instead, and that challenge's own load balancer connects them straight to the challenge. | 5 · the challenges |

All the while, part 6 is checking every challenge every 5 minutes and copying the database every hour.

## The build, in five commands

The chain is built from the bottom up, and each command below builds one or more parts. Section 5 of this guide runs them one at a time and checks each result before moving on.

<figure class="diagram">
--8<-- "diagrams/who-builds.svg"
<figcaption>Each deploy step is one short command, and teardown runs the same tools in reverse order.</figcaption>
</figure>

| Command | Parts it builds |
|---|---|
| `make secrets` | The passwords, stored in Secrets Manager, which every later command reads |
| `make deploy-eks` | 2, 3 and the alarms from 6 |
| `make deploy-ctfd` | 4 |
| `make build-images` | 5 |
| `make deploy-ctfd-backup-cronjob` and `make deploy-healthcheck-cronjob` | The scheduled jobs from 6 |

Part 1 has no command of its own, because you create the account and the domain by hand in section 3.

## Your own settings

The files in the repository are the same for every event. What makes a deploy yours is one settings file, `utils/eks/terraform.tfvars.json`, which holds values such as the event's name, its region and its domain. Every other name, such as the cluster's, the buckets' and the image registry's, is worked out from it by `utils/settings.py`, so you never type those names yourself.

| File | What it holds | Read by |
|---|---|---|
| `utils/eks/terraform.tfvars.json` | The event's name, region, domain and cluster size | Terraform for parts 2, 3 and 6, and `settings.py` for everything else |
| `utils/config.ini` | Which folders hold challenges, and how many copies of each run | `builder.py` and the health check |
| `.ctf/config` | The scoreboard's address and an access token | ctfcli. `builder.py` writes it on every run, and git ignores it. |

The passwords and tokens themselves are kept in Secrets Manager, and `utils/secrets.py` reads and writes them.

If you prefer to explore, the [Architecture explorer](../reference/architecture.md) is an interactive map of the whole system.

## Check your understanding

Each question describes a situation you could meet on a real deploy. Work out your answer before you open the hidden one, because the answers rely on how the parts fit together rather than on any single page.

!!! question "1. The web challenge works, but the pwn challenge doesn't"
    During a test, a teammate opens `https://example-web.challenges.<your-domain>` without any trouble, but `nc <address> 1337` for a pwn challenge just hangs. Which parts of the chain do you now know are working, and where would you look first?

    ??? success "Answer"
        The web page proves a lot. DNS answers for your domain (part 1), the network and the computers are running (part 2), and NGINX and the web load balancer are passing traffic on (part 3). None of that is on the pwn challenge's path, though. An `nc` connection carries no name, so NGINX can't sort it, and each pwn challenge has a load balancer of its own instead. Look at that challenge's own pieces in part 5. `kubectl get svc -n challenges-tcp` shows whether its load balancer has an address, and `kubectl get pods -n challenges-tcp` shows whether its pods are running.

!!! question "2. A quick fix in the console"
    During a test run, the alarm `<event>-mariadb-memory-high` keeps firing, so someone opens the CloudWatch console and raises its limit from 80% to 95%. A week later, a teammate runs `make deploy-eks` to change something unrelated. What happens to the alarm, and what would have been the better fix?

    ??? success "Answer"
        Terraform makes AWS match the files, so the next `make deploy-eks` quietly puts the limit back to 80%. A lasting change to an alarm belongs in `utils/eks/observability.tf`. The better fix, however, is usually to leave the alarm alone. It fires because MariaDB is close to its own memory limit, and a container that goes over its limit is stopped and restarted, which takes the scoreboard down with it. Raising the alarm's limit only hides that warning. Giving MariaDB more memory in `utils/ctfd/main.go` and running `make deploy-ctfd` removes the cause.

!!! question "3. Every pod is running, but nobody can reach the scoreboard"
    The club bought its domain from another company. You created the hosted zone in Route 53 but forgot to change the name servers at that company. The deploy finishes, and `kubectl get pods -n ctfd` shows all three pods running. What do players see, and why don't the running pods help?

    ??? success "Answer"
        Players can't reach the site at all. ExternalDNS writes `ctf.<your-domain>` into the Route 53 hosted zone, but the rest of the internet still asks the other company's name servers, which have never heard of that record. The certificate fails as well, because cert-manager proves to Let's Encrypt that the club owns the domain by adding a record in Route 53, and Let's Encrypt can't see that record either. Running pods only show that parts 3 and 4 work, and every player's request has to pass through part 1 before it gets anywhere near them.

**Next:** [Your computer: overview](../setup/index.md).
