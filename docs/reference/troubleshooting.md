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
| `Pending` | Kubernetes can't find room for the pod, or can't attach its disk | `kubectl describe pod <pod> -n <namespace>` and read **Events** at the bottom. If it says `Insufficient cpu` or `Insufficient memory`, wait 5 minutes for a new computer, or [add one now](../operate/scaling.md) |
| `ImagePullBackOff` | Kubernetes can't download the pod's image | `kubectl describe pod` shows the image address. Check the account ID in it is yours, and that the image exists: `aws ecr describe-images --repository-name <repository>` |
| `CrashLoopBackOff` | The program starts and then exits, over and over | `kubectl logs <pod> -n <namespace> --previous` shows the output of the last failed start |
| `OOMKilled` | The program used more memory than allowed (512 MB for challenges), so Kubernetes stopped it | Raise the memory limit in `utils/web-shared/main.go` or `utils/shared-tcp/main.go`, then `make build-images` |

## By message

| Message or symptom | Cause | Fix |
|---|---|---|
| `ExpiredToken` or `SSO session ... expired` | Your 8-hour AWS login ended | `aws sso login`, then rerun the command |
| `Unable to connect to the server` from `kubectl` | `kubectl` doesn't know the cluster's address, or the cluster was deleted | `cd ~/wh/wh-2026/utils && make kubeconfig` |
| A Service's `EXTERNAL-IP` stays `<pending>` | The load balancer controller can't create the load balancer | `kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller --tail=50`. A permissions error means `make deploy-eks` didn't finish; rerun it |
| A name doesn't resolve (`dig` prints nothing) | ExternalDNS hasn't created the record, or your domain doesn't point at Route 53 | `kubectl logs -n external-dns -l app.kubernetes.io/name=external-dns --tail=30`, and check `dig +short NS <your-domain>` |
| The browser warns about the certificate | cert-manager hasn't got the certificate yet, or Let's Encrypt refused because it issued the same certificate 5 times this week | `kubectl describe certificate -A` gives the reason. `kubectl logs -n cert-manager deploy/cert-manager --tail=50` gives detail |
| A web challenge answers `503` | The request limit, 20 a second per address | See [Rate limits](../operate/risks.md#rate-limits) |
| Pulumi: `the stack is currently locked` | An earlier Pulumi run was interrupted and left a lock | Set the [Pulumi variables](#pulumi-variables), then `pulumi -C <folder> cancel --yes` |
| Pulumi: `incorrect passphrase` | The passphrase is wrong, or a settings file from WH-2026 is still present | Delete any `Pulumi.wh-2026.yaml`. Never change the passphrase of a running system |
| Terraform: `No valid credential sources found` | You signed in with `aws login` instead of `aws sso login`, and Terraform can't read that kind of login | Use the Identity Center profile from [Sign in from the terminal](../accounts/cli-login.md). Or add a profile that hands Terraform the CLI's keys: `credential_process = aws configure export-credentials --profile <yours> --format process` |
| Python scripts: `Missing Dependency: Using the login credential provider requires an additional dependency` | Same cause, in `secrets.py` and `builder.py` | `pip install "botocore[crt]"` |
| `explicit deny in a service control policy` | Your account is a Free-plan project that only allows one region | Use that region everywhere; see [Which kind of account you have](../accounts/aws.md#which-kind-of-account-you-have) |
| `Cannot connect to the Docker daemon` or `docker.sock: no such file` | Docker isn't running | Windows and macOS: start Docker Desktop and wait for it to say *Engine running*. Linux: `sudo systemctl start docker` |
| Docker: `error getting credentials` … `A specified logon session does not exist` | On Windows, Docker in Ubuntu tries to use the Windows password store and can't | Remove the line `"credsStore": "desktop.exe"` from `~/.docker/config.json`, then retry |
| Terraform: `Error acquiring the state lock` | Another Terraform run is going, or one crashed and left a lock | Make sure nobody else is deploying, then `terraform -chdir=eks force-unlock <LOCK_ID>` with the ID from the message |
| Terraform: `secret ... scheduled for deletion` | A teardown less than 7 days ago deleted the secret | `make restore-secrets`, then rerun `make deploy-eks` |

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
