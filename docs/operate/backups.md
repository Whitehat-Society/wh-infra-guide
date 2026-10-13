# Backup and restore

The CTFd database holds every team, solve and score. It is the only part of the system that you can't rebuild from the code, so it is backed up every hour, and each backup is one compressed file in the S3 bucket `<event>-ctfd-backups`.

<figure class="diagram">
--8<-- "diagrams/restore.svg"
<figcaption>A restore replaces the whole live database with the chosen file.</figcaption>
</figure>

## Take a backup now

Take an extra backup before any risky change, and another one right after the event ends:

```bash
cd ~/wh/wh-2027/utils
make backup-ctfd
kubectl get jobs -n ctfd -w
```

When the new job's `COMPLETIONS` column shows `1/1`, press Ctrl+C, and then check that the file arrived:

```bash
EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
aws s3 ls "s3://$EVENT-ctfd-backups/" | tail -3
```

The last line should show a file named `ctfd-<date>-<time>.sql.gz` from the last minute or two.

## Restore a backup

Restoring a backup replaces the whole database with the backup's contents.

!!! danger "Every change since the backup is lost"
    Any solves and registrations made after the backup was taken disappear. Take a fresh backup first, so that you can undo the restore if you need to.

1. [Take a backup now](#take-a-backup-now).
2. List the available backups:
    ```bash
    make restore-ctfd
    ```
    Without a file name, the command only prints the list.
3. Restore the backup you want, using its name from the list:
    ```bash
    make restore-ctfd FILE=ctfd-20270628-120000.sql.gz
    ```
    The command downloads the file and checks it before it touches anything. It then pauses the hourly backups, stops CTFd so nobody plays on a half-loaded database, loads the file, prints how many users, teams and solves the database now holds, and clears CTFd's cache, which also logs every player out. Last, it starts CTFd and the backups again and prints `Restore complete: <file>`.

**Check it worked:** the counts it printed look right, and the scoreboard shows the scores as they were when the backup was taken.

If the command stops with `Restore FAILED. CTFd is left stopped and backups paused.`, the site stays down on purpose. Read the error above that line, fix it, and run the same command again. A failure while downloading or checking the file stops before CTFd does, so the site keeps running.

## Keep a copy after the event

Deleting the system also deletes the backup bucket, so download the last backup before you tear down. The backup holds only the database, since the files that players downloaded can be rebuilt from the repository with `ctf challenge sync`.

```bash
aws s3 cp "s3://$EVENT-ctfd-backups/$(aws s3 ls "s3://$EVENT-ctfd-backups/" | tail -1 | awk '{print $4}')" ~/wh/
```

Store the file with the club's other event records. It contains players' emails and scrambled passwords, so never upload it anywhere public.
