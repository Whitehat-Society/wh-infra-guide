# Troubleshooting

When something is wrong and you don't know where, start with these three commands, because most problems show up in one of them.

```bash
kubectl get pods -A | grep -v -e Running -e Completed
kubectl get events -A --sort-by=.lastTimestamp | tail -20
aws sts get-caller-identity
```

The first command lists every pod that isn't running normally, and its `STATUS` column names the problem, which the table below explains. The second shows the last 20 things Kubernetes did or tried to do, with the newest last, and any failure appears there with a reason. The third checks that your AWS login still works.

## Pod states

| Status | What it means | What to do |
|---|---|---|
| `Pending` | Kubernetes can't find room for the pod, or it can't attach the pod's disk. | Run `kubectl describe pod <pod> -n <namespace>` and read the **Events** at the bottom. If they say `Insufficient cpu`, `Insufficient memory` or `Too many pods`, wait 5 minutes for a new computer, or [add one now](../operate/scaling.md). If they say `volume node affinity conflict`, see [When a computer fails](../operate/risks.md#when-a-computer-fails). |
| `ImagePullBackOff` | Kubernetes can't download the pod's image. | `kubectl describe pod` shows the image address. Check that the account ID in it is yours, and that the image exists with `aws ecr describe-images --repository-name <repository>`. |
| `CrashLoopBackOff` | The program starts and then exits, over and over again. | `kubectl logs <pod> -n <namespace> --previous` shows the output from the last failed start. |
| `OOMKilled` | The program used more memory than it is allowed (512 MB for challenges), so Kubernetes stopped it. | Raise the memory limit (`Limits`, in the `run` function of `utils/challenges/main.go`), and then run `make build-images`. |

## By message

Find the group that matches what you were doing, and then the line that matches what you see.

### Signing in

