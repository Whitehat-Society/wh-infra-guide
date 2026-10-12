# Collect the results

After the event, the club needs the final scoreboard for prizes, and statistics for the post-event report and for planning the next event. All of it is in CTFd's database or in CloudWatch, and both are deleted at [teardown](../teardown.md). Collect everything on this page **before** you delete the system.

## During the event

| Question | Where to look |
|---|---|
| Who is winning? | `https://ctf.<your-domain>/scoreboard` |
| How many teams registered, how many solves? | CTFd **Admin → Statistics** |
| Which challenges nobody has solved yet? | **Admin → Statistics**, the solve counts per challenge |
| Is a challenge getting a lot of wrong answers? | **Admin → Submissions**, filter by challenge and **Incorrect** |
| Is the system coping? | The CloudWatch dashboard; see [Watching the system](monitoring.md) |

## After the event: CTFd's data

Do these in order, as soon as the CTF ends.

1. **Freeze the scoreboard.** In **Admin → Config → Start and End Time**, set the end time to now, if it isn't set already. Players can't submit flags after it.
2. **Take a final backup** and download it, as in [Keep a copy after the event](backups.md#keep-a-copy-after-the-event).
3. **Export the results as spreadsheets.** This script saves six CSV files, which open in Excel or Google Sheets, to `~/wh/results/`:
    ```bash
    cd ~/wh/wh-2026/utils
    curl -sSLo export_results.py https://whitehat-society.github.io/wh-infra-guide/assets/scripts/export_results.py
    python3 export_results.py
    ```
    It prints one line per file, e.g. `submissions.csv: 4812 rows`, then `Saved in /home/<you>/wh/results`. The script:

    ```python
    --8<-- "export_results.py"
    ```

    | File | One row per | Use it for |
    |---|---|---|
    | `scoreboard.csv` | Team, in final order | Prizes. `members` lists each player's score |
    | `teams.csv`, `users.csv` | Team, player | Contact lists. Contains emails: keep it private |
    | `challenges.csv` | Challenge | Points and categories |
    | `submissions.csv` | Flag submitted, right or wrong | Difficulty: wrong answers per challenge, time to first solve |
    | `solves_per_challenge.csv` | Challenge | How many teams solved each one |

4. **Optional: CTFd's own export.** **Admin → Config → Import & Export → Export** downloads a `.zip` of everything, including uploaded files, which CTFd can import again. The **Download CSV** tab next to it downloads single tables. Both need you logged in to the browser as admin.

!!! warning "Addresses in the data are not players' addresses"
    The `ip` column in `submissions.csv` shows the load balancer's internal address, such as `10.100.1.7`, for every player; see [Rate limits](risks.md#rate-limits). Don't use it to look for players sharing an account.

## After the event: system statistics

These show how much load the system carried, which helps size the next event. CloudWatch keeps them, and [teardown](../teardown.md) deletes the cluster's logs, so run these first.

=== "Requests and errors per challenge"

    ```bash
    EVENT=$(jq -r .event_name ~/wh/wh-2026/utils/eks/terraform.tfvars.json)
    ID=$(aws logs start-query --log-group-name "/aws/containerinsights/$EVENT-eks/application" \
      --start-time $(( $(date +%s) - 3 * 86400 )) --end-time $(date +%s) \
      --query-string 'filter kubernetes.container_name = "controller" | parse log /" (?<status>\d{3}) \d+ .*\[(?<upstream>[^\]]+)\] \[/ | filter ispresent(upstream) | stats count(*) as requests, sum(status >= 500) as errors by upstream | sort requests desc | limit 50' \
      --query queryId --output text)
    sleep 30; aws logs get-query-results --query-id "$ID" --query 'results[*][*].value' --output text
    ```

    Each line is `<namespace>-<name>-<port>`, the number of requests, and how many failed with a `5xx` error. `ctfd-ctfd-8000` is the scoreboard. A challenge with many errors was overloaded or broken; compare with its health check alerts. `3 * 86400` is three days back; adjust it to cover the event.

=== "Busiest minutes"

    ```bash
    ID=$(aws logs start-query --log-group-name "/aws/containerinsights/$EVENT-eks/application" \
      --start-time $(( $(date +%s) - 3 * 86400 )) --end-time $(date +%s) \
      --query-string 'filter kubernetes.container_name = "controller" | parse log /^(?<ip>\S+) - / | filter ispresent(ip) | stats count(*) as requests by bin(1m) as minute | sort requests desc | limit 10' \
      --query queryId --output text)
    sleep 30; aws logs get-query-results --query-id "$ID" --query 'results[*][*].value' --output text
    ```

    The ten busiest minutes, with their request counts. Divide by 60 for requests per second.

=== "Memory, processor, node count"

    Open the CloudWatch dashboard from [Watching the system](monitoring.md), set the time range to the event, and use **Actions → Download as .png** on each graph. Peak memory per pod tells you whether the 512 MB limit was close.

If a query prints nothing, wait 30 seconds and rerun only the last line: large queries take longer. `"status": "Running"` means the same.

## Write it down

Put the numbers into the post-event report, with the files from this page, in the club's shared drive. The next infra team uses them to set limits and copy counts. Useful numbers: teams and players registered; peak requests per second; the busiest challenge; challenges with many `5xx` errors; any node that ran out of memory.

**Next:** [Delete everything](../teardown.md).
