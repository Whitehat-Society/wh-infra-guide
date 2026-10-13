# 3 · Kubernetes and its helpers

Part 2 gives the club three empty computers. The scoreboard and about twenty challenges have to run on them, and someone has to decide which program runs on which computer, restart a program when it crashes, and move programs elsewhere when a computer fails. Doing that by hand during an event would be impossible, so this part adds a manager that does it automatically.

## Containers

The programs are written in different languages, and each one needs its own set of software. A Python challenge needs Python and its libraries, while a Node.js challenge needs something else entirely, and installing everything on one computer quickly leads to conflicts. A **container** avoids the problem. It is a program packaged together with every file it needs, and it runs sealed off from the other containers on the same computer. Part 4 shows how a container is built.

## Kubernetes

**Kubernetes** is the manager. You describe what should be running, for example "one copy of `xssive-login`", and Kubernetes starts it on a computer with room to spare, keeps watching it, and replaces it if it stops.

| Term | What it is |
|---|---|
| **Cluster** | The group of computers that Kubernetes manages. Each computer in it is called a **node**. |
| **EKS** | AWS's managed Kubernetes. AWS runs the part that makes the decisions, called the **control plane**, and the club rents the nodes. |
| **kubectl** | The command-line tool you use to ask the cluster questions and give it instructions. |
| **Pod** | One running container, which is the smallest thing Kubernetes runs. |
| **Namespace** | A folder that groups related things together. CTFd lives in `ctfd`, and the challenges live in `challenges-web` and `challenges-tcp`. |

## The helpers

A program running in the cluster still needs things from outside the cluster before players can reach it. It needs a load balancer, a name in DNS, and a certificate for HTTPS. Five helper programs, installed together with the cluster, create these automatically. You never run them yourself, but their names appear in error messages, so it helps to know what each one does.

<figure class="diagram">
--8<-- "diagrams/helpers.svg"
<figcaption>Each helper watches one kind of Kubernetes object and creates the matching thing outside the cluster. NGINX, the fifth helper, forwards web requests.</figcaption>
</figure>

Browsers fetch pages with **HTTP**. **HTTPS** is HTTP sent inside an encrypted connection, and the browser shows a padlock when it is in use. To get the padlock, a site needs a **TLS certificate**, which is a file that proves the site owns its name. **Let's Encrypt** issues these certificates for free, and cert-manager, one of the helpers, requests and renews them by itself.

## How the cluster grows

| What grows | How it grows | Limit |
|---|---|---|
| **Nodes** | Automatically. When a pod can't start because every node is full, the Cluster Autoscaler rents another node. | 6 nodes |
| **Pods** | By hand. Each program's number of copies is a fixed number in the code, so you change the number and redeploy, as described in [Adding capacity](../operate/scaling.md). | none |

A busy pod doesn't make the cluster grow. The Cluster Autoscaler only adds a node when a pod can't start at all.

## How it is written down

The cluster and its helpers are built by the same Terraform files as part 2. The helpers are installed with **Helm**, which is an installer for Kubernetes software, and each helper is one block in `utils/eks/helm.tf`. This is the block that installs NGINX:

```hcl
resource "helm_release" "ingress_nginx" {
  name       = "ingress-nginx"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  version    = "4.15.1"
  namespace  = "ingress-nginx"
}
```

Once the cluster exists, you look inside it with `kubectl`. For example, this command lists every pod in every namespace, together with the node it runs on:

```bash
kubectl get pods -A -o wide
```

## Where it lives

| Kind | What you touch |
|---|---|
| Files in the repository | `utils/eks/main.tf` for the cluster and its nodes, and `utils/eks/helm.tf` and `utils/eks/cert-manager.tf` for the helpers. |
| Commands | `make deploy-eks` builds the cluster, `make kubeconfig` lets `kubectl` reach it, and `kubectl get …` shows what is running. |
| Web dashboards | None. |

You build this part in [Deploy · 1. The cluster](../deploy/eks.md), in the same step as part 2.

**Next:** [4 · The scoreboard](scoreboard.md).
