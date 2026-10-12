# 5. Final checks

Run these checks after every fresh deploy, and again on the morning of the event. They confirm that a player can reach everything.

## Automatic check

`make smoke-test` opens every web challenge and connects to every pwn challenge, then prints `PASS` or `FAIL` for each. First set the variables it needs:

--8<-- "pulumi-env.md"

Then run it:

```bash
make smoke-test
```

Every web and pwn challenge shows `PASS`. `filelocker` shows `FAIL`, because it needs the optional chall-manager; see the [appendix](../reference/chall-manager.md).

## Checks from the terminal

Replace `example-ctf.com` with your domain, then run the block. Each line's expected result is described below it.

```bash
DOMAIN=example-ctf.com
curl -sI "http://ctf.$DOMAIN" | head -1
curl -sv "https://ctf.$DOMAIN" 2>&1 | grep -m1 'issuer:'
curl -s -o /dev/null -w '%{http_code}\n' "https://xssive-login.challenges.$DOMAIN"
kubectl get pods -A | grep -v -e Running -e Completed
kubectl get nodes
```

1. `HTTP/1.1 308`: a plain `http://` visit is redirected to the encrypted `https://` address.
2. A line containing `Let's Encrypt`: the certificate was issued by Let's Encrypt.
3. `200`: the web challenge answered normally.
4. Only the header line: every pod is running.
5. Three nodes, all `Ready`.

## Checks in the browser

- [ ] `https://ctf.<your-domain>` loads with a padlock, and you can log in as admin
- [ ] **Admin → Challenges** lists every challenge
- [ ] Each web challenge's address, shown under its connection info, opens a page
- [ ] Each pwn challenge's `nc` command, run in your terminal, shows the challenge's first prompt
- [ ] A test team can register, see a visible challenge and submit its flag. Delete the test team afterwards
- [ ] The alerts channel received the test alert from [page 4](day2.md)
- [ ] A backup from the last hour is in S3: `aws s3 ls s3://$EVENT-ctfd-backups/ | tail -1`
- [ ] No alarm is active: `aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[].AlarmName'` prints `[]`

## If a check fails

Start with [Troubleshooting](../reference/troubleshooting.md). For one broken challenge, its own output usually explains the problem:

```bash
kubectl logs -n challenges-web deploy/<name> --tail=50
kubectl logs -n challenges-tcp deploy/<name> --tail=50
```

The system is live once every check passes. Next, read [Run the event](../operate/monitoring.md). If the event is more than a day away, [delete everything](../teardown.md) and deploy again the day before. That saves about US$11 per day.
