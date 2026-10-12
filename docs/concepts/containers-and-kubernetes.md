# Containers and Kubernetes

<span class="time">Time: about 10 minutes to read</span>

The scoreboard and each challenge are separate programs, often written in different languages with different needs. This page explains how they are packaged, how they run, and how the system keeps them running.

## Containers

A challenge written in Python might need Python 3.12 and five libraries. Another written in Node.js needs something else entirely. Installing all of that on one computer leads to conflicts.

A **container** solves this. It is a program packaged together with every file it needs, running in its own sealed-off space on a computer. Many containers can share one computer without seeing each other's files.

- A **container image** is the package: a snapshot of the program and its files. A container is one running copy of an image.
- A **Dockerfile** is the recipe for building an image. Each challenge folder in the repo has one.
- **Docker** is the tool that builds images from Dockerfiles and runs containers.
- A **registry** stores images so other computers can download them. This system uses **ECR** (Elastic Container Registry), AWS's private registry.

## Kubernetes

Three computers and about twenty containers raise questions. Which container runs on which computer? What happens when a container crashes, or a computer dies? **Kubernetes** answers these.

You give Kubernetes a description of what should be running, for example "two copies of the `xssive-login` image". Kubernetes starts them, watches them, and replaces any that stop. Its group of computers is a **cluster**, and each computer in it is a **node**. **EKS** (Elastic Kubernetes Service) is AWS's managed Kubernetes. AWS runs the part of Kubernetes that makes decisions, and the club rents the nodes.

You talk to Kubernetes with a command-line tool called **kubectl**.

## The things Kubernetes runs

Kubernetes has its own names for the things you describe. These are the ones this system uses:

| Name | What it is | Example in this system |
|---|---|---|
| **Pod** | One running container (occasionally a few that work together). The smallest thing Kubernetes runs | One copy of `xssive-login` |
| **Deployment** | "Keep this many identical pods running." The number is the **replica** count | `xssive-login`, 1 replica |
| **Service** | A fixed name and address in front of a group of pods, so other programs can find them even as pods are replaced | `ctfd`, port 8000 |
| **Ingress** | A rule like "requests for this name go to that Service". NGINX reads these rules | `xssive-login.challenges.example-ctf.com` goes to `xssive-login` |
| **Namespace** | A folder that groups related things | `ctfd`, `challenges-web`, `challenges-tcp` |
| **CronJob** | Runs a pod on a schedule | Hourly database backup |
| **Secret** | A Kubernetes object that hands a password or token to a pod | The database password |
| **Persistent volume** | A disk that survives when its pod is replaced | CTFd's database files |

A Service can ask AWS for a load balancer. That is how each pwn challenge gets its own NLB.

## Helper programs inside the cluster

A few programs run inside the cluster and create AWS resources on its behalf. You don't operate them directly, but their names appear in error messages:

- **NGINX ingress controller**: the NGINX that reads Ingress rules and forwards web requests.
- **AWS Load Balancer Controller**: creates an AWS load balancer whenever a Service asks for one.
- **ExternalDNS**: creates the DNS records in Route 53 for every name in an Ingress.
- **cert-manager**: gets TLS certificates from Let's Encrypt, and renews them before they expire.
- **Cluster Autoscaler**: rents another node when pods don't fit on the existing ones, and returns nodes that sit mostly idle.

## How the system scales

Kubernetes can add capacity in two ways, and this system uses only one of them:

- **More nodes: automatic.** When a pod can't start because every node is full, the Cluster Autoscaler rents another node, up to a limit of six.
- **More pods: manual.** No program here adds pods when traffic rises. Each Deployment's replica count is a fixed number in the code. To add pods, you change the number and redeploy. [Adding capacity](../operate/scaling.md) shows how.

Busy pods don't make the cluster grow. A pod only triggers a new node when it can't start at all.

**Next:** [Infrastructure as code](infrastructure-as-code.md).
