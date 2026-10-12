# Watching the system

During the event, keep three things open. Together they tell you within minutes when something breaks.

1. **The Discord alerts channel.** The health check posts here when a challenge stops answering, and CloudWatch alarms post here when a measurement crosses a limit.
2. **A terminal that refreshes every 30 seconds:**
    ```bash
    watch -n 30 'kubectl get pods -A | grep -v -e Running -e Completed; kubectl get nodes'
    ```
    `watch` reruns a command on a timer. The top part lists every pod that isn't running normally, so it should show only its header. The bottom part lists the nodes, which should all be `Ready`. On macOS, install `watch` first with `brew install watch`. Press Ctrl+C to stop.
3. **The CloudWatch dashboard**, a page of graphs of memory, processor use and node count. Print its address and open it in a browser:
    ```bash
    EVENT=$(jq -r .event_name ~/wh/wh-2026/utils/eks/terraform.tfvars.json)
    R=$(aws configure get region)
    echo "https://$R.console.aws.amazon.com/cloudwatch/home?region=$R#dashboards/dashboard/$EVENT-eks-ops"
    ```

<figure class="diagram">
--8<-- "diagrams/monitoring.svg"
<figcaption>Everything that goes wrong ends up in the Discord alerts channel. Alarms also arrive by email, so they still reach you if Discord is down.</figcaption>
</figure>

## What raises an alert

| Alert | Raised when | Where it goes |
|---|---|---|
| Health check `FAIL` | A challenge doesn't answer, checked every 5 minutes | Discord |
| `<event>-ingress-nginx-pod-down` | An NGINX pod stops. Every web page, CTFd included, goes through NGINX | Email and Discord |
| `<event>-eks-node-count-low` | Fewer nodes are running than the minimum | Email and Discord |
| `<event>-mariadb-memory-high` | The database uses more than 80% of its memory allowance | Email and Discord |
| `<event>-node-memory-high` | A node uses more than 85% of its memory | Email and Discord |
| `<event>-node-filesystem-high` | A node's disk is more than 85% full | Email and Discord |

To list every alarm that is active right now:

```bash
aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[].[AlarmName,StateReason]' --output text
```

An empty result means none are active.

## When an alert fires

Most fixes are a **restart**: Kubernetes replaces a Deployment's pods with fresh ones, which clears most stuck programs. `kubectl rollout restart` does it without downtime when there is more than one copy, and with a few seconds of downtime when there is only one.

| Alert or report | Look first | Usual fix |
|---|---|---|
| Health check: a web challenge fails | `kubectl logs -n challenges-web deploy/<name> --tail=50` | `kubectl rollout restart deploy/<name> -n challenges-web` |
| Health check: a pwn challenge fails | `kubectl get pods,svc -n challenges-tcp` | `kubectl rollout restart deploy/<name> -n challenges-tcp`. If its Service has no `EXTERNAL-IP`, see [Troubleshooting](../reference/troubleshooting.md) |
| NGINX pod down | `kubectl get pods -n ingress-nginx` | `kubectl rollout restart deploy/ingress-nginx-controller -n ingress-nginx` |
| Database memory high | The dashboard's MariaDB graph | At a quiet moment, raise MariaDB's memory limit in `utils/ctfd/main.go` and run `make deploy-ctfd`. CTFd is down for about a minute |
| Node memory or disk high | `kubectl describe node <name>` | Add a node: see [Adding capacity](scaling.md) |
| Players see "503" on a web challenge | Nothing to check | That challenge limits each address to 20 requests per second. See [Rate limits](risks.md#rate-limits) |
| CTFd doesn't load at all, and a `ctfd`, `redis` or `mariadb` pod is `Pending` | `kubectl describe pod -n ctfd <pod>` | [When a computer fails](risks.md#when-a-computer-fails) |
| CTFd is slow or shows errors | `kubectl logs -n ctfd deploy/ctfd --tail=100` | [Take a backup](backups.md), then `kubectl rollout restart deploy/ctfd -n ctfd` |

!!! danger "Back up before you touch the database"
    MariaDB is a single pod on a single disk. Before you restart it or change it, run `make backup-ctfd` and check that the new file is in S3.
