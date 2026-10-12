# Backup & restore

<span class="time">⏱ 2 min to back up · ~5 min to restore</span>

The CTFd database (teams, solves, scores) is the one thing you can't rebuild. Everything else comes back from code with `make` commands.

## Take a backup now

Run this before any risky change, and right after the event ends:

```bash
cd ~/wh/wh-2026/utils
make backup-ctfd
kubectl get jobs -n ctfd -w        # Ctrl+C once the new job shows 1/1
EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
aws s3 ls "s3://$EVENT-ctfd-backups/" | tail -3
```

Expected: a new `ctfd-YYYYMMDD-HHMMSS.sql.gz` from the last minute.

## Restore a backup

!!! danger "Restore overwrites the live database"
    Every solve since that backup is lost. Take a fresh backup first, so you can undo the restore.

1. List the backups and pick one:
    ```bash
    make restore-ctfd
    ```
    Without `FILE=`, it only prints the list
2. Restore it:
    ```bash
    make restore-ctfd FILE=ctfd-20270628-120000.sql.gz
    ```
3. Restart CTFd so it drops cached data:
    ```bash
    kubectl rollout restart deploy/ctfd -n ctfd
    ```

**Check it worked:** the scoreboard shows the scores from the time of the backup.

## Keep a copy after the event

The S3 bucket is deleted on teardown. Download the final backup first:

```bash
aws s3 cp "s3://$EVENT-ctfd-backups/$(aws s3 ls "s3://$EVENT-ctfd-backups/" | tail -1 | awk '{print $4}')" ~/wh/
```

Store it with the club's other event archives. It contains player emails and password hashes, so **don't commit it to a public repo**.
