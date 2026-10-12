# Collect the results

After the event, the club needs the final scoreboard to award prizes, and statistics for the post-event report and for planning the next event. All of this lives in CTFd's database or in CloudWatch, and [teardown](../teardown.md) deletes both, so collect everything on this page **before** you delete the system.

## During the event

| Question | Where to look |
|---|---|
| Who is winning? | `https://ctf.<your-domain>/scoreboard` |
| How many teams have registered, and how many solves are there? | CTFd's **Admin → Statistics** page |
| Which challenges has nobody solved yet? | The solve counts for each challenge on **Admin → Statistics** |
| Is a challenge getting a lot of wrong answers? | **Admin → Submissions**, filtered by the challenge and **Incorrect** |
| Is the system coping? | The CloudWatch dashboard described in [Watching the system](monitoring.md) |

## After the event: CTFd's data

Do these steps in order, as soon as the CTF ends.

1. **Freeze the scoreboard.** In **Admin → Config → Start and End Time**, set the end time to now if it isn't set already, so that players can no longer submit flags.
2. **Take a final backup** and download it, as described in [Keep a copy after the event](backups.md#keep-a-copy-after-the-event).
3. **Export the results as spreadsheets.** This script saves six CSV files to `~/wh/results/`, and they open in Excel or Google Sheets.
    ```bash
    cd ~/wh/wh-2026/utils
    curl -sSLo export_results.py https://lampardnk.github.io/wh-infra-guide/assets/scripts/export_results.py
    python3 export_results.py
    ```
    It prints one line for each file, such as `submissions.csv: 4812 rows`, followed by `Saved in /home/<you>/wh/results`. Here is the script itself:

    ```python
    --8<-- "export_results.py"
    ```

    | File | One row per | Use it for |
    |---|---|---|
    | `scoreboard.csv` | Team, in final order | Prizes. The `members` column lists each player's score. |
    | `teams.csv`, `users.csv` | Team, player | Contact lists. These contain emails, so keep them private. |
    | `challenges.csv` | Challenge | Points and categories |
    | `submissions.csv` | Flag submitted, right or wrong | Judging difficulty, from the wrong answers for each challenge and the time to its first solve |
    | `solves_per_challenge.csv` | Challenge | How many teams solved each one |

4. **Optionally, use CTFd's own export as well.** **Admin → Config → Import & Export → Export** downloads a `.zip` of everything, including the uploaded files, which CTFd can import again later. The **Download CSV** tab next to it downloads single tables. Both need you to be logged in to the browser as admin.

!!! warning "Check the addresses before you trust them"
    The `ip` column in `submissions.csv` only holds each player's own address if the load balancer passes it on, as [Rate limits](risks.md#rate-limits) explains. If every row shows the same `10.100.…` address, the addresses belong to the load balancer, so they can't reveal players who share an account.

## After the event: system statistics

These statistics show how much load the system carried, which helps when sizing the next event. CloudWatch keeps them in the cluster's logs, and [teardown](../teardown.md) deletes those logs, so run these queries first.

=== "Requests and errors per challenge"

    ```bash
    EVENT=$(jq -r .event_name ~/wh/wh-2026/utils/eks/terraform.tfvars.json)
    ID=$(aws logs start-query --log-group-name "/aws/containerinsights/$EVENT-eks/application" \
      --start-time $(( $(date +%s) - 3 * 86400 )) --end-time $(date +%s) \
      --query-string 'filter kubernetes.container_name = "controller" | parse log /" (?<status>\d{3}) \d+ .*\[(?<upstream>[^\]]+)\] \[/ | filter ispresent(upstream) | stats count(*) as requests, sum(status >= 500) as errors by upstream | sort requests desc | limit 50' \
      --query queryId --output text)
    sleep 30; aws logs get-query-results --query-id "$ID" --query 'results[*][*].value' --output text
    ```

    Each line shows `<namespace>-<name>-<port>`, the number of requests, and how many of them failed with a `5xx` error, where `ctfd-ctfd-8000` is the scoreboard. A challenge with many errors was overloaded or broken, so compare it with its health check alerts. `3 * 86400` means three days back, so adjust it to cover the whole event.

=== "Busiest minutes"

    ```bash
    ID=$(aws logs start-query --log-group-name "/aws/containerinsights/$EVENT-eks/application" \
      --start-time $(( $(date +%s) - 3 * 86400 )) --end-time $(date +%s) \
      --query-string 'filter kubernetes.container_name = "controller" | parse log /^(?<ip>\S+) - / | filter ispresent(ip) | stats count(*) as requests by bin(1m) as minute | sort requests desc | limit 10' \
      --query queryId --output text)
    sleep 30; aws logs get-query-results --query-id "$ID" --query 'results[*][*].value' --output text
    ```

    This prints the ten busiest minutes with their request counts. Divide a count by 60 to get requests per second.

=== "Memory, processor, node count"

    Open the CloudWatch dashboard from [Watching the system](monitoring.md), set the time range to cover the event, and use **Actions → Download as .png** on each graph. The peak memory for each pod tells you how close it came to the 512 MB limit.

If a query prints nothing, or prints `"status": "Running"`, it hasn't finished yet, because large queries take longer. Wait 30 seconds and run only its last line again.

## Write it down

Put the numbers into the post-event report and store it, together with the files from this page, in the club's shared drive, where the next infra team will use them to set limits and copy counts. The most useful numbers are the teams and players registered, the peak requests per second, the busiest challenge, any challenges with many `5xx` errors, and any node that ran out of memory.

**Next:** [Delete everything](../teardown.md).
