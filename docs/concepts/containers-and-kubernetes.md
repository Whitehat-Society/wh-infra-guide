# Containers and Kubernetes

The scoreboard and the challenges are all separate programs, and they are often written in different languages. This page explains how those programs are packaged, how they are started, and how they are kept running.

## Containers

A Python challenge needs Python and its libraries, while a Node.js challenge needs a different set of software, and installing all of it on one computer quickly leads to conflicts. A **container** avoids the problem. It is a program packaged together with every file it needs, and it runs sealed off from the other containers on the same computer.

<figure class="diagram">
--8<-- "diagrams/image-flow.svg"
<figcaption>Every challenge folder has a Dockerfile. The deploy builds each one into an image and uploads it to ECR, and the cluster then downloads the image to start a pod.</figcaption>
</figure>

| Term | What it is |
|---|---|
| **Dockerfile** | The recipe for building an image. |
| **Container image** | The package itself, a snapshot of the program and its files. A **container** is one running copy of an image. |
| **Docker** | The tool that builds images and runs containers. |
| **Registry** | A store from which other computers download images. This system uses **ECR**, AWS's private registry. |

## Kubernetes

With three computers and about twenty containers, someone has to decide which container runs where, and what happens when a container crashes or a computer fails. **Kubernetes** makes those decisions. You describe what should be running, for example "one copy of `xssive-login`", and Kubernetes starts it, keeps watching it, and replaces it if it stops.

| Term | What it is |
|---|---|
| **Cluster** | The group of computers that Kubernetes manages. Each computer in it is called a **node**. |
| **EKS** | AWS's managed Kubernetes. AWS runs the part that makes the decisions, and the club rents the nodes. |
| **kubectl** | The command-line tool you use to talk to the cluster. |

## The objects Kubernetes runs

<figure class="diagram">
--8<-- "diagrams/k8s-objects.svg"
<figcaption>One web challenge. NGINX reads the Ingress to learn which Service a name belongs to, and then forwards the request to that Service, which picks one of the Deployment's pods.</figcaption>
</figure>

| Object | What it is | Example |
|---|---|---|
| **Pod** | One running container. | One copy of `xssive-login` |
| **Deployment** | An instruction to keep a certain number of identical pods running. That number is called the **replica** count. | `xssive-login`, 1 replica |
| **Service** | A fixed address in front of a Deployment's pods. A Service can also ask AWS for a load balancer of its own, which is how each pwn challenge gets one. | `ctfd`, port 8000 |
| **Ingress** | A rule that sends requests for a given name to a given Service. | `xssive-login.challenges.example-ctf.com` |
| **Namespace** | A folder that groups related objects together. | `ctfd`, `challenges-web`, `challenges-tcp` |
| **CronJob** | An object that runs a pod on a schedule. | The hourly database backup |
| **Secret** | An object that hands a password or token to a pod. | The database password |
| **Persistent volume** | A disk that survives when its pod is replaced. | CTFd's database files |

## Helper programs inside the cluster

Four programs inside the cluster create AWS resources on its behalf. You never run them yourself, but their names do appear in error messages, so it helps to know what each one does.

<figure class="diagram">
--8<-- "diagrams/helpers.svg"
<figcaption>Each helper watches one kind of Kubernetes object and creates the matching thing outside the cluster. NGINX, the fifth helper, forwards web requests.</figcaption>
</figure>

## How the system scales

| What grows | How it grows | Limit |
|---|---|---|
| **Nodes** | Automatically. When a pod can't start because every node is full, the Cluster Autoscaler rents another node. | 6 nodes |
| **Pods** | By hand. Each Deployment's replica count is a fixed number in the code, so you change the number and redeploy, as described in [Adding capacity](../operate/scaling.md). | none |

A busy pod doesn't make the cluster grow. The Cluster Autoscaler only adds a node when a pod can't start at all.

**Next:** [Infrastructure as code](infrastructure-as-code.md).
