# 5. Final checks

Run these checks after every fresh deploy, and again on the morning of the event, to confirm that a player can reach everything.

## Automatic check

`make smoke-test` opens every web challenge and connects to every pwn challenge, and then prints `PASS` or `FAIL` for each one:

```bash
cd ~/wh/wh-2027/utils
make smoke-test
```

It runs the same check as the health check job against every web and pwn challenge, but from your computer and without posting to Discord. The output should end like this:

```
=== Results: 2 passed, 0 failed ===
```

The count is the number of web and pwn challenges, which is 2 with only the templates.

## Checks from the terminal

Replace `example-ctf.com` with your domain and run the box. The list below it describes what each line should print.

```bash
DOMAIN=example-ctf.com
curl -sI "http://ctf.$DOMAIN" | head -1
curl -sv "https://ctf.$DOMAIN" 2>&1 | grep -m1 'issuer:'
curl -s -o /dev/null -w '%{http_code}\n' "https://example-web.challenges.$DOMAIN"
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
- [ ] A backup from the last hour is in S3, which `aws s3 ls s3://$(python3 settings.py backup_bucket)/ | tail -1` shows.
- [ ] `aws cloudwatch describe-alarms --state-value ALARM --query 'MetricAlarms[].AlarmName'` prints `[]`, which means no alarm is active.

## If a check fails

Start with [Troubleshooting](../reference/troubleshooting.md). When a single challenge is broken, its own output usually explains the problem:

```bash
kubectl logs -n challenges-web deploy/<name> --tail=50
kubectl logs -n challenges-tcp deploy/<name> --tail=50
```

## Check your understanding

These questions also use what you learned in sections 1 to 4. Work out your answer before you open the hidden one.

!!! question "1. The overnight build"
    Late at night you add a challenge and start `make build-images`, and then go to bed without reading the end. In the morning, the last line says `FAILED, so nothing was deployed and the running challenges are unchanged:` followed by your new challenge's folder. `lost-cookie` was deployed and working the day before. What state is it in now, and what about the new challenge?

    ??? success "Answer"
        `lost-cookie` is still up with its old version, because a failed build stops the run before Pulumi changes anything. The new challenge isn't deployed and isn't in CTFd, and neither is any other change from that run. Fix the build using the `ERROR <folder>:` line further up, run `make build-images` again, and always read the last lines of a run before you walk away.

!!! question "2. The alerts channel was deleted"
    Someone deletes `#infra-alerts` by mistake. You create a new channel and a new webhook. Where does the new address go, and once it's there, does every alert use it?

    ??? success "Answer"
        It goes into Secrets Manager, never into the code. Run `make secrets`, paste the new address at `discord_alert_webhook_url`, and press Enter at the other questions to keep their values. The alarms pick up the new address straight away, because the program that posts them reads the secret each time it runs. The health check doesn't, because `make deploy-healthcheck-cronjob` copied the old address into the cluster when you ran it. Run that command again, and then test the new channel by stopping a challenge for one run, as in [Health checks](day2.md#health-checks).

!!! question "3. Deployed four days early"
    The deploy passes every final check on Monday evening, and the event starts on Friday morning. Should you leave the system running until then, and what do you need to redo if you don't?

    ??? success "Answer"
        Delete it. At about US$0.45 an hour, four days cost around US$43, which nearly uses up a US$50 budget before the event starts, while a fresh deploy takes about 1.5 hours. If you redeploy on Thursday, you redo CTFd's setup page, because the new database is empty, and the pwn challenges get new load balancer addresses, which `make build-images` and `make deploy-healthcheck-cronjob` pick up. Don't rebuild the system many times in the same week, because Let's Encrypt issues at most 5 identical certificates a week, and a sixth build would have no `https`.

!!! question "4. It works for you but not for a friend"
    `make smoke-test` passes and the scoreboard opens on your laptop. A friend at home says `ctf.<your-domain>` "doesn't exist". What are the two likely causes, and how do you tell them apart?

    ??? success "Answer"
        Either your friend looked the name up before its record existed, and their network is still remembering "doesn't exist" for up to 15 minutes, or their internet provider blocks the free domain service your test domain comes from. Ask them to run `nslookup ctf.<your-domain>` and `nslookup ctf.<your-domain> 8.8.8.8`. If the first fails and the second works, their network is at fault, and waiting 15 minutes fixes the first cause but not the second. A blocked domain affects every player on that provider, which is one more reason to buy a real domain for the event.

Once every check passes, the system is live, and the next thing to read is [Run the event](../operate/index.md). If the event is more than a day away, [delete everything](../teardown.md) and deploy again the day before, which saves about US$11 for every day in between.
