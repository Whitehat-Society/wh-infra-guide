# 4 · The scoreboard

With Kubernetes running, the club can put the first program that players see onto the cluster. That program is **CTFd**, the free scoreboard software where players register, read the challenges, submit flags and follow the rankings. The club runs the official CTFd release with one addition, a plugin that announces each challenge's first solve in Discord.

## What the scoreboard is made of

CTFd needs two other programs beside it, so the scoreboard is really three containers working together.

| Program | What it does |
|---|---|
| **CTFd** | The website itself. |
| **MariaDB** | The database, which holds the teams, the challenges, the solves and the scores. |
| **Redis** | A fast memory store that remembers who is logged in and keeps copies of pages that are expensive to build. |

## From code to a running container

Before Kubernetes can run CTFd, the program has to be packaged as a container image and stored where the cluster can download it.

<figure class="diagram">
--8<-- "diagrams/image-flow.svg"
<figcaption>The deploy builds the image from a Dockerfile, uploads it to ECR, and the cluster then downloads the image to start a pod. Every challenge goes through the same steps.</figcaption>
</figure>

| Term | What it is |
|---|---|
| **Dockerfile** | The recipe for building an image, kept as a text file next to the program's code. |
| **Container image** | The package itself, a snapshot of the program and its files. A container is one running copy of an image. |
| **Docker** | The tool that builds images on your computer. |
| **ECR** | AWS's private store for images, from which the cluster downloads them. |

## Telling Kubernetes what to run

Kubernetes doesn't take a list of programs. It takes a set of **objects**, each describing one thing that should exist, and it works to make the cluster match them. The scoreboard uses these:

| Object | What it is | In the scoreboard |
|---|---|---|
| **Deployment** | An instruction to keep a certain number of identical pods running. That number is called the **replica** count. | One each for CTFd, MariaDB and Redis, with 1 replica each. |
| **Service** | A fixed address in front of a Deployment's pods, so that other programs can find them even after a pod is replaced. | CTFd finds the database at the address `mariadb`. |
| **Ingress** | A rule that sends web requests for a given name to a given Service. | Requests for `ctf.<your-domain>` go to CTFd. |
| **Persistent volume** | A disk, on EBS, that survives when its pod is replaced. | The database files and the uploaded files. |
| **Secret** | An object that hands a password or token to a pod. | The database password. |

## How it is written down: Pulumi

These objects are created by **Pulumi**, a tool that does the same job as Terraform, except that its description is a program written in the Go language. The scoreboard's program is `utils/ctfd/main.go`. These excerpts read the domain from Pulumi's settings, which `make deploy-ctfd` fills in from your settings file, and create the Ingress that sends `ctf.<your-domain>` to CTFd:

```go
ctfHost := "ctf." + cfg.Require("domain")

networkingv1.NewIngress(ctx, "ingress", &networkingv1.IngressArgs{
    Spec: networkingv1.IngressSpecArgs{
        Rules: networkingv1.IngressRuleArray{
            networkingv1.IngressRuleArgs{
                Host: pulumi.String(ctfHost),
                ...
```

When the Ingress appears, the helpers from part 3 do the rest. ExternalDNS creates the name `ctf.<your-domain>` in Route 53, and cert-manager gets a certificate for it.

Like Terraform, Pulumi keeps a record of what it built, which it stores in an S3 bucket created in part 2. The record for each event is called a **stack** and is named after the event, such as `wh-2027`. The secret parts of the record are locked with a **passphrase** that is kept in Secrets Manager.

## Where it lives

| Kind | What you touch |
|---|---|
| Files in the repository | `utils/ctfd/main.go` describes the three programs and their objects. `utils/ctfd/image/Dockerfile` is the recipe for the CTFd image, which starts from the official `ctfd/ctfd` image and adds the Discord plugin. |
| Commands | `make deploy-ctfd` builds the CTFd image, uploads it to ECR and runs Pulumi. `kubectl get pods -n ctfd` shows the three pods. |
| Web dashboards | CTFd's own setup page, where you name the event and create the admin login, and its admin panel, where you change settings and show or hide challenges during the event. |

You build this part in [Deploy · 2. The scoreboard](../deploy/ctfd.md).

**Next:** [5 · The challenges](challenges.md).
