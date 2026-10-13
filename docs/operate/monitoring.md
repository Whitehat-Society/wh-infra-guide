# Watching the system

During the event, keep three things open on your screen. Together they tell you within a few minutes when something breaks.

1. **The Discord alerts channel.** The health check posts here when a challenge stops answering, and the CloudWatch alarms post here when a measurement crosses its limit.
2. **A terminal that refreshes every 30 seconds**, running this command:
    ```bash
    watch -n 30 'kubectl get pods -A | grep -v -e Running -e Completed; kubectl get nodes'
    ```
    `watch` reruns a command on a timer. The top part lists every pod that isn't running normally, so it should show only its header, and the bottom part lists the nodes, which should all be `Ready`. On macOS, install `watch` first with `brew install watch`. Press Ctrl+C when you want to stop it.
3. **The CloudWatch dashboard**, which is a page of graphs showing memory, processor use and the number of nodes. Print its address with the commands below and open it in a browser.
    ```bash
    EVENT=$(jq -r .event_name ~/wh/wh-2027/utils/eks/terraform.tfvars.json)
    R=$(aws configure get region)
    echo "https://$R.console.aws.amazon.com/cloudwatch/home?region=$R#dashboards/dashboard/$EVENT-eks-ops"
    ```

<figure class="diagram">
--8<-- "diagrams/monitoring.svg"
<figcaption>Everything that goes wrong ends up in the Discord alerts channel. Alarms also arrive by email, so they still reach you if Discord itself is down.</figcaption>
</figure>

## What raises an alert

| Alert | Raised when | Where it goes |
|---|---|---|
| Health check `FAIL` | A challenge doesn't answer. The check runs every 5 minutes. | Discord |
| `<event>-ingress-nginx-pod-down` | An NGINX pod stops. This matters because every web page, CTFd included, goes through NGINX. | Email and Discord |
| `<event>-eks-node-count-low` | Fewer nodes are running than the minimum. | Email and Discord |
| `<event>-mariadb-memory-high` | The database uses more than 80% of its memory allowance. | Email and Discord |
| `<event>-node-memory-high` | A node uses more than 85% of its memory. | Email and Discord |
| `<event>-node-filesystem-high` | A node's disk is more than 85% full. | Email and Discord |

To list every alarm that is active right now, run:

```bash
aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[].[AlarmName,StateReason]' --output text
```

If the result is empty, no alarm is active.

## When an alert fires

Most fixes are a **restart**, in which Kubernetes replaces a Deployment's pods with fresh ones, and that clears most stuck programs. `kubectl rollout restart` does this without any downtime when there is more than one copy, and with a few seconds of downtime when there is only one.

| Alert or report | Look first | Usual fix |
|---|---|---|
| Health check: a web challenge fails | `kubectl logs -n challenges-web deploy/<name> --tail=50` | `kubectl rollout restart deploy/<name> -n challenges-web` |
| Health check: a pwn challenge fails | `kubectl get pods,svc -n challenges-tcp` | `kubectl rollout restart deploy/<name> -n challenges-tcp`. If its Service has no `EXTERNAL-IP`, see [Troubleshooting](../reference/troubleshooting.md). |
| NGINX pod down | `kubectl get pods -n ingress-nginx` | `kubectl rollout restart deploy/ingress-nginx-controller -n ingress-nginx` |
| Database memory high | The dashboard's MariaDB graph | At a quiet moment, raise MariaDB's memory limit in `utils/ctfd/main.go` and run `make deploy-ctfd`. CTFd is down for about a minute while it restarts. |
| Node memory or disk high | `kubectl describe node <name>` | Add a node, as described in [Adding capacity](scaling.md). |
| Players see "503" on a web challenge | Nothing to check | The challenge limits each address to 20 requests per second, as [Rate limits](risks.md#rate-limits) explains. |
| CTFd doesn't load at all, and a `ctfd`, `redis` or `mariadb` pod is `Pending` | `kubectl describe pod -n ctfd <pod>` | [When a computer fails](risks.md#when-a-computer-fails) |
| CTFd is slow or shows errors | `kubectl logs -n ctfd deploy/ctfd --tail=100` | [Take a backup](backups.md), and then run `kubectl rollout restart deploy/ctfd -n ctfd`. |

!!! danger "Back up before you touch the database"
    MariaDB is a single pod on a single disk, so before you restart it or change it, run `make backup-ctfd` and check that the new file is in S3.
