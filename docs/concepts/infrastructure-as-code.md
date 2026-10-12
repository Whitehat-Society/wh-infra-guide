# Infrastructure as code

<span class="time">Time: about 10 minutes to read</span>

You could build the whole system by clicking through the AWS console. It would take days, nobody could repeat it exactly, and nobody could tell afterwards what had been clicked. Instead, the club describes every part in files, and tools turn those files into real resources. This approach is called **infrastructure as code**.

## Terraform: the AWS foundation

**Terraform** reads files ending in `.tf` that describe AWS resources: the private network, the cluster, the disks, the alarms. Three commands do almost everything:

- `terraform plan` compares the files with what exists and lists what it would change.
- `terraform apply` makes those changes.
- `terraform destroy` deletes everything the files describe.

Terraform records what it created in a **state file**. It uses the state file to know what to update or delete later, so never delete that file by hand.

Terraform also installs the helper programs inside the cluster, using **Helm**, an installer for Kubernetes software. Each Helm package is called a *chart*.

The Terraform files are in `utils/eks/` (the cluster and everything around it) and `utils/ecr/` (the registry for challenge images).

## Pulumi: what runs on the cluster

**Pulumi** does the same job as Terraform, but you write the description as a normal program. Here the programs are written in Go. The club uses Pulumi to put workloads on the cluster:

| Folder | Pulumi creates |
|---|---|
| `utils/ctfd/` | CTFd, its MariaDB database and its Redis cache, plus the Ingress for `ctf.<your-domain>` |
| `utils/web-shared/` | A Deployment, a Service and an Ingress for each web challenge |
| `utils/shared-tcp/` | A Deployment and a load-balanced Service for each pwn challenge |

Each Pulumi folder can have several copies, called **stacks**. This system uses one stack per folder, named after the event, e.g. `wh-2027`. Pulumi also keeps a state file. It stores it in an S3 bucket and encrypts the secret parts with a **passphrase**, a long password stored in Secrets Manager.

## The Makefile: short commands for long ones

Deploying needs long command sequences. For example, read the passphrase, set three settings, then run Pulumi. The file `utils/Makefile` gives each sequence a short name called a **target**. You run a target with `make`, for example `make deploy-ctfd`. The Makefile only works from inside the `utils/` folder.

## Other tools in the repo

- **`builder.py`** (in `utils/builder/`) reads every challenge's settings file, builds each challenge's container image, pushes it to ECR, and runs Pulumi for the challenges. `make build-images` runs it.
- **ctfcli** is CTFd's own command-line tool. It reads each challenge's `challenge.yml` (name, description, flag, files) and loads the challenge into CTFd.
- **`secrets.py`** (in `utils/`) reads and writes the secrets in Secrets Manager.

## Settings files

A few settings files hold values for your event, such as the domain and the event name. None of them contain passwords. Git, the version-control tool, is told to ignore them, so they never get uploaded with the code.

| File | Read by |
|---|---|
| `utils/eks/terraform.tfvars.json` | Terraform, for the cluster |
| `utils/ecr/terraform.tfvars` | Terraform, for the image registry |
| `utils/config.ini` | The Makefile, `builder.py` and the helper scripts |
| `.ctf/config` | ctfcli: the scoreboard's address and an access token |

## Who builds what

Putting it together, a full deploy runs the tools in this order:

<div class="wh">
<div class="card">
<ol class="steps">
  <li><div><span class="cmd">Terraform · utils/eks</span><span>The network, the cluster, the helper programs, the alarms and the backup bucket</span></div></li>
  <li><div><span class="cmd">Docker + Pulumi · utils/ctfd</span><span>The CTFd image, then CTFd, its database and its cache on the cluster</span></div></li>
  <li><div><span class="cmd">builder.py: Docker + Pulumi + ctfcli</span><span>Every challenge image, the web and pwn challenges on the cluster, then every challenge loaded into CTFd</span></div></li>
  <li><div><span class="cmd">kubectl</span><span>The backup and health-check schedules</span></div></li>
</ol>
</div>
</div>

Tearing down runs the same tools in reverse order.

**Next:** [Open a terminal](../setup/terminal.md).
