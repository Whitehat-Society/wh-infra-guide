# Infrastructure as code

Building the system by clicking through the AWS console would take days, and nobody could repeat it exactly. Instead, files in the repository describe every part, and tools turn those files into real resources. This is called **infrastructure as code**. It also means you can delete everything after the event and rebuild it identically next year.

## The whole deploy in four commands

<figure class="diagram">
--8<-- "diagrams/who-builds.svg"
<figcaption>Each deploy step is one short command. Teardown runs the same tools in reverse order.</figcaption>
</figure>

The file `utils/Makefile` gives each long sequence of commands a short name, called a **target**. You run a target with `make`, from inside the `utils/` folder.

## Terraform: the AWS foundation

**Terraform** reads `.tf` files describing AWS resources and makes AWS match them.

<figure class="diagram">
--8<-- "diagrams/tf-cycle.svg"
<figcaption>Terraform compares what should exist with what it built last time, then changes only the difference. Never delete the state file by hand: without it, Terraform can't update or delete what it built.</figcaption>
</figure>

| Command | What it does |
|---|---|
| `terraform plan` | Lists what it would change |
| `terraform apply` | Makes those changes |
| `terraform destroy` | Deletes everything the files describe |

Terraform also installs the helper programs inside the cluster, using **Helm**, an installer for Kubernetes software. Its files are in `utils/eks/` (the cluster and everything around it) and `utils/ecr/` (the challenge image registry).

## Pulumi: what runs on the cluster

**Pulumi** does the same job, but the description is a program, here written in Go.

| Folder | What Pulumi creates |
|---|---|
| `utils/ctfd/` | CTFd, its MariaDB database and Redis cache, and the Ingress for `ctf.<your-domain>` |
| `utils/web-shared/` | A Deployment, Service and Ingress for each web challenge |
| `utils/shared-tcp/` | A Deployment and a load-balanced Service for each pwn challenge |

Each folder has one **stack**, named after the event, such as `wh-2027`. Pulumi keeps its state in an S3 bucket and locks the secret parts with a **passphrase** stored in Secrets Manager.

## Other tools

| Tool | What it does |
|---|---|
| `builder.py` | Builds every challenge's image, uploads it to ECR, and runs Pulumi for the challenges. `make build-images` runs it |
| **ctfcli** | CTFd's own tool. Reads each `challenge.yml` (name, description, flag, files) and loads the challenge into CTFd |
| `secrets.py` | Reads and writes the secrets in Secrets Manager |

## Settings files

These hold your event's values, such as its name and domain. None contains a password, and git ignores all of them, so they are never uploaded.

| File | Read by |
|---|---|
| `utils/eks/terraform.tfvars.json` | Terraform, for the cluster |
| `utils/ecr/terraform.tfvars` | Terraform, for the image registry |
| `utils/config.ini` | The Makefile, `builder.py` and the helper scripts |
| `.ctf/config` | ctfcli: the scoreboard's address and an access token |

**Next:** [Open a terminal](../setup/terminal.md).
