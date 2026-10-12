# Containers and Kubernetes

The scoreboard and each challenge are separate programs, often in different languages. This page shows how they are packaged, run, and kept running.

## Containers

A Python challenge needs Python and its libraries; a Node.js challenge needs something else. Installing everything on one computer leads to conflicts. A **container** avoids that: it is a program packaged with every file it needs, running sealed off from the others on the same computer.

<figure class="diagram">
--8<-- "diagrams/image-flow.svg"
<figcaption>Every challenge folder has a Dockerfile. The deploy builds each one into an image, uploads it to ECR, and the cluster downloads it to start a pod.</figcaption>
</figure>

| Term | What it is |
|---|---|
| **Dockerfile** | The recipe for an image. |
| **Container image** | The package: a snapshot of the program and its files. A **container** is one running copy. |
| **Docker** | The tool that builds images and runs containers. |
| **Registry** | Stores images for other computers to download. This system uses **ECR**, AWS's private registry. |

## Kubernetes

Three computers and about twenty containers raise questions. Which container runs where? What happens when one crashes, or a computer dies? **Kubernetes** answers them. You describe what should be running, for example "one copy of `xssive-login`", and Kubernetes starts it, watches it, and replaces it if it stops.

| Term | What it is |
|---|---|
| **Cluster** | Kubernetes' group of computers. Each computer is a **node**. |
| **EKS** | AWS's managed Kubernetes. AWS runs the decision-making part; the club rents the nodes. |
| **kubectl** | The command-line tool you use to talk to the cluster. |

## The objects Kubernetes runs

<figure class="diagram">
--8<-- "diagrams/k8s-objects.svg"
<figcaption>One web challenge. NGINX reads the Ingress to learn which Service a name belongs to, then forwards the request to that Service, which picks one of the Deployment's pods.</figcaption>
</figure>

| Object | What it is | Example |
|---|---|---|
| **Pod** | One running container | One copy of `xssive-login` |
| **Deployment** | "Keep this many identical pods running." The number is the **replica** count | `xssive-login`, 1 replica |
| **Service** | A fixed address in front of a Deployment's pods. A Service can also ask AWS for its own load balancer; that is how each pwn challenge gets one | `ctfd`, port 8000 |
| **Ingress** | A rule: "requests for this name go to that Service" | `xssive-login.challenges.example-ctf.com` |
| **Namespace** | A folder that groups objects | `ctfd`, `challenges-web`, `challenges-tcp` |
| **CronJob** | Runs a pod on a schedule | The hourly database backup |
| **Secret** | Hands a password or token to a pod | The database password |
| **Persistent volume** | A disk that survives when its pod is replaced | CTFd's database files |

## Helper programs inside the cluster

Four programs in the cluster create AWS resources for it. You never run them yourself, but their names appear in error messages.

<figure class="diagram">
--8<-- "diagrams/helpers.svg"
<figcaption>Each helper watches one kind of Kubernetes object and creates the matching thing outside the cluster. NGINX, the fifth helper, forwards web requests.</figcaption>
</figure>

## How the system scales

| What grows | How | Limit |
|---|---|---|
| **Nodes** | Automatically. When a pod can't start because every node is full, the Cluster Autoscaler rents another | 6 nodes |
| **Pods** | By hand. Each Deployment's replica count is a fixed number in the code; you change it and redeploy ([Adding capacity](../operate/scaling.md)) | none |

A busy pod doesn't make the cluster grow. Only a pod that can't start at all triggers a new node.

**Next:** [Infrastructure as code](infrastructure-as-code.md).
