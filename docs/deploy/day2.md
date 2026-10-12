# 4. Backups and health checks

This stage sets up two jobs that run on a schedule. Kubernetes calls a scheduled job a **CronJob**. Both run in the `ctfd` namespace.

<figure class="diagram">
--8<-- "diagrams/day2.svg"
<figcaption><code>ctfd-backup</code> keeps 30 days of hourly copies. <code>challenge-healthcheck</code> stays silent while every challenge answers.</figcaption>
</figure>

## Backups

1. Create the backup schedule:
    ```bash
    cd ~/wh/wh-2026/utils
    make deploy-ctfd-backup-cronjob
    ```
2. Run one backup now, instead of waiting for the hour:
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

The output lists one file named like `ctfd-20270628-120000.sql.gz`, with a size greater than 0.

## Health checks

The health check needs two things the code doesn't set up by itself: the Discord alert address, stored where the job can read it, and the current addresses of the pwn load balancers.

1. Give the cluster the alert address. The command copies it from Secrets Manager into a Kubernetes Secret named `healthcheck-webhook`:
    ```bash
    kubectl create secret generic healthcheck-webhook -n ctfd \
      --from-literal=url="$(python3 secrets.py get discord_alert_webhook_url)" \
      --dry-run=client -o yaml | kubectl apply -f -
    ```
2. Write the pwn load balancer addresses into the job's settings file, `ctfd/healthcheck-cronjob.yaml`. The addresses change whenever the pwn challenges are rebuilt from nothing, so rerun this step after every fresh deploy. First set the variables Pulumi needs:
    --8<-- "pulumi-env.md"
    Then copy each address from Pulumi's records into the file:
    ```bash
    pulumi -C shared-tcp stack select "$EVENT"
    for n in loop library xoph-dark-embers; do
      VAR="SHARED_TCP_$(echo "$n" | tr 'a-z-' 'A-Z_')_HOSTNAME"
      HOST=$(pulumi -C shared-tcp stack output "$n-hostname")
      perl -0pi -e "s/(name: $VAR\n\s*value: )\"[^\"]*\"/\${1}\"$HOST\"/" ctfd/healthcheck-cronjob.yaml
      echo "$VAR=$HOST"
    done
    ```
    The block prints three lines, each ending in `.elb.<region>.amazonaws.com`.
3. Create the schedule, then run the check once and read its results:
    ```bash
    make deploy-healthcheck-cronjob
    make run-healthcheck
    sleep 60; kubectl logs -n ctfd -l job-name --tail=30 --prefix | grep -i -e pass -e fail
    ```

**Check it worked:** every challenge shows `PASS`, and nothing appears in the alerts channel.

Then check that alerts reach Discord. Stop one challenge, wait for the next 5-minute run, and look for the alert:

```bash
kubectl scale deploy/base64converter -n challenges-web --replicas=0
```

When the alert arrives, start the challenge again:

```bash
kubectl scale deploy/base64converter -n challenges-web --replicas=1
```

`kubectl scale` changes how many copies of a challenge run. Zero stops it.

!!! tip "If you add or remove a pwn challenge"
    The health check lists the pwn challenges in two places: names and ports in `utils/healthcheck.py` (`SHARED_TCP_CHALLENGES`), and addresses in `ctfd/healthcheck-cronjob.yaml`. Update both, then rerun `make deploy-healthcheck-cronjob`.

## If it fails

| Message | Fix |
|---|---|
| The backup job shows `Error`, and its log says `AccessDenied` | The job isn't allowed to write to the bucket, usually because the old account ID is still in `utils/ctfd/main.go`. Redo [Make it yours](../code/make-it-yours.md), then rerun `make deploy-ctfd` |
| `NoSuchBucket` | The bucket name in the Makefile (`BACKUP_BUCKET`) doesn't match `<event>-ctfd-backups`. Redo [Make it yours](../code/make-it-yours.md) |
| A pwn challenge shows `FAIL` | The address in the settings file is out of date. Redo step 2, then step 3 |

**Next:** [5. Final checks](verify.md).
