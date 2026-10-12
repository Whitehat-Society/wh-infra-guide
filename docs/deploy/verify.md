# 5. Final checks

Run these checks after every fresh deploy, and again on the morning of the event, to confirm that a player can reach everything.

## Automatic check

`make smoke-test` opens every web challenge and connects to every pwn challenge, and then prints `PASS` or `FAIL` for each one. First set the variables it needs:

--8<-- "pulumi-env.md"

Then run the test:

```bash
make smoke-test
```

It runs the same check as the health check job against every web and pwn challenge, but from your computer and without posting to Discord. The output should end like this:

```
=== Results: 10 passed, 0 failed ===

chall-manager not deployed (api_endpoint empty) — per-player challenges skipped.

Shared challenges: all passed
Per-player challenges: 0 passed, 0 failed
```

The count is the number of web and pwn challenges. `filelocker` isn't tested, because it needs the optional chall-manager described in the [appendix](../reference/chall-manager.md).

## Checks from the terminal

Replace `example-ctf.com` with your domain and run the box. The list below it describes what each line should print.

```bash
DOMAIN=example-ctf.com
curl -sI "http://ctf.$DOMAIN" | head -1
curl -sv "https://ctf.$DOMAIN" 2>&1 | grep -m1 'issuer:'
curl -s -o /dev/null -w '%{http_code}\n' "https://xssive-login.challenges.$DOMAIN"
kubectl get pods -A | grep -v -e Running -e Completed
kubectl get nodes
```

1. `HTTP/1.1 308`, which means that a plain `http://` visit is redirected to the encrypted `https://` address.
2. A line containing `Let's Encrypt`, which means that Let's Encrypt issued the certificate.
3. `200`, which means that the web challenge answered normally.
4. Only the header line, which means that every pod is running.
5. Between three and six nodes, with at least one in each of the three zones and all of them `Ready`. The cluster adds a node by itself when pods need more room.

## Checks in the browser

- [ ] `https://ctf.<your-domain>` loads with a padlock, and you can log in as admin.
- [ ] **Admin → Challenges** lists every challenge.
- [ ] Each web challenge's address, shown under its connection info, opens a page.
- [ ] Each pwn challenge's `nc` command, run in your terminal, shows the challenge's first prompt.
- [ ] A test team can register, see a visible challenge and submit its flag. Delete the test team afterwards.
- [ ] The alerts channel received the test alert from [page 4](day2.md).
- [ ] A backup from the last hour is in S3, which `aws s3 ls s3://$EVENT-ctfd-backups/ | tail -1` shows.
- [ ] `aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[].AlarmName'` lists no active alarm except `<event>-chall-manager-pod-down`. That one stays active because chall-manager isn't deployed, and [The cluster](eks.md) already turned off its notifications.

## If a check fails

Start with [Troubleshooting](../reference/troubleshooting.md). When a single challenge is broken, its own output usually explains the problem:

```bash
kubectl logs -n challenges-web deploy/<name> --tail=50
kubectl logs -n challenges-tcp deploy/<name> --tail=50
```

Once every check passes, the system is live, and the next thing to read is [Run the event](../operate/monitoring.md). If the event is more than a day away, [delete everything](../teardown.md) and deploy again the day before, which saves about US$11 for every day in between.
