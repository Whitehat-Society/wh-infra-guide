# 5. Final checks

<span class="time">⏱ ~10 min</span>

Run these after every fresh deploy, and again on the morning of the event.

## Automated

--8<-- "pulumi-env.md"

The block above sets the Pulumi variables the smoke test needs. Then:

```bash
make smoke-test
```

Expected: `PASS` for every web and pwn challenge. `filelocker` shows `FAIL` because it needs chall-manager; see the [appendix](../reference/chall-manager.md).

## By hand

Replace `example-ctf.com` with your domain:

```bash
DOMAIN=example-ctf.com
curl -sI "http://ctf.$DOMAIN" | head -1                                    # 308 → redirects to https
curl -sv "https://ctf.$DOMAIN" 2>&1 | grep -m1 'issuer:'                  # Let's Encrypt
curl -s -o /dev/null -w '%{http_code}\n' "https://xssive-login.challenges.$DOMAIN"   # 200
kubectl get pods -A | grep -v -e Running -e Completed                     # header only
kubectl get nodes                                                        # all Ready
```

- [ ] `https://ctf.<your-domain>` loads with a padlock, and you can log in as admin
- [ ] **Admin → Challenges** lists every challenge
- [ ] Open each web challenge's URL from its `connection_info`: the page loads
- [ ] Run each pwn challenge's `nc` command: you get the challenge's prompt
- [ ] A test team can register, see a visible challenge and submit a flag (then delete the team)
- [ ] `#infra-alerts` got the health-check test alert from [page 4](day2.md)
- [ ] A backup file from the last hour is in S3: `aws s3 ls s3://$EVENT-ctfd-backups/ | tail -1`
- [ ] No alarm is firing: `aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[].AlarmName'` prints `[]`

## If something fails

Start with [Troubleshooting](../reference/troubleshooting.md). For a single challenge, its pod logs usually say why:

```bash
kubectl logs -n challenges-web deploy/<name> --tail=50
kubectl logs -n challenges-tcp deploy/<name> --tail=50
```

**Done.** The stack is live. Next: [Run the event](../operate/monitoring.md). If the event is more than a day away, consider [tearing down](../teardown.md) and redeploying the day before, at about US$11 per day saved.
