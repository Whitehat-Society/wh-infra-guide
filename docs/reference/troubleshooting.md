# Troubleshooting

When something is wrong and you don't know where, start with these three commands. Most problems show up in one of them.

```bash
kubectl get pods -A | grep -v -e Running -e Completed
kubectl get events -A --sort-by=.lastTimestamp | tail -20
aws sts get-caller-identity
```

1. The first lists every pod that isn't running normally. Its `STATUS` column names the problem, and the table below explains each status.
2. The second shows the last 20 things Kubernetes did or tried to do, newest last. Failures appear with a reason.
3. The third checks that your AWS login still works.

## Pod states

| Status | What it means | What to do |
|---|---|---|
| `Pending` | Kubernetes can't find room for the pod, or can't attach its disk | `kubectl describe pod <pod> -n <namespace>` and read **Events** at the bottom. If it says `Insufficient cpu`, `Insufficient memory` or `Too many pods`, wait 5 minutes for a new computer, or [add one now](../operate/scaling.md). If it says `volume node affinity conflict`, see [When a computer fails](../operate/risks.md#when-a-computer-fails) |
| `ImagePullBackOff` | Kubernetes can't download the pod's image | `kubectl describe pod` shows the image address. Check the account ID in it is yours, and that the image exists: `aws ecr describe-images --repository-name <repository>` |
| `CrashLoopBackOff` | The program starts and then exits, over and over | `kubectl logs <pod> -n <namespace> --previous` shows the output of the last failed start |
| `OOMKilled` | The program used more memory than allowed (512 MB for challenges), so Kubernetes stopped it | Raise the memory limit in `utils/web-shared/main.go` or `utils/shared-tcp/main.go`, then `make build-images` |

## By message

Find the group that matches what you were doing, then the line that matches what you see.

### Signing in

| Message or symptom | Cause | Fix |
|---|---|---|
| `ExpiredToken` or `SSO session ... expired` | Your 8-hour AWS login ended | `aws sso login`, then rerun the command |
| Terraform: `No valid credential sources found` | You signed in with `aws login` instead of `aws sso login`, and Terraform can't read that kind of login | Use the Identity Center profile from [Sign in from the terminal](../accounts/cli-login.md). Or add a profile that hands Terraform the CLI's keys: `credential_process = aws configure export-credentials --profile <yours> --format process` |
| Python scripts: `Missing Dependency: Using the login credential provider requires an additional dependency` | Same cause, in `secrets.py` and `builder.py` | `pip install "botocore[crt]"` |
| `explicit deny in a service control policy` | Your account is a Free-plan project that only allows one region | Use that region everywhere; see [Which kind of account you have](../accounts/aws.md#which-kind-of-account-you-have) |
| `Unable to connect to the server` from `kubectl` | `kubectl` doesn't know the cluster's address, or the cluster was deleted | `cd ~/wh/wh-2026/utils && make kubeconfig` |

### Names and addresses

| Message or symptom | Cause | Fix |
|---|---|---|
| A name doesn't resolve (`dig` prints nothing) | ExternalDNS hasn't created the record, or your domain doesn't point at Route 53 | `kubectl logs -n external-dns -l app.kubernetes.io/name=external-dns --tail=30`, and check `dig +short NS <your-domain>` |
| The browser says `ERR_NAME_NOT_RESOLVED`, but `dig` or Google's DNS finds the name | Your computer or router remembered "doesn't exist" from before the record was created | Wait up to 15 minutes, then retry. On Windows, `ipconfig /flushdns` in PowerShell clears your computer's copy |
| Still `ERR_NAME_NOT_RESOLVED` or `Non-existent domain` after 15 minutes, and `nslookup <your-domain>` fails for the domain itself | Your internet provider blocks the whole domain, which happens with free domain services | For Chrome only: **Settings → Privacy and security → Security → Use secure DNS → Google (Public DNS)**. For the whole computer, terminal tools included: Windows **Settings → Network & internet → Wi-Fi → your network → Hardware properties → DNS server assignment → Edit → Manual**. Set IPv4 to `8.8.8.8` and `1.1.1.1`, and IPv6 to `2001:4860:4860::8888` and `2606:4700:4700::1111`. On a phone hotspot the block usually doesn't apply |
| Chrome opens the CTF, but a terminal tool fails with `NameResolutionError` or `Name or service not known` | Chrome's secure DNS setting skips your router; the terminal still uses it | Change the computer's DNS as in the line above |
| A terminal tool fails with `NameResolutionError` only sometimes, and the same command works when rerun | WSL passes name lookups through a relay inside Windows, which drops a few of them. A build makes hundreds of lookups, so one usually fails. Check: `python3 -c "import socket; print(sum(1 for _ in range(60) if not socket.getaddrinfo('ctf.<your-domain>', 443)))"` raises an error within a few runs | Make WSL ask public DNS servers directly. In Ubuntu: `printf '[network]\ngenerateResolvConf = false\n' \| sudo tee -a /etc/wsl.conf`. In PowerShell: `wsl --shutdown`. Reopen Ubuntu, then: `sudo rm /etc/resolv.conf && printf 'nameserver 8.8.8.8\nnameserver 1.1.1.1\n' \| sudo tee /etc/resolv.conf` |
| The browser warns about the certificate | cert-manager hasn't got the certificate yet, or Let's Encrypt refused because it issued the same certificate 5 times this week | `kubectl describe certificate -A` gives the reason. `kubectl logs -n cert-manager deploy/cert-manager --tail=50` gives detail |
| A web challenge answers `503` | The request limit, 20 a second per address | See [Rate limits](../operate/risks.md#rate-limits) |
| A Service's `EXTERNAL-IP` stays `<pending>` | The load balancer controller can't create the load balancer | `kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller --tail=50`. A permissions error means `make deploy-eks` didn't finish; rerun it |

### Deploying challenges

| Message or symptom | Cause | Fix |
|---|---|---|
| `Required plugins are not installed` | Terraform for the image registry was never prepared on this computer | `terraform -chdir=ecr init`, then `make build-images` |
| `No such file or directory: 'oras'` | The `oras` tool isn't installed | Install it as in [Install the tools](../setup/pc.md#2-install-the-other-programs) |
| `Challenge name must be alphanumeric with hyphens only` | An older `builder.py` that only accepts names like `xoph-dark-embers` | Update `utils/builder/builder.py` from the repository's `main` branch, which accepts any name |
| `creating failed` or `updating failed` for a `Deployment`, after Pulumi waits 10 minutes | One challenge's pods never became ready, so Pulumi stopped, and the builder skipped every step after it, including loading CTFd | `kubectl get pods -n challenges-web; kubectl get pods -n challenges-tcp` shows the broken one; fix it with the lines below, then rerun `make build-images` |
| A pod shows `StartError` or `RunContainerError`, and `kubectl describe pod` says `executable file not found` | The Dockerfile starts a program its final image doesn't contain, often `socat` | Fix the Dockerfile; see [Rules for the Dockerfile](../write/server.md#rules-for-the-dockerfile) |
| After a rebuild, the challenge still behaves like the old version | Kubernetes is running the image it downloaded before | See [Old code still running](../operate/data.md#old-code-still-running) |
| A challenge disappeared from the cluster after `make build-images` | Its image failed to build, so the builder left it out, and Pulumi deleted what it no longer saw | Scroll up in the output to the challenge's `Error` line, fix it, and rerun `make build-images` |
| `filelocker` fails with `go install github.com/air-verse/air@latest` | `filelocker` needs the optional chall-manager, and its Dockerfile downloads a tool that no longer builds | Expected. Leave it hidden, or see the [chall-manager appendix](chall-manager.md) |
| The build ends with `NameResolutionError` or `JSONDecodeError` from `ctf` | The images and pods are deployed, but ctfcli couldn't reach CTFd | Fix the cause (see [Names and addresses](#names-and-addresses), or finish [CTFd's setup](../deploy/ctfd.md)), then run `cd ~/wh/wh-2026 && ctf challenge install && cd utils && make build-images` so the addresses are filled in. `ctf challenge install` ends with `Install failed for:` and a list of the challenges that were already loaded; that is expected |
| A challenge shows twice in CTFd | Its `name:` was changed after it was loaded | See [Rename a challenge](../operate/change.md#rename-a-challenge) |

### CTFd

| Message or symptom | Cause | Fix |
|---|---|---|
| `missing configuration value 'backup_irsa_arn'` | Your copy of `utils/Makefile` is older than the fix that passes this setting to Pulumi | Set it once by hand, then rerun `make deploy-ctfd`: `pulumi -C ctfd config set backup_irsa_arn "$(terraform -chdir=eks output -raw ctfd_backup_irsa_arn)"`, after the [Pulumi variables](#pulumi-variables) |
| Scores, challenges or settings look out of date after a restore or a change made directly in the database | CTFd's cache in Redis still holds the old copies | [Clear CTFd's cache](../operate/data.md#clear-ctfds-cache) |
| Players are logged out after you cleared the cache | Logins are kept in the same cache | Expected; they log in again |

### Pulumi and Terraform

| Message or symptom | Cause | Fix |
|---|---|---|
| Pulumi: `the stack is currently locked` | An earlier Pulumi run was interrupted and left a lock | Set the [Pulumi variables](#pulumi-variables), then `pulumi -C <folder> cancel --yes` |
| Pulumi: `incorrect passphrase` | The passphrase is wrong, or a settings file from WH-2026 is still present | Delete any `Pulumi.wh-2026.yaml`. Never change the passphrase of a running system |
| Terraform: `Error acquiring the state lock` | Another Terraform run is going, or one crashed and left a lock | Make sure nobody else is deploying, then `terraform -chdir=eks force-unlock <LOCK_ID>` with the ID from the message |
| Terraform: `secret ... scheduled for deletion` | A teardown less than 7 days ago deleted the secret | `make deploy-eks` restores it by itself. If yours doesn't, its `Makefile` is older: run `aws secretsmanager restore-secret --secret-id "$EVENT/config"`, then rerun `make deploy-eks` |
| `make deploy-eks`: `failed calling webhook "mservice.elbv2.k8s.aws"` for `cert_manager` or `amazon-cloudwatch-observability` | Your `eks/*.tf` is older and starts those parts before the load balancer controller is ready | Rerun `make deploy-eks`. If that stops with `cannot re-use a name that is still in use`, run `make kubeconfig`, then `kubectl delete secret -n cert-manager sh.helm.release.v1.cert-manager.v1`, then `make deploy-eks` once more |

### Docker

| Message or symptom | Cause | Fix |
|---|---|---|
| `Cannot connect to the Docker daemon` or `docker.sock: no such file` | Docker isn't running | Windows and macOS: start Docker Desktop and wait for it to say *Engine running*. Linux: `sudo systemctl start docker` |
| Docker: `error getting credentials` … `A specified logon session does not exist` | On Windows, Docker in Ubuntu tries to use the Windows password store and can't | Remove the line `"credsStore": "desktop.exe"` from `~/.docker/config.json`, then retry |

## Pulumi variables

Every Pulumi command you run by hand needs these variables first:

--8<-- "pulumi-env.md"

## Asking for help

Post in the tech and infra channel with:

1. the page and step number you're on
2. the exact command you ran
3. the first line of the error, as text rather than a screenshot
4. if the cluster is involved, the output of `kubectl get pods -A | grep -v Running`

The original runbooks, with more technical detail, are in the wh-2026 repository under `docs/ops/`.
