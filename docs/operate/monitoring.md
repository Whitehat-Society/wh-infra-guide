# Watching the system

<span class="time">⏱ 10 min setup on event morning · then glance every 15 min</span>

Keep three things open during the event:

1. **Discord `#infra-alerts`**: the 5-minute health check and CloudWatch alarms post here
2. **A terminal** running:
    ```bash
    watch -n 30 'kubectl get pods -A | grep -v -e Running -e Completed; kubectl get nodes'
    ```
    Anything listed above the node table is a problem pod
3. **The CloudWatch dashboard** `<event>-eks-ops`. Print its link:
    ```bash
    EVENT=$(jq -r .event_name ~/wh/wh-2026/utils/eks/terraform.tfvars.json)
    echo "https://ap-southeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-southeast-1#dashboards/dashboard/$EVENT-eks-ops"
    ```

## What alerts you

<div class="wh">
--8<-- "ops-table.html"
</div>

The "Proven during the event?" column is from WH-2026's review afterwards. Since then the guide adds the `healthcheck-webhook` Secret ([page 4](../deploy/day2.md)), so the health check now has its webhook.

Check alarms from the CLI:

```bash
aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[].[AlarmName,StateReason]' --output text
```

## When an alert fires

| Alert / symptom | First command | Usual fix |
|---|---|---|
| Health check: web challenge `FAIL` | `kubectl get pods -n challenges-web` then `kubectl logs -n challenges-web deploy/<name> --tail=50` | `kubectl rollout restart deploy/<name> -n challenges-web` |
| Health check: pwn challenge `FAIL` | `kubectl get pods,svc -n challenges-tcp` | Restart as above (namespace `challenges-tcp`). If the Service has no `EXTERNAL-IP`, see [Troubleshooting](../reference/troubleshooting.md) |
| `ingress-nginx-pod-down` | `kubectl get pods -n ingress-nginx` | Every web URL and CTFd go through it. `kubectl rollout restart deploy/ingress-nginx-controller -n ingress-nginx` |
| `mariadb-memory-high` | `kubectl top` doesn't exist here; check the dashboard | Plan a quiet moment to raise the MariaDB memory limit in `utils/ctfd/main.go`, then `make deploy-ctfd`. That restarts CTFd (~1 min downtime) |
| `node-memory-high` / `node-filesystem-high` | `kubectl describe node <name>` | Add a node: see [Scaling up](scaling.md) |
| Players report "503" on a web challenge | — | It's the rate limit (20 req/s per address). See [Known weak spots](risks.md) |
| CTFd slow or erroring | `kubectl logs -n ctfd deploy/ctfd --tail=100` | Take a [backup](backups.md) first, then `kubectl rollout restart deploy/ctfd -n ctfd` |

!!! danger "Never restart MariaDB during the event without a fresh backup"
    It's a single pod on a single disk. Run `make backup-ctfd` and check the file in S3 first.
