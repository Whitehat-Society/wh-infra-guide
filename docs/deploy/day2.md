# 4. Backups and health checks

This stage sets up two jobs that run on a schedule, which Kubernetes calls **CronJobs**. One takes backups of the database and the other checks that every challenge answers, and both run in the `ctfd` namespace.

<figure class="diagram">
--8<-- "diagrams/day2.svg"
<figcaption><code>ctfd-backup</code> keeps 30 days of hourly copies, and <code>challenge-healthcheck</code> stays silent as long as every challenge answers.</figcaption>
</figure>

## Backups

1. Create the backup schedule:
    ```bash
    cd ~/wh/wh-2026/utils
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
EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
aws s3 ls "s3://$EVENT-ctfd-backups/"
```

The output should list one file with a name like `ctfd-20270628-120000.sql.gz` and a size greater than 0.

## Health checks

The health check tests every web and pwn challenge every 5 minutes, and it posts to the Discord alerts channel when one of them doesn't answer. It builds its list of challenges from the `challenge.yml` files, together with each pwn challenge's current load balancer address.

1. Give the cluster the alert address. This command copies it from Secrets Manager into a Kubernetes Secret named `healthcheck-webhook`:
    ```bash
    kubectl create secret generic healthcheck-webhook -n ctfd \
      --from-literal=url="$(python3 secrets.py get discord_alert_webhook_url)" \
      --dry-run=client -o yaml | kubectl apply -f -
    ```
2. Create the schedule together with the current list of challenges:
    ```bash
    make deploy-healthcheck-cronjob
    ```
    It ends with `Healthcheck CronJob deployed (every 5 min).` If you see a line starting with `WARNING: no load balancer hostname yet`, a pwn load balancer is still starting, so wait 3 minutes and run the command again.
3. Run the check once and read its results:
    ```bash
    make run-healthcheck
    sleep 60; kubectl logs -n ctfd -l job-name --tail=30 --prefix | grep -i -e pass -e fail
    ```

**Check it worked:** every web and pwn challenge shows `PASS`, and nothing appears in the alerts channel.

!!! tip "Rerun step 2 after the challenges change"
    The list of challenges is copied into the cluster when you run `make deploy-healthcheck-cronjob`, so run it again whenever you add or remove a web or pwn challenge. Also run it after the pwn challenges have been deleted and deployed again, because that gives their load balancers new addresses.

Next, check that alerts actually reach Discord by stopping one challenge and waiting for the next 5-minute run:

```bash
kubectl scale deploy/base64converter -n challenges-web --replicas=0
```

The alert looks like `Challenge Health Check FAILED … base64converter unreachable`, and it repeats once every 5 minutes for as long as the challenge is down. When it arrives, start the challenge again:

```bash
kubectl scale deploy/base64converter -n challenges-web --replicas=1
```

`kubectl scale` changes how many copies of a challenge are running, so setting it to zero stops the challenge.

## If it fails

| Message | Fix |
|---|---|
| The backup job shows `Error`, and its log says `AccessDenied` | The job isn't allowed to write to the bucket, usually because the old account ID is still in `utils/ctfd/main.go`. Redo [Make it yours](../code/make-it-yours.md), and then run `make deploy-ctfd` again. |
| `NoSuchBucket` | The bucket name in the Makefile, `BACKUP_BUCKET`, doesn't match `<event>-ctfd-backups`, so redo [Make it yours](../code/make-it-yours.md). |
| A pwn challenge shows `FAIL`, or `no NLB hostname` | The list in the cluster has an old or missing address. Redo step 2 and then step 3. |
| A challenge you added isn't in the results | The list was made before you added it, so redo step 2. |

**Next:** [5. Final checks](verify.md).
