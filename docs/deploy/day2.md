# 4. Backups & health checks

<span class="time">⏱ ~10 min</span>

Two Kubernetes CronJobs, both in the `ctfd` namespace:

| Job | Schedule | What it does |
|---|---|---|
| `ctfd-backup` | every hour, minute 0 | `mysqldump` of the CTFd database → gzip → `s3://<event>-ctfd-backups/`. Kept 30 days |
| `challenge-healthcheck` | every 5 min | `curl` each web challenge and `nc` each pwn challenge. Posts to `#infra-alerts` when something fails |

## Backups

1. Deploy the CronJob:
    ```bash
    cd ~/wh/wh-2026/utils
    make deploy-ctfd-backup-cronjob
    ```
2. Run one backup now instead of waiting for the hour:
    ```bash
    make backup-ctfd
    kubectl get jobs -n ctfd -w      # Ctrl+C once COMPLETIONS shows 1/1
    ```

**Check it worked:**

```bash
EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
aws s3 ls "s3://$EVENT-ctfd-backups/"
```

Expected: one `ctfd-YYYYMMDD-HHMMSS.sql.gz` file, bigger than 0 bytes.

## Health checks

The health check needs two things the repo doesn't set up for you: the Discord alert webhook as a Kubernetes Secret, and the current pwn load balancer hostnames.

1. Store the alert webhook in the cluster:
    ```bash
    kubectl create secret generic healthcheck-webhook -n ctfd \
      --from-literal=url="$(python3 secrets.py get discord_alert_webhook_url)" \
      --dry-run=client -o yaml | kubectl apply -f -
    ```
2. Write the pwn hostnames into the CronJob file. They change every time the pwn stack is recreated, so rerun this block after each fresh deploy:
    --8<-- "pulumi-env.md"
    ```bash
    pulumi -C shared-tcp stack select "$EVENT"
    for n in loop library xoph-dark-embers; do
      VAR="SHARED_TCP_$(echo "$n" | tr 'a-z-' 'A-Z_')_HOSTNAME"
      HOST=$(pulumi -C shared-tcp stack output "$n-hostname")
      perl -0pi -e "s/(name: $VAR\n\s*value: )\"[^\"]*\"/\${1}\"$HOST\"/" ctfd/healthcheck-cronjob.yaml
      echo "$VAR=$HOST"
    done
    ```
    Expected: three lines, each with a hostname ending in `.elb.ap-southeast-1.amazonaws.com`
3. Deploy it and run it once:
    ```bash
    make deploy-healthcheck-cronjob
    make run-healthcheck
    sleep 60; kubectl logs -n ctfd -l job-name --tail=30 --prefix | grep -i -e pass -e fail
    ```

**Check it worked:** every challenge shows `PASS`, and nothing is posted to `#infra-alerts`. Then test the alert path: scale one challenge down, wait for the next 5-minute run, and check that Discord gets an alert:

```bash
kubectl scale deploy/base64converter -n challenges-web --replicas=0
# … wait for the alert in Discord …
kubectl scale deploy/base64converter -n challenges-web --replicas=1
```

!!! tip "If you change the pwn challenge list"
    The health check has the pwn names and ports in `utils/healthcheck.py` (`SHARED_TCP_CHALLENGES`) and the hostnames in `ctfd/healthcheck-cronjob.yaml`. Update both, then rerun `make deploy-healthcheck-cronjob`.

## If it fails

| Symptom | Fix |
|---|---|
| Backup job `Error`, log says `AccessDenied` | The `ctfd-backup` service account's IAM role doesn't match. Check that [Make it yours](../code/make-it-yours.md) replaced the account ID in `ctfd/main.go`, then rerun `make deploy-ctfd` |
| `NoSuchBucket` | The bucket is created by `make deploy-eks`. Check `BACKUP_BUCKET` in the Makefile matches `<event>-ctfd-backups` |
| Health check says `FAIL` for a pwn challenge | The hostname is stale. Redo step 2, then step 3 |

**Next:** [5. Final checks](verify.md).
