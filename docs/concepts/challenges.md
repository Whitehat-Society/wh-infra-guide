# 5 · The challenges

The scoreboard lists the challenges, but many challenges also need a server of their own for players to attack. This part puts those servers on the cluster and loads every challenge into CTFd, so that each one appears on the scoreboard with its text, its files and the address to connect to.

## Three kinds of challenge

| Kind | What players do | What runs on the cluster |
|---|---|---|
| **text** | Read the description and download files, as in crypto, forensics, OSINT and most misc challenges. | Nothing. The challenge lives entirely inside CTFd. |
| **shared-web** | Open a website such as `https://example-web.challenges.<your-domain>` in the browser. | Pods behind NGINX, which share the one web load balancer. |
| **shared-tcp** | Connect from the terminal with a command such as `nc <address> 7331`. | Pods behind a load balancer of their own. |

"Shared" means that every player uses the same running copies of the challenge, so a player who crashes the server crashes it for everyone until Kubernetes restarts it. [Known weak spots](../operate/risks.md) explains what that means during an event.

## How a request reaches a web challenge

A web challenge uses the same kinds of objects as the scoreboard in part 4, with one Deployment, one Service and one Ingress for each challenge.

<figure class="diagram">
--8<-- "diagrams/k8s-objects.svg"
<figcaption>NGINX reads the Ingress to learn which Service a name belongs to, and then forwards the request to that Service, which picks one of the Deployment's pods.</figcaption>
</figure>

NGINX can tell web challenges apart because a browser always sends the name it is visiting. An `nc` connection carries no name, so NGINX can't sort pwn traffic, and each pwn challenge gets its own load balancer instead.

## How it is written down

Each challenge is one folder in the repository, inside its category's folder, such as `web/example-web/` or `pwn/example-tcp/`. The challenge's author writes the folder, and the deploy only reads it.

```
web/example-web/
├── challenge.yml      the name, text, points, flag and type
├── Dockerfile         the recipe for the server's image
└── src/               the server's code
```

`challenge.yml` is a short text file. These lines from `web/example-web/challenge.yml` show the parts that matter to the deploy:

```yaml
name: "example-web"
category: Web
value: 1000
challenge_type: shared-web
port_number: 3000
flags:
    "WH2026{...}"
```

`challenge_type` decides which of the three kinds the challenge is, and `port_number` tells the deploy which port the server listens on.

A program called `builder.py` turns the folders into running challenges. It reads every `challenge.yml`, builds each server's image and uploads it to ECR, and then runs Pulumi to create the pods. Finally it runs **ctfcli**, CTFd's own tool, which copies the text, flags and files from each `challenge.yml` into CTFd.

<figure class="diagram">
--8<-- "diagrams/build-images.svg"
<figcaption><code>builder.py</code> sorts the challenges by <code>challenge_type</code>. The <code>shared-web</code> and <code>shared-tcp</code> challenges get an image (1) and pods (2), and every challenge, including the <code>text</code> ones, is loaded into CTFd (3).</figcaption>
</figure>

## Where it lives

| Kind | What you touch |
|---|---|
| Files in the repository | One folder per challenge, such as `web/example-web/`. `utils/challenges/main.go` is the Pulumi program that turns the folders into pods, and `utils/builder/builder.py` runs everything. |
| Commands | `make build-images` builds, deploys and loads every challenge in one go. `kubectl get pods -n challenges-web` and `kubectl get pods -n challenges-tcp` show the running servers. |
| Web dashboards | CTFd's admin panel, where you show the challenges to players when the event starts. |

Challenge authors write the folders by following [Write a challenge](../write/index.md), and you deploy them in [Deploy · 3. The challenges](../deploy/challenges.md).

**Next:** [6 · Alarms and backups](safety.md).