| Message or symptom | Cause | Fix |
|---|---|---|
| `ExpiredToken` or `SSO session ... expired` | Your 8-hour AWS login has ended. | Run `aws sso login`, and then run the command again. |
| Terraform: `No valid credential sources found` | You signed in with `aws login` instead of `aws sso login`, and Terraform can't read that kind of login. | Use the Identity Center profile from [Sign in from the terminal](../accounts/cli-login.md), or add a profile that hands Terraform the CLI's keys with `credential_process = aws configure export-credentials --profile <yours> --format process`. |
| Python scripts: `Missing Dependency: Using the login credential provider requires an additional dependency` | This has the same cause as the line above, but in `secrets.py` and `builder.py`. | Run `pip install "botocore[crt]"`. |
| `explicit deny in a service control policy` | Your account is a Free-plan project that only allows one region. | Use that region everywhere, as described in [Which kind of account you have](../accounts/aws.md#which-kind-of-account-you-have). |
| `Unable to connect to the server` from `kubectl` | `kubectl` doesn't know the cluster's address, or the cluster has been deleted. | Run `cd ~/wh/wh-2027/utils && make kubeconfig`. |
| `You must be logged in to the server (Unauthorized)` from `kubectl`, while `aws` commands work | The cluster only lets in the AWS role that created it, and you signed in as a different one, for example with another permission set or with `aws login`. | Sign in through the same permission set as whoever ran `make deploy-eks`. If you can't, follow [Let another role into the cluster](#let-another-role-into-the-cluster). |

#### Let another role into the cluster

1. On the teammate's computer, print the full name of the role they sign in as, and send the output to whoever deployed the cluster:
    ```bash
    aws iam get-role --role-name "$(aws sts get-caller-identity --query Arn --output text | cut -d/ -f2)" --query Role.Arn --output text
    ```
2. On the deployer's computer, give that role full access to the cluster, replacing `<role>` with the output from step 1:
    ```bash
    cd ~/wh/wh-2027/utils
    CLUSTER=$(python3 settings.py cluster)
    aws eks create-access-entry --cluster-name "$CLUSTER" --principal-arn <role>
    aws eks associate-access-policy --cluster-name "$CLUSTER" --principal-arn <role> \
      --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy --access-scope type=cluster
    ```
3. On the teammate's computer, run `make kubeconfig` and then `kubectl get nodes`, which should now list the nodes.

The access lasts until the cluster is deleted, so repeat these steps after each fresh deploy.

### Names and addresses

| Message or symptom | Cause | Fix |
|---|---|---|
| A name doesn't resolve, and `dig` prints nothing | ExternalDNS hasn't created the record yet, or your domain doesn't point at Route 53. | Read `kubectl logs -n external-dns -l app.kubernetes.io/name=external-dns --tail=30`, and check `dig +short NS <your-domain>`. |
| A name doesn't resolve, but the ExternalDNS log only says `All records are already up to date` | The record exists but belongs to an earlier event's cluster, so ExternalDNS leaves it alone, and it still points at that cluster's deleted load balancer. | Run `python3 dns_records.py check` in `utils/`, and remove the old records with the `make dns-clean OWNER=<old-event>-eks` command it prints. Then wait 15 minutes, because resolvers remember the earlier "doesn't exist" answer. |
| The browser says `ERR_NAME_NOT_RESOLVED`, but `dig` or Google's DNS finds the name | Your computer or router remembered "doesn't exist" from before the record was created. | Wait up to 15 minutes and try again. On Windows, running `ipconfig /flushdns` in PowerShell clears your computer's copy. |
| Still `ERR_NAME_NOT_RESOLVED` or `Non-existent domain` after 15 minutes, and `nslookup <your-domain>` fails for the domain itself | Your internet provider blocks the whole domain, which happens with free domain services. | For Chrome only, open **Settings → Privacy and security → Security → Use secure DNS** and choose **Google (Public DNS)**. To fix the whole computer, terminal tools included, open Windows **Settings → Network & internet → Wi-Fi →** your network **→ Hardware properties → DNS server assignment → Edit → Manual**, set IPv4 to `8.8.8.8` and `1.1.1.1`, and set IPv6 to `2001:4860:4860::8888` and `2606:4700:4700::1111`. On a phone hotspot the block usually doesn't apply. |
| Chrome opens the CTF, but a terminal tool fails with `NameResolutionError` or `Name or service not known` | Chrome's secure DNS setting skips your router, but the terminal still uses it. | Change the computer's DNS as described in the line above. |
| A terminal tool fails with `NameResolutionError` only sometimes, and the same command works when you run it again | WSL passes name lookups through a relay inside Windows, which drops a few of them. A build makes hundreds of lookups, so one of them usually fails. You can confirm it with `python3 -c "import socket; print(sum(1 for _ in range(60) if not socket.getaddrinfo('ctf.<your-domain>', 443)))"`, which raises an error within a few runs. | Make WSL ask public DNS servers directly. In Ubuntu, run `printf '[network]\ngenerateResolvConf = false\n' \| sudo tee -a /etc/wsl.conf`, then run `wsl --shutdown` in PowerShell. Reopen Ubuntu and run `sudo rm /etc/resolv.conf && printf 'nameserver 8.8.8.8\nnameserver 1.1.1.1\n' \| sudo tee /etc/resolv.conf`. |
| The browser warns about the certificate | cert-manager hasn't got the certificate yet, or Let's Encrypt refused because it has issued the same certificate 5 times this week. | `kubectl describe certificate -A` gives the reason, and `kubectl logs -n cert-manager deploy/cert-manager --tail=50` gives more detail. |
| A web challenge answers `503` | The request limit of 20 a second for each address has been reached. | See [Rate limits](../operate/risks.md#rate-limits). |
| A Service's `EXTERNAL-IP` stays `<pending>` | The load balancer controller can't create the load balancer. | Read `kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller --tail=50`. A permissions error means `make deploy-eks` didn't finish, so run it again. |

### Deploying challenges

| Message or symptom | Cause | Fix |
|---|---|---|
| `creating failed` or `updating failed` for a `Deployment`, after Pulumi waits 10 minutes | One challenge's pods never became ready, so Pulumi stopped, and the builder skipped every step after it, including loading CTFd. | `kubectl get pods -n challenges-web; kubectl get pods -n challenges-tcp` shows the broken challenge. Fix it using the lines below, and then run `make build-images` again. |
| A pod shows `StartError` or `RunContainerError`, and `kubectl describe pod` says `executable file not found` | The Dockerfile starts a program that its final image doesn't contain, often `socat`. | Fix the Dockerfile, following [Rules for the Dockerfile](../write/server.md#rules-for-the-dockerfile). |
| After a rebuild, the challenge still behaves like the old version | Kubernetes is running the image it downloaded before. | See [Old code still running](../operate/data.md#old-code-still-running). |
| A challenge disappeared from the cluster after `make build-images` | Its image failed to build, so the builder left it out, and Pulumi deleted what it no longer saw. | The run's last line, `FAILED, and left out of this run:`, names the challenge, and its `ERROR <folder>:` line further up gives the reason. Fix the problem, and run `make build-images` again. |
| The build ends with `NameResolutionError` or `JSONDecodeError` from `ctf` | The images and pods are deployed, but ctfcli couldn't reach CTFd. | Fix the cause, which is usually in [Names and addresses](#names-and-addresses) or an unfinished [CTFd setup](../deploy/ctfd.md), and then run `make build-images` again, which loads the challenges and fills in their addresses. |
| A challenge shows twice in CTFd | Its `name:` was changed after it was loaded. | See [Rename a challenge](../operate/change.md#rename-a-challenge). |

### CTFd

| Message or symptom | Cause | Fix |
|---|---|---|
| Scores, challenges or settings look out of date after a restore, or after a change made directly in the database | CTFd's cache in Redis still holds the old copies. | [Clear CTFd's cache](../operate/data.md#clear-ctfds-cache). |
| Players are logged out after you cleared the cache | Logins are kept in the same cache. | This is expected, and players simply log in again. |

### Pulumi and Terraform

| Message or symptom | Cause | Fix |
|---|---|---|
| Pulumi: `the stack is currently locked` | An earlier Pulumi run was interrupted and left a lock behind. | Set the [Pulumi variables](#pulumi-variables), and then run `pulumi -C <folder> cancel --yes`. |
| Pulumi: `incorrect passphrase` | The `pulumi_passphrase` secret was changed after Pulumi first used it. | Put the old value back with `python3 secrets.py set pulumi_passphrase <old value>`, and never change the passphrase of a running system. |
| Terraform: `Error acquiring the state lock` | Another Terraform run is in progress, or one crashed and left a lock behind. | Make sure nobody else is deploying, and then run `terraform -chdir=eks force-unlock <LOCK_ID>` with the ID from the message. |
| Terraform: `secret ... scheduled for deletion` | A teardown less than 7 days ago deleted the secret. | Run `make secrets`, which restores it with its old values, and then `make deploy-eks` again. |

### Docker

| Message or symptom | Cause | Fix |
|---|---|---|
| `Cannot connect to the Docker daemon` or `docker.sock: no such file` | Docker isn't running. | On Windows and macOS, start Docker Desktop and wait for it to say *Engine running*. On Linux, run `sudo systemctl start docker`. |
| Docker: `error getting credentials` … `A specified logon session does not exist` | On Windows, Docker in Ubuntu tries to use the Windows password store and can't. | Remove the line `"credsStore": "desktop.exe"` from `~/.docker/config.json`, and try again. |

## Pulumi variables

Every Pulumi command that you run by hand needs these variables to be set first:

--8<-- "pulumi-env.md"

## Asking for help

When you post in the tech and infra channel, include these four things, which are usually enough for someone to help you straight away:

1. The page and step number you're on.
2. The exact command you ran.
3. The first line of the error, pasted as text rather than as a screenshot.
4. If the cluster is involved, the output of `kubectl get pods -A | grep -v Running`.

The original runbooks from WH-2026, which have more technical detail, are in the `Whitehat-Society/wh-2026` repository under `docs/ops/`. Their commands use WH-2026's names and older copies of the tools, so read them for background rather than running them.
