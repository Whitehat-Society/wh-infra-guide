# Code map

This page is for whoever maintains `wh-base`. It lists every file, command and setting, and says which page of the guide explains it, so that a change to the code also shows you which page to update. The guide's `scripts/check_code.py` compares this guide with the code, and the repository's checks run it on every pull request to `Whitehat-Society/wh-base`, so a change that leaves the guide behind fails before it is merged. Forks skip this check, because a fork's code may differ from this guide.

## Commands

Every command runs from `utils/`, and `make` on its own prints the main ones.

| Command | What it does | Explained in |
|---|---|---|
| `make settings` | Prints every name the other commands use. | [Your settings](../code/make-it-yours.md) |
| `make secrets` | Creates the secret, or restores it after a teardown, generates the passwords and asks for the rest. | [Secrets](../code/config.md) |
| `make deploy-eks` | Terraform, in two rounds, then a check for DNS records left by an earlier cluster. | [1. The cluster](../deploy/eks.md) |
| `make secret-handover` | Hands the secret to Terraform. `make deploy-eks` runs it between its two rounds. | [1. The cluster](../deploy/eks.md) |
| `make dns-clean OWNER=<old-event>-eks` | Deletes the DNS records an earlier cluster left behind. | [Troubleshooting](troubleshooting.md#names-and-addresses) |
| `make kubeconfig` | Points `kubectl` at the cluster. Every command that uses the cluster runs it first. | [1. The cluster](../deploy/eks.md) |
| `make ecr-login` | Logs Docker in to ECR. `make build-ctfd` runs it first. | [2. The scoreboard](../deploy/ctfd.md) |
| `make build-ctfd` | Builds `ctfd/image` and pushes it. | [2. The scoreboard](../deploy/ctfd.md) |
| `make deploy-ctfd` | `make build-ctfd`, then the CTFd Pulumi program with the image pinned to its digest. | [2. The scoreboard](../deploy/ctfd.md) |
| `make build-images` | Runs `builder/builder.py`. | [3. The challenges](../deploy/challenges.md) |
| `make deploy-ctfd-backup-cronjob` | Applies the hourly backup job with the event's bucket and region filled in. | [4. Backups and health checks](../deploy/day2.md) |
| `make backup-ctfd` | Runs one backup now. | [Backup and restore](../operate/backups.md) |
| `make restore-ctfd FILE=<backup>` | Runs `utils/restore-ctfd.sh`, which loads a backup into MariaDB with CTFd stopped. With no `FILE`, it lists the backups. | [Backup and restore](../operate/backups.md) |
| `make deploy-healthcheck-cronjob` | Uploads the health check, the list of challenges and the alert webhook, and applies the job. | [4. Backups and health checks](../deploy/day2.md) |
| `make run-healthcheck` | Runs one health check now. | [4. Backups and health checks](../deploy/day2.md) |
| `make smoke-test` | Runs the health check from your computer, without posting to Discord. | [5. Final checks](../deploy/verify.md) |
| `make validate` | Checks every `challenge.yml`, the Terraform files and the Go programs, with no AWS account needed. | [Hand it in](../write/submit.md) |
| `make test` | Runs the builder's tests. | This page |
| `make destroy` | Pulumi, the DNS records, Terraform and the event's log groups, in that order. It stops if Pulumi fails. | [Delete everything](../teardown.md) |

## Files

| File | What it holds | Explained in |
|---|---|---|
| `utils/Makefile` | Every command above. | This page |
| `utils/settings.py` | Works out every name from `eks/terraform.tfvars.json`. | [Your settings](../code/make-it-yours.md) |
| `utils/config.ini` | `categories`, the folders that hold challenges, and `shared_web_replicas` and `shared_tcp_replicas`, the copies of each challenge. | [Your settings](../code/make-it-yours.md#the-other-settings-file), [Adding capacity](../operate/scaling.md) |
| `utils/secrets.py` | `get`, `list`, `set` and `bootstrap` for the secret. | [Secrets](../code/config.md) |
| `utils/secret_store.py` | The functions that read and write the secret, used by `secrets.py` and the builder. | This page |
| `utils/challenge_targets.py` | Finds every challenge folder and names each challenge's address. Run on its own, it prints the list the health check uses. | [4. Backups and health checks](../deploy/day2.md) |
| `utils/healthcheck.py` | Checks every web and pwn challenge and posts failures to Discord. | [Watching the system](../operate/monitoring.md) |
| `utils/validate_challenges.py` | Checks every `challenge.yml`. | [Hand it in](../write/submit.md) |
| `utils/dns_records.py` | Finds and deletes DNS records by the cluster that made them. | [Troubleshooting](troubleshooting.md#names-and-addresses) |
| `utils/builder/builder.py` | Builds and pushes the images, runs Pulumi, loads CTFd and fills in each address. Its tests are in `utils/builder/tests/`. | [3. The challenges](../deploy/challenges.md) |
| `utils/challenges/main.go` | The Pulumi program for every web and pwn challenge. | [5 · The challenges](../concepts/challenges.md) |
| `utils/ctfd/main.go` | The Pulumi program for CTFd, MariaDB and Redis. | [4 · The scoreboard](../concepts/scoreboard.md) |
| `utils/ctfd/image/Dockerfile` | The CTFd image: the official one plus the Discord plugin. | [4 · The scoreboard](../concepts/scoreboard.md) |
| `utils/ctfd/backup-cronjob.yaml`, `utils/ctfd/healthcheck-cronjob.yaml` | The two scheduled jobs. | [6 · Alarms and backups](../concepts/safety.md) |
| `utils/eks/terraform.tfvars.json` | The event's settings, the one file you edit. | [Your settings](../code/make-it-yours.md) |
| `utils/eks/variables.tf` | The settings Terraform accepts, with their defaults. | [Your settings](../code/make-it-yours.md) |
| `utils/eks/vpc.tf` | The network. | [2 · The network](../concepts/network.md) |
| `utils/eks/main.tf` | The cluster, its nodes, the buckets, the image registries, the secret and the disk type. | [2 · The network](../concepts/network.md), [3 · Kubernetes](../concepts/kubernetes.md) |
| `utils/eks/helm.tf`, `utils/eks/cert-manager.tf` | The helper programs, and the certificate issuer. | [3 · Kubernetes](../concepts/kubernetes.md) |
| `utils/eks/iam.tf` | The AWS permissions each helper and the backup job run with. | [3 · Kubernetes](../concepts/kubernetes.md) |
| `utils/eks/observability.tf` | The alarms, the dashboard and the program that reposts alarms in Discord, whose code is `utils/eks/lambda/sns_to_discord.py`. | [6 · Alarms and backups](../concepts/safety.md) |
| `utils/eks/outputs.tf` | The one value Terraform hands on, the backup job's role, which `make deploy-ctfd` reads. | This page |
| `utils/restore-ctfd.sh` | Checks a backup, pauses the backups, stops CTFd, loads the file, clears the cache and starts everything again. A failure after CTFd stops leaves it stopped. | [Backup and restore](../operate/backups.md) |
| `utils/eks/pre-destroy.sh` | Run by `terraform destroy` before the cluster goes. It deletes the load balancers, security groups and network interfaces that the cluster's controllers made. | [Delete everything](../teardown.md#why-the-order-matters) |
| `.github/workflows/validate.yml` | The checks on every pull request. | [Hand it in](../write/submit.md) |

## Names from settings.py

Every name below comes from `event_name`, `aws_region` and `domain_name`, and `python3 settings.py <name>` prints one of them.

| Name | Value, for the event `wh-2027` and the domain `example-ctf.com` |
|---|---|
| `event`, `stack` | `wh-2027`, which also names the Pulumi stacks |
| `region` | `ap-southeast-1` |
| `domain` | `example-ctf.com` |
| `ctf_url` | `https://ctf.example-ctf.com` |
| `challenge_domain` | `challenges.example-ctf.com` |
| `cluster` | `wh-2027-eks`, which is also the owner of every DNS record the cluster makes |
| `state_bucket`, `backup_bucket` | `wh-2027-pulumi-state` and `wh-2027-ctfd-backups` |
| `secret_name` | `wh-2027/config` |
| `account` | The AWS account's 12-digit ID |
| `registry` | `<account>.dkr.ecr.ap-southeast-1.amazonaws.com` |
| `challenge_repo`, `ctfd_repo` | `<registry>/wh-2027` and `<registry>/wh-2027-ctfd` |

## When you change the code

1. Change the code, and then run `python3 scripts/check_code.py <path to wh-base>` in the guide's repository.
2. Fix every line it prints, in the guide or in the code, and update the pages in the *Explained in* column.
3. If the change alters what a command prints, update the page that quotes it, because the check only notices quoted messages that no longer exist.
