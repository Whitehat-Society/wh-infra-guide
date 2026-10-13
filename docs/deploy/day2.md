# 4. Backups and health checks

This stage sets up two jobs that run on a schedule, which Kubernetes calls **CronJobs**. One takes backups of the database and the other checks that every challenge answers, and both run in the `ctfd` namespace.

<figure class="diagram">
--8<-- "diagrams/day2.svg"
<figcaption><code>ctfd-backup</code> keeps 30 days of hourly copies, and <code>challenge-healthcheck</code> posts only when a challenge fails, plus one summary every hour.</figcaption>
</figure>

## Backups

1. Create the backup schedule:
    ```bash
    cd ~/wh/wh-2027/utils
    make deploy-ctfd-backup-cronjob
    ```
2. Run one backup now, rather than waiting for the next hour:
    ```bash
    make backup-ctfd
    kubectl get jobs -n ctfd -w
    ```
    When the new job's `COMPLETIONS` column shows `1/1`, press Ctrl+C.

**Check it worked:**

```bash
aws s3 ls "s3://$(python3 settings.py backup_bucket)/"
```

The output should list one file with a name like `ctfd-20270628-120000.sql.gz` and a size greater than 0.

## Health checks

The health check tests every web and pwn challenge every 5 minutes, and it posts to the Discord alerts channel when one of them doesn't answer. It builds its list of challenges from the `challenge.yml` files, together with each pwn challenge's current load balancer address.

1. Create the schedule, together with the current list of challenges and the Discord alert address, which the command copies from Secrets Manager into the cluster:
    ```bash
    make deploy-healthcheck-cronjob
    ```
    It ends with `Healthcheck CronJob deployed (every 5 min).` If you see a line starting with `WARNING: no load balancer hostname yet`, a pwn load balancer is still starting, so wait 3 minutes and run the command again.
2. Run the check once:
    ```bash
    make run-healthcheck
    ```
    It waits up to 2 minutes for the check to start, prints each challenge's result as it goes, and ends with `=== Results: 2 passed, 0 failed ===`, with your own numbers.

**Check it worked:** every web and pwn challenge shows `PASS`, and no failure appears in the alerts channel. The **Hourly health check** summary at the top of each hour is expected.

!!! tip "Rerun step 1 after the challenges change"
    The list of challenges is copied into the cluster when you run `make deploy-healthcheck-cronjob`, so run it again whenever you add or remove a web or pwn challenge. Also run it after the pwn challenges have been deleted and deployed again, because that gives their load balancers new addresses.

Next, check that alerts actually reach Discord by stopping one challenge and waiting for the next 5-minute run:

```bash
kubectl scale deploy/example-web -n challenges-web --replicas=0
```

The alert looks like `Challenge Health Check FAILED … example-web unreachable`, and it repeats once every 5 minutes for as long as the challenge is down. When it arrives, start the challenge again:

```bash
kubectl scale deploy/example-web -n challenges-web --replicas=1
```

`kubectl scale` changes how many copies of a challenge are running, so setting it to zero stops the challenge.

## If it fails

| Message | Fix |
|---|---|
| The backup job shows `Error`, and its log says `AccessDenied` | The job's permission comes from `make deploy-ctfd`, which gives the `ctfd-backup` account the backup role that `make deploy-eks` made. Run `make deploy-ctfd` again, and then `make backup-ctfd`. |
| `NoSuchBucket` | The settings file changed after `make deploy-eks`, so the names no longer match. Run `make deploy-eks` and then `make deploy-ctfd-backup-cronjob` again. |
| A pwn challenge shows `FAIL`, or `has no load balancer hostname` | The list in the cluster has an old or missing address. Redo step 1 and then step 2. |
| A challenge you added isn't in the results | The list was made before you added it, so redo step 1. |

**Next:** [5. Final checks](verify.md).
