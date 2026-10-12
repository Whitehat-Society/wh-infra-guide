# Backup and restore

<span class="time">Time: 2 minutes to back up, about 5 minutes to restore</span>

The CTFd database holds every team, solve and score. It is the only part of the system you can't rebuild from the code, so it is backed up every hour. A backup is one compressed file in the S3 bucket `<event>-ctfd-backups`.

## Take a backup now

Take an extra backup before any risky change, and again right after the event ends:

```bash
cd ~/wh/wh-2026/utils
make backup-ctfd
kubectl get jobs -n ctfd -w
```

When the new job's `COMPLETIONS` column shows `1/1`, press Ctrl+C. Then check the file arrived:

```bash
EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
aws s3 ls "s3://$EVENT-ctfd-backups/" | tail -3
```

The last line shows a file named `ctfd-<date>-<time>.sql.gz` from the last minute or two.

## Restore a backup

Restoring replaces the whole database with the backup's contents.

!!! danger "Every change since the backup is lost"
    Solves and registrations after the backup's time disappear. Take a fresh backup first, so you can undo the restore if needed.

1. List the available backups:
    ```bash
    make restore-ctfd
    ```
    Without a file name, the command only prints the list.
2. Restore the one you want, using its name from the list:
    ```bash
    make restore-ctfd FILE=ctfd-20270628-120000.sql.gz
    ```
3. Restart CTFd, so it drops any data it remembered from before the restore:
    ```bash
    kubectl rollout restart deploy/ctfd -n ctfd
    ```

**Check it worked:** the scoreboard shows the scores as they were at the backup's time.

## Keep a copy after the event

Deleting the system also deletes the backup bucket. Download the last backup first:

```bash
aws s3 cp "s3://$EVENT-ctfd-backups/$(aws s3 ls "s3://$EVENT-ctfd-backups/" | tail -1 | awk '{print $4}')" ~/wh/
```

Store it with the club's other event records. It contains players' emails and scrambled passwords, so never upload it anywhere public.
