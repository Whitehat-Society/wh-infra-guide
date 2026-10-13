# 6 · Alarms and backups

Parts 1 to 5 are enough for players to compete. This last part is for the organisers. It warns you when something breaks, ideally before players notice, and it keeps copies of the scores so that a broken disk doesn't end the event.

## Alarms

**CloudWatch** is AWS's measuring service. It collects numbers from the cluster every minute, such as the memory each computer uses and the number of computers that are working, and it raises an **alarm** when a number crosses a limit that you have set.

<figure class="diagram">
--8<-- "diagrams/alerts.svg"
<figcaption>SNS (Simple Notification Service) sends every alarm by email, and also to a small Lambda program that reposts it in Discord.</figcaption>
</figure>

Each alarm is one line in a list in `utils/eks/observability.tf`, which gives what it measures and when it fires. This one fires when fewer computers are working than the minimum you set:

```hcl
eks-node-count-low = { about = "Fewer nodes are ready than the minimum", metric = "cluster_node_count",
                       pod = "", stat = "Minimum", below = true, threshold = local.node_min_per_zone * local.zone_count, periods = 3 }
```

Terraform turns every line of the list into an alarm named `<event>-<name>`, such as `wh-2027-eks-node-count-low`.

## Jobs on a schedule

Two more safety nets run inside the cluster as **CronJobs**, which are Kubernetes objects that start a pod on a schedule, do one task, and stop.

| Job | Schedule | What it does |
|---|---|---|
| `ctfd-backup` | Every hour | Copies the whole database to an S3 bucket, which keeps 30 days of copies. |
| `challenge-healthcheck` | Every 5 minutes | Connects to every web and pwn challenge, and posts in Discord when one doesn't answer. |

<figure class="diagram">
--8<-- "diagrams/day2.svg"
<figcaption><code>ctfd-backup</code> keeps 30 days of hourly copies, and <code>challenge-healthcheck</code> stays silent as long as every challenge answers.</figcaption>
</figure>

Unlike the other parts, these jobs are written as plain Kubernetes files rather than through Terraform or Pulumi. The schedule is a single line, written in the format that `cron`, the classic Linux scheduler, uses. This is the start of `utils/ctfd/backup-cronjob.yaml`:

```yaml
kind: CronJob
metadata:
  name: ctfd-backup
  namespace: ctfd
spec:
  schedule: "0 * * * *"  # Every hour at minute 0
```

## Where it lives

| Kind | What you touch |
|---|---|
| Files in the repository | `utils/eks/observability.tf` for the alarms, the CloudWatch dashboard and the program that posts alarms to Discord, and `utils/ctfd/backup-cronjob.yaml` and `utils/ctfd/healthcheck-cronjob.yaml` for the two jobs. |
| Commands | `make deploy-eks` creates the alarms together with parts 2 and 3. `make deploy-ctfd-backup-cronjob` and `make deploy-healthcheck-cronjob` start the jobs. |
| Web dashboards | The CloudWatch dashboard, a page of graphs that you watch during the event. You only look at it and never change anything there. In Discord, the channel settings are where you create the webhook address that the alerts are sent to. |

You set up the jobs in [Deploy · 4. Backups and health checks](../deploy/day2.md), and [Watching the system](../operate/monitoring.md) explains what to keep on screen during the event.

**Next:** [Putting it together](together.md).
