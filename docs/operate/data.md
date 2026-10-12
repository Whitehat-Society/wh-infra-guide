# Where data is kept

Most confusing problems in this system have one cause: an old copy of something is still being used after you changed it. A rebuilt challenge keeps running its old code, a restored database shows old scores, a deleted name still "doesn't exist" in your browser. This page lists every place a copy is kept, how long it stays, and how to remove it. Use it whenever you change or delete something.

<figure class="diagram">
--8<-- "diagrams/data-map.svg"
<figcaption>Each box keeps its own copy. Changing one doesn't change the others, so a change is complete only when every copy that matters is updated or removed.</figcaption>
</figure>

## The rule

Every kind of data has **one source**, the place you change it. Every other place holds a copy, and a copy is updated only by the command in the last column.

| Data | Source: change it here | Copies | Updated by |
|---|---|---|---|
| Challenge text, flags, hints, files | `challenge.yml` and the files in the challenge's folder | CTFd's database and uploads disk | `ctf challenge sync` |
| Challenge server code | The challenge's folder | ECR image, then each node's image cache | `make build-images` |
| Teams, players, solves, scores | CTFd's database | Redis cache, hourly backups | CTFd itself; see [Clear CTFd's cache](#clear-ctfds-cache) |
| Passwords and tokens | Secrets Manager | Kubernetes Secrets, `.ctf/config`, `healthcheck-webhook` | Rerunning the step that copied them |
| Cluster settings | `utils/eks/terraform.tfvars.json` and the `.tf` files | AWS, Terraform state | `make deploy-eks` |
| Addresses (DNS) | Kubernetes Ingresses and Services | Route 53, then every DNS cache on the way to players | ExternalDNS, then time |

## Every copy, and how to clear it

### On your computer

| Copy | Kept until | Clear or refresh it with |
|---|---|---|
| Docker build cache: image layers from earlier builds | You delete it | `docker builder prune -f` forces a full rebuild. Needed only when a build reuses a layer it shouldn't, e.g. a `RUN git clone` or `RUN apt-get install` that should fetch something newer |
| ECR sign-in for Docker (`~/.docker/config.json`) | 12 hours | Repeat step 1 of [The challenges](../deploy/challenges.md) |
| AWS sign-in (`~/.aws/`) | 8 to 12 hours | [Sign in again](../accounts/cli-login.md) |
| Cluster address (`~/.kube/config`) | You rebuild the cluster | `make kubeconfig`. After a rebuild, the old address points at nothing |
| Terraform state (`utils/eks/terraform.tfstate`, `utils/ecr/terraform.tfstate`) | Forever, **only on this computer** | Never delete it. Copy both files to the club's shared drive after every deploy; without them nobody else can update or delete the system |
| `challenge.yml` lines written by the build (`connection_info:`) | The next build | Nothing; the build rewrites them. Commit them, or discard them with `git checkout -- '*/*/challenge.yml'` |
| DNS answers | Up to 15 minutes for "doesn't exist", 60 seconds for an address | `ipconfig /flushdns` on Windows. Chrome keeps its own copy: open `chrome://net-internals/#dns` and click **Clear host cache** |

### In the AWS account

| Copy | Kept until | Clear or refresh it with |
|---|---|---|
| ECR images, one tag per challenge | Forever. A new push moves the tag; the old image stays, without a tag | Nothing needed while the event runs. The registry is deleted with the system |
| Pulumi state and settings (S3 bucket `<event>-pulumi-state`) | Forever | Pulumi updates it on every run. If a run was interrupted, see `the stack is currently locked` in [Troubleshooting](../reference/troubleshooting.md#pulumi-and-terraform) |
| Secrets Manager | 7 days after you delete it | `make restore-secrets` brings it back within the 7 days |
| Database backups (S3 bucket `<event>-ctfd-backups`) | 30 days | Old ones expire by themselves. The backup holds the database only, not the uploads disk |
| Route 53 records | ExternalDNS deletes a record soon after its Ingress or Service is deleted | Nothing. Players' DNS caches still hold the old answer for up to 60 seconds |
| CloudWatch Container Insights logs | Forever; created by the cluster, not by Terraform | Delete them after the event; see [Delete everything](../teardown.md) |
| Let's Encrypt certificates | 90 days | Let's Encrypt issues at most 5 identical certificates per week. Rebuilding the cluster from nothing 5 times in a week leaves the sixth without `https` for days |

### On the cluster

| Copy | Kept until | Clear or refresh it with |
|---|---|---|
| Node image cache: the images each computer downloaded | The computer is replaced | See [Old code still running](#old-code-still-running) |
| MariaDB disk | The `ctfd` stack is deleted | This is the source for teams and scores. Back it up before any change |
| Redis disk: CTFd's cache, and every player's login | The `ctfd` stack is deleted. Restarting Redis or CTFd does **not** clear it | [Clear CTFd's cache](#clear-ctfds-cache) |
| Uploads disk: files players download | The `ctfd` stack is deleted. Not in the hourly backup | `ctf challenge sync` re-uploads changed files and deletes files no longer listed in `challenge.yml` |
| Kubernetes Secrets copied from Secrets Manager | You replace them | Rerun the command that created them, e.g. step 1 of [Health checks](../deploy/day2.md#health-checks) |

!!! danger "Deleting a stack deletes its disks"
    The disks are set to be deleted together with their claims. Running `pulumi destroy` on `ctfd` deletes the database and the uploads, with no way back except the last backup.

## Old code still running

Kubernetes downloads an image to a computer once, then reuses that copy. If a challenge's image is pushed again under the same tag, a computer that already has the tag keeps using its old copy. You see the old behaviour, or a crash you already fixed.

**Check:** compare the image the pods run with the newest one in ECR.

```bash
NAME=<name>; NS=challenges-web     # challenges-tcp for a pwn challenge
kubectl get deploy "$NAME" -n "$NS" -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
aws ecr describe-images --repository-name "$(jq -r .event_name eks/terraform.tfvars.json)" \
  --image-ids imageTag="$NAME" --query 'imageDetails[0].imageDigest' --output text
```

- The first line ends in `@sha256:…` and matches the second: the pods run the newest image. `make build-images` pins each image this way, so a changed image always reaches the pods, and an unchanged one doesn't restart them.
- The first line ends in `:<name>`: your copy of `builder.py` is older and doesn't pin images. Make the computers download the image again:
    ```bash
    kubectl patch deploy "$NAME" -n "$NS" -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$NAME\",\"imagePullPolicy\":\"Always\"}]}}}}"
    kubectl rollout restart deploy "$NAME" -n "$NS"
    kubectl rollout status deploy "$NAME" -n "$NS"
    ```
    The next `make build-images` undoes the patch, so repeat it after every build, or update `builder.py`.

## Clear CTFd's cache

CTFd keeps copies of pages, settings and the scoreboard in Redis, and Redis saves them to its disk. CTFd updates the cache itself when you change things in the admin pages or through ctfcli. It doesn't notice changes made around it: a [database restore](backups.md#restore-a-backup), or a change made directly in MariaDB.

To clear the cache but keep everyone logged in:

```bash
kubectl exec -n ctfd deploy/redis -- sh -c \
  "redis-cli --scan --pattern 'flask_cache_*' | grep -v '^flask_cache_session' | xargs -r redis-cli DEL"
```

It prints how many copies it deleted. After a restore, clear everything instead, which also logs every player out, because their logins may belong to accounts that no longer exist:

```bash
kubectl exec -n ctfd deploy/redis -- redis-cli FLUSHALL
```

**Check it worked:** the scoreboard and challenge list show the current data after a page reload.

**Next:** [Change a challenge](change.md).
