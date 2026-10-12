# Known weak spots

WH-2026's review after the event found these weak spots. They are ranked by how much of the event fails if each goes wrong. If you have a spare afternoon before the next event, fix the first three.

## Parts with no backup copy

1. **The scoreboard has one copy of everything.** CTFd, its database and its cache each run as one pod, with data on a disk that sits in one availability zone. If that computer or zone fails, the whole event stops until Kubernetes restarts the pods in the same zone. The fix is to move the database and cache to AWS's managed services (RDS and ElastiCache), and uploaded files to S3, so CTFd can run several copies.
2. **Request limits probably count many players as one.** Each web challenge allows 20 requests a second per address. The load balancer doesn't pass on players' real addresses, so NGINX may see one address for many players and limit them together. The fix is to turn on the setting that passes real addresses through (*proxy protocol*), then test the limits again.
3. **Copies of a web challenge don't share data.** Each copy has its own logins and data. Keep such challenges at one copy, make NGINX send each player to the same copy every time (*sticky sessions*), or move their data out of the pod.
4. **Nothing adds pods by itself.** Copy counts only change when someone edits them. The fix is a Kubernetes add-on that adds pods when they get busy (a *HorizontalPodAutoscaler*), for the challenges that can safely have several copies.
5. **One NAT gateway for the whole network.** It sits in one availability zone. If that zone fails, no computer can download images, renew certificates or upload backups.

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

!!! danger "In this setup, every player shares one address"
    The load balancer in front of NGINX doesn't pass on the player's own address. NGINX sees every request as coming from the load balancer's internal address, such as `10.100.1.7`. A test deploy logged 773 requests from players, health checks and smoke tests, all from that one address. So "20 a second per address" is in practice 20 a second for everyone reaching a challenge through the same load balancer node, and a busy challenge answers `503` to players who sent only a few requests.

    To check on your system, count requests by address over the last hour:

    ```bash
    G=/aws/containerinsights/$EVENT-eks/application
    ID=$(aws logs start-query --log-group-name "$G" --start-time $(( $(date +%s) - 3600 )) --end-time $(date +%s) \
      --query-string 'filter kubernetes.container_name = "controller" | parse log /^(?<ip>\S+) - / | filter ispresent(ip) | stats count(*) as n by ip | sort n desc | limit 5' \
      --query queryId --output text)
    sleep 15; aws logs get-query-results --query-id "$ID" --query 'results[*][*].value' --output text
    ```

    One `10.100.…` address with nearly all the requests means the limits are shared. The fix belongs in `utils/eks/helm.tf`: have the load balancer keep the player's address (`preserve_client_ip.enabled=true` on its target group, or *proxy protocol* with NGINX's `use-proxy-protocol`). Until that is done, lift the limit on a challenge that players report as `503`.

To lift the limit on one web challenge during the event, without restarting anything:

```bash
kubectl annotate ingress <name> -n challenges-web \
  nginx.ingress.kubernetes.io/limit-rps- \
  nginx.ingress.kubernetes.io/limit-burst-multiplier- \
  nginx.ingress.kubernetes.io/limit-connections-
```

The limits are stored as *annotations*, notes attached to the challenge's Ingress. The `-` at the end of each name removes that note. The next `make build-images` puts the limits back.
