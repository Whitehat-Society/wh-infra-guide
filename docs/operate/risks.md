# Known weak spots

These come from WH-2026's post-event review. They're ranked by how much of the event breaks if they go wrong. Fixing the first three before the next event is the best use of a spare afternoon.

## Single points of failure

<div class="wh">
--8<-- "risks.html"
</div>

## Many players on one challenge

Nothing in the infrastructure knows about teams. Every challenge shows **one connection string to everyone**. Pwn challenges separate players by TCP connection (each `nc` gets its own process). Web challenges don't separate players at all.

<div class="wh">
--8<-- "multiuser.html"
</div>

## Rate limits

All limits are per client address, enforced by NGINX before traffic reaches a pod:

| Service | Requests/s | Burst | Open connections | Over the limit |
|---|---|---|---|---|
| CTFd | none (a 100 req/s limit was tried at WH-2026 and reverted) | | | |
| Each web challenge | 20 | ×1 | 15 | 503 |
| Pwn challenges | none (TCP, no NGINX) | | | |

To lift the limit on one web challenge during the event, with no restart:

```bash
kubectl annotate ingress <name> -n challenges-web \
  nginx.ingress.kubernetes.io/limit-rps- \
  nginx.ingress.kubernetes.io/limit-burst-multiplier- \
  nginx.ingress.kubernetes.io/limit-connections-
```

The trailing `-` removes the setting. The next `make build-images` puts it back.
