# Known weak spots

WH-2026's review after the event found these weak spots. They are ranked by how much of the event fails if each goes wrong. If you have a spare afternoon before the next event, fix the first three.

## Parts with no backup copy

1. **The scoreboard has one copy of everything.** CTFd, its database and its cache each run as one pod, with data on a disk that sits in one availability zone. If the computer holding one of them fails, the pod can only restart on another computer in the same zone. The cluster keeps at least one computer in every zone and adds one there when needed, so CTFd is back within a few minutes; see [When a computer fails](#when-a-computer-fails). The lasting fix is to move the database and cache to AWS's managed services (RDS and ElastiCache), and uploaded files to S3, so CTFd can run several copies.
2. **Request limits depend on players' real addresses.** Each web challenge allows 20 requests a second per address. Older versions of the code hid players' addresses, so all players shared one limit; [Rate limits](#rate-limits) shows how to check that yours are passed through.
3. **Copies of a web challenge don't share data.** Each copy has its own logins and data. Keep such challenges at one copy, make NGINX send each player to the same copy every time (*sticky sessions*), or move their data out of the pod.
4. **Nothing adds pods by itself.** Copy counts only change when someone edits them. The fix is a Kubernetes add-on that adds pods when they get busy (a *HorizontalPodAutoscaler*), for the challenges that can safely have several copies.
5. **One NAT gateway for the whole network.** It sits in one availability zone. If that zone fails, no computer can download images, renew certificates or upload backups.

## When a computer fails

The cluster has one group of computers per availability zone, each with at least one computer. When a computer fails, AWS replaces it in the same zone, and pods that keep data on a disk in that zone (CTFd, MariaDB, Redis) start again there. In a test, the computer holding MariaDB was switched off: the replacement joined 40 seconds later, MariaDB ran again after 77 seconds, and no data was lost. Expect CTFd to be unreachable for 1 to 3 minutes.

**Symptoms that it didn't recover:** after 10 minutes CTFd still doesn't load, `kubectl get pods -n ctfd` shows `ctfd`, `redis` or `mariadb` as `Pending`, and `kubectl describe pod -n ctfd <pod>` ends with `volume node affinity conflict` or `didn't match PersistentVolume's node affinity`.

**Fix:** add a computer to that zone's group by hand. First find the zone of the stuck pod's disk, and the groups:

```bash
cd ~/wh/wh-2026/utils
EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
kubectl get pv -o custom-columns='CLAIM:.spec.claimRef.name,ZONE:.spec.nodeAffinity.required.nodeSelectorTerms[0].matchExpressions[0].values[0]'
aws eks list-nodegroups --cluster-name "$EVENT-eks" --output text
```

Each group's name starts with `zone-` and the zone's last letter, e.g. `zone-b-…` for `ap-southeast-1b`. Raise that group's size by one:

```bash
NG=<the zone-b-… name>
aws eks describe-nodegroup --cluster-name "$EVENT-eks" --nodegroup-name "$NG" --query 'nodegroup.scalingConfig'
aws eks update-nodegroup-config --cluster-name "$EVENT-eks" --nodegroup-name "$NG" \
  --scaling-config minSize=1,maxSize=2,desiredSize=2
kubectl get nodes -L topology.kubernetes.io/zone -w
```

When a new line shows that zone and `Ready`, press Ctrl+C. Within a minute `kubectl get pods -n ctfd` shows every pod `Running`.

**Planned replacements are blocked.** CTFd and MariaDB have a rule that none of their pods may be stopped on purpose (a *PodDisruptionBudget* with `MAX UNAVAILABLE 0`). `kubectl drain` on their computer waits forever and stops with `global timeout reached`. That protects them from accidental restarts; to move them on purpose, at a quiet moment, delete the pod instead: `kubectl delete pod -n ctfd <pod>`.

## Many players on one challenge

Nothing in the system knows about teams. Every challenge shows the same address to every player, whether teammates or rivals.

- **Pwn challenges separate players by connection.** Each `nc` connection starts a fresh run of the program, so players never share a session. They do share the files inside the copy.
- **Web challenges don't separate players at all.** Everyone uses the same running website and sees each other's side effects, such as registered accounts or stored messages. Nothing resets between players.

<div class="wh">
<figure class="figure" data-seq="pwnshare">
  <h3>Two players connect to the same pwn challenge</h3>
  <div class="scroll"></div>
  <figcaption>Each connection gets its own run of the program, but they share one copy's files.</figcaption>
</figure>
<figure class="figure" data-seq="webshare">
  <h3>Two players on a web challenge with two copies</h3>
  <div class="scroll"></div>
  <figcaption>From xssive-login's code: each copy creates a random signing key when it starts, and keeps its data in a file inside itself.</figcaption>
</figure>
<figure class="figure" data-seq="ratelimit">
  <h3>Two players, one request limit</h3>
  <div class="scroll"></div>
  <figcaption>Why players who each stay under the limit can still be turned away.</figcaption>
</figure>
</div>

How each web challenge behaves with two copies, from reading its code (none of this was tested live):

| Challenge | What each copy keeps to itself | What a player notices with two copies | Risk |
|---|---|---|---|
| `xssive-login` | A random signing key, and a database file. Its admin bot runs a hidden browser inside the pod | Logins only work on the copy that issued them. The admin bot can log in on one copy and visit the link on the other, so its visit fails | High |
| `inspectpost` | Logins in memory, and a database file | Logged in on one copy, logged out on the other. Data saved on one copy is missing on the other | High |
| `pokemon-portal` | A database file | An account registered on one copy doesn't exist on the other | High |
| `a-thousand-suns` | Nothing | No difference | Low |
| `base64converter` | Nothing | No difference | Low |

## Rate limits

A **rate limit** caps how many requests one address may send. NGINX enforces them before a request reaches the challenge:

| Service | Limit per address | Over the limit |
|---|---|---|
| Each web challenge | 20 requests a second, at most 15 open connections | `503` (busy) |
| CTFd | none. A limit of 100 a second was tried at WH-2026 and removed | — |
| Pwn challenges | none. They don't go through NGINX | — |

!!! warning "Check that players' addresses reach NGINX"
    The limits only work per player if NGINX sees each player's own address. The load balancer passes it on through the setting `preserve_client_ip.enabled=true` in `utils/eks/helm.tf`. Without it, as in WH-2026's code, every request seems to come from the load balancer's internal address, such as `10.100.1.7`, and all players share one limit. Count requests by address over the last hour:

    ```bash
    G=/aws/containerinsights/$EVENT-eks/application
    ID=$(aws logs start-query --log-group-name "$G" --start-time $(( $(date +%s) - 3600 )) --end-time $(date +%s) \
      --query-string 'filter kubernetes.container_name = "controller" | parse log /^(?<ip>\S+) - / | filter ispresent(ip) | stats count(*) as n by ip | sort n desc | limit 5' \
      --query queryId --output text)
    sleep 15; aws logs get-query-results --query-id "$ID" --query 'results[*][*].value' --output text
    ```

    Public addresses, such as your own, mean it works. A single `10.100.…` address with nearly all the requests means the setting is missing.

To lift the limit on one web challenge during the event, without restarting anything:

```bash
kubectl annotate ingress <name> -n challenges-web \
  nginx.ingress.kubernetes.io/limit-rps- \
  nginx.ingress.kubernetes.io/limit-burst-multiplier- \
  nginx.ingress.kubernetes.io/limit-connections-
```

The limits are stored as *annotations*, notes attached to the challenge's Ingress. The `-` at the end of each name removes that note. The next `make build-images` puts the limits back.
