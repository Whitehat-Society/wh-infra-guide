# Infrastructure as code

Building the system by clicking through the AWS console would take days, and nobody could repeat it exactly the next time. Instead, files in the repository describe every part of the system, and tools turn those files into real resources. This approach is called **infrastructure as code**, and it means you can delete everything after the event and rebuild an identical system next year.

## The whole deploy in four commands

<figure class="diagram">
--8<-- "diagrams/who-builds.svg"
<figcaption>Each deploy step is one short command, and teardown runs the same tools in reverse order.</figcaption>
</figure>

The file `utils/Makefile` gives each long sequence of commands a short name, which is called a **target**. You run a target by typing `make` followed by its name, from inside the `utils/` folder.

## Terraform builds the AWS foundation

**Terraform** reads `.tf` files that describe AWS resources, and it changes AWS until the resources match those files.

<figure class="diagram">
--8<-- "diagrams/tf-cycle.svg"
<figcaption>Terraform compares what should exist with what it built last time, and then changes only the difference. Never delete the state file by hand, because without it Terraform can neither update nor delete what it built.</figcaption>
</figure>

| Command | What it does |
|---|---|
| `terraform plan` | Lists the changes it would make. |
| `terraform apply` | Makes those changes. |
| `terraform destroy` | Deletes everything the files describe. |

Terraform also installs the helper programs inside the cluster, using **Helm**, which is an installer for Kubernetes software. The Terraform files are in `utils/eks/`, which covers the cluster and everything around it, and in `utils/ecr/`, which covers the registry for challenge images.

## Pulumi builds what runs on the cluster

**Pulumi** does the same job as Terraform, but its description is written as a program, in this case in the Go language.

| Folder | What Pulumi creates |
|---|---|
| `utils/ctfd/` | CTFd, its MariaDB database and Redis cache, and the Ingress for `ctf.<your-domain>` |
| `utils/web-shared/` | A Deployment, a Service and an Ingress for each web challenge |
| `utils/shared-tcp/` | A Deployment and a load-balanced Service for each pwn challenge |

Each folder has one **stack** named after the event, such as `wh-2027`. Pulumi keeps its records of what it built in an S3 bucket, and it locks the secret parts of those records with a **passphrase** stored in Secrets Manager.

## Other tools

| Tool | What it does |
|---|---|
| `builder.py` | Builds every challenge's image, uploads the images to ECR, and runs Pulumi for the challenges. `make build-images` runs it. |
| **ctfcli** | CTFd's own tool. It reads each challenge's `challenge.yml`, which holds the name, description, flag and files, and loads the challenge into CTFd. |
| `secrets.py` | Reads and writes the secrets kept in Secrets Manager. |

## Settings files

These files hold your event's own values, such as its name and its domain. None of them contains a password, and git ignores all of them, so they are never uploaded to GitHub.

| File | Read by |
|---|---|
| `utils/eks/terraform.tfvars.json` | Terraform, for the cluster |
| `utils/ecr/terraform.tfvars` | Terraform, for the image registry |
| `utils/config.ini` | The Makefile, `builder.py` and the helper scripts |
| `.ctf/config` | ctfcli, which reads the scoreboard's address and an access token from it |

**Next:** [Open a terminal](../setup/terminal.md).
