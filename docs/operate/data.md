# Where data is kept

Most of the confusing problems in this system have the same cause, which is that an old copy of something is still in use after you changed it. A rebuilt challenge keeps running its old code, a restored database shows old scores, or a name you just created still "doesn't exist" in your browser. This page lists every place where a copy is kept, how long it stays there, and how to remove it, so come back to it whenever you change or delete something.

<figure class="diagram">
--8<-- "diagrams/data-map.svg"
<figcaption>Each box keeps its own copy, and changing one doesn't change the others, so a change is only complete when every copy that matters has been updated or removed.</figcaption>
</figure>

## The rule

Every kind of data has **one source**, which is the place where you change it. Every other place holds a copy, and a copy is only updated by the command in the last column.

| Data | Source: change it here | Copies | Updated by |
|---|---|---|---|
| Challenge text, flags, hints, files | `challenge.yml` and the files in the challenge's folder | CTFd's database and uploads disk | `ctf challenge sync` |
| Challenge server code | The challenge's folder | ECR image, then each node's image cache | `make build-images` |
| Teams, players, solves, scores | CTFd's database | Redis cache, hourly backups | CTFd itself, except in the cases in [Clear CTFd's cache](#clear-ctfds-cache) |
| Passwords and tokens | Secrets Manager | Kubernetes Secrets, `.ctf/config`, `healthcheck-webhook` | Running again the step that copied them |
| Cluster settings | `utils/eks/terraform.tfvars.json` and the `.tf` files | AWS, Terraform state | `make deploy-eks` |
| Addresses (DNS) | Kubernetes Ingresses and Services | Route 53, and then every DNS cache on the way to players | ExternalDNS, and then time |

## Every copy, and how to clear it

### On your computer

| Copy | Kept until | Clear or refresh it with |
|---|---|---|
| Docker build cache, which holds image layers from earlier builds | Until you delete it | `docker builder prune -f` forces a full rebuild. You only need it when a build reuses a layer it shouldn't, for example a `RUN git clone` or `RUN apt-get install` that ought to fetch something newer. |
| ECR sign-in for Docker (`~/.docker/config.json`) | 12 hours | Repeat step 1 of [The challenges](../deploy/challenges.md). |
| AWS sign-in (`~/.aws/`) | 8 to 12 hours | [Sign in again](../accounts/cli-login.md). |
| Cluster address (`~/.kube/config`) | Until you rebuild the cluster | `make kubeconfig`. After a rebuild, the old address points at nothing. |
| Terraform state (`utils/eks/terraform.tfstate` and `utils/ecr/terraform.tfstate`) | Forever, but **only on this computer** | Never delete it. Copy both files to the club's shared drive after every deploy, because without them nobody else can update or delete the system. |
| `challenge.yml` lines written by the build (`connection_info:`) | Until the next build | Nothing, since the build rewrites them. Commit them, or discard them with `git checkout -- '*/*/challenge.yml'`. |
| DNS answers | Up to 15 minutes for "doesn't exist", and 60 seconds for an address | `ipconfig /flushdns` on Windows. Chrome keeps its own copy as well, which you clear by opening `chrome://net-internals/#dns` and clicking **Clear host cache**. |

### In the AWS account

| Copy | Kept until | Clear or refresh it with |
|---|---|---|
| ECR images, one tag per challenge | Forever. A new push moves the tag, and the old image stays behind without one. | Nothing is needed while the event runs, and the registry is deleted together with the system. |
| Pulumi state and settings (S3 bucket `<event>-pulumi-state`) | Forever | Pulumi updates it on every run. If a run was interrupted, see `the stack is currently locked` in [Troubleshooting](../reference/troubleshooting.md#pulumi-and-terraform). |
| Secrets Manager | 7 days after you delete it | `make deploy-eks` brings it back if you deploy again within the 7 days. |
| Database backups (S3 bucket `<event>-ctfd-backups`) | 30 days | Old backups expire by themselves. A backup holds only the database and not the uploads disk. |
| Route 53 records | Until shortly after the Ingress or Service is deleted, when ExternalDNS removes the record | Nothing, although players' DNS caches still hold the old answer for up to 60 seconds. |
| CloudWatch Container Insights logs | Forever, because the cluster creates them and Terraform doesn't know about them | Delete them after the event, as described in [Delete everything](../teardown.md). |
| Let's Encrypt certificates | 90 days | Let's Encrypt issues at most 5 identical certificates a week, so rebuilding the cluster from nothing 5 times in one week leaves the sixth build without `https` for days. |

### On the cluster

| Copy | Kept until | Clear or refresh it with |
|---|---|---|
| Node image cache, which holds the images each computer downloaded | Until the computer is replaced | See [Old code still running](#old-code-still-running). |
| MariaDB disk | Until the `ctfd` stack is deleted | This is the source for teams and scores, so back it up before any change. |
| Redis disk, which holds CTFd's cache and every player's login | Until the `ctfd` stack is deleted. Restarting Redis or CTFd does **not** clear it. | See [Clear CTFd's cache](#clear-ctfds-cache). |
| Uploads disk, which holds the files players download | Until the `ctfd` stack is deleted. It isn't in the hourly backup. | `ctf challenge sync` uploads changed files again and deletes files that are no longer listed in `challenge.yml`. |
| Kubernetes Secrets copied from Secrets Manager | Until you replace them | Run the command that created them again, for example step 1 of [Health checks](../deploy/day2.md#health-checks). |

!!! danger "Deleting a stack deletes its disks"
    The disks are set to be deleted together with their claims, so running `pulumi destroy` on `ctfd` deletes the database and the uploads, and the only way back is the last backup.

## Old code still running

Kubernetes downloads an image to a computer once and then reuses that copy. If a challenge's image is pushed again under the same tag, a computer that already has the tag keeps using its old copy, so you see the old behaviour, or a crash you have already fixed.

To check, compare the image that the pods run with the newest one in ECR:

```bash
NAME=<name>; NS=challenges-web     # challenges-tcp for a pwn challenge
kubectl get deploy "$NAME" -n "$NS" -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
aws ecr describe-images --repository-name "$(jq -r .event_name eks/terraform.tfvars.json)" \
  --image-ids imageTag="$NAME" --query 'imageDetails[0].imageDigest' --output text
```

If the first line ends in `@sha256:…` and matches the second line, the pods are running the newest image. `make build-images` pins each image this way, so a changed image always reaches the pods and an unchanged one doesn't restart them.

If the first line ends in `:<name>` instead, your copy of `builder.py` is an older one that doesn't pin images. In that case, make the computers download the image again:

```bash
kubectl patch deploy "$NAME" -n "$NS" -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$NAME\",\"imagePullPolicy\":\"Always\"}]}}}}"
kubectl rollout restart deploy "$NAME" -n "$NS"
kubectl rollout status deploy "$NAME" -n "$NS"
```

The next `make build-images` undoes this patch, so either repeat it after every build or update `builder.py`.

## Clear CTFd's cache

CTFd keeps copies of pages, settings and the scoreboard in Redis, and Redis saves them to its disk. CTFd updates the cache itself when you change things in the admin pages or through ctfcli, but it doesn't notice changes made around it, such as a [database restore](backups.md#restore-a-backup) or a change made directly in MariaDB.

To clear the cache while keeping everyone logged in, run:

```bash
kubectl exec -n ctfd deploy/redis -- sh -c \
  "redis-cli --scan --pattern 'flask_cache_*' | grep -v '^flask_cache_session' | xargs -r redis-cli DEL"
```

It prints how many copies it deleted. After a restore, clear everything instead. That also logs every player out, which is necessary because their logins may belong to accounts that no longer exist.

```bash
kubectl exec -n ctfd deploy/redis -- redis-cli FLUSHALL
```

**Check it worked:** after you reload the page, the scoreboard and the challenge list show the current data.

**Next:** [Change a challenge](change.md).
