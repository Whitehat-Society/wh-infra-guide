# Discord and GitHub

<span class="time">Time: about 10 minutes</span>

## Discord webhooks

A **webhook** is a secret web address that lets a program post messages into one Discord channel. The system posts in two places, so you need two webhooks:

| Name used later | What posts there | Suggested channel |
|---|---|---|
| `discord_webhook_url` | CTFd, announcing the first three solves of each challenge | a public announcements channel |
| `discord_alert_webhook_url` | Alarms and the health check, when something breaks | a staff-only channel such as `#infra-alerts` |

--8<-- "rec-pending.md"

Do these steps once for each channel:

1. In Discord, hover over the channel and click the gear icon (**Edit Channel**).
2. Open **Integrations**, then **Webhooks**, then **New Webhook**.
3. Click the new webhook, give it a name such as `CTFd` or `Infra alerts`, and click **Copy Webhook URL**.
4. Paste the address into a temporary note. [Settings and secrets](../code/config.md) stores it properly.

You need the **Manage Webhooks** permission on the server. If **Integrations** is missing, ask a server admin.

**Check it worked:** send a test message. Paste your webhook address in place of the example:

```bash
curl -sS -H 'Content-Type: application/json' -d '{"content":"webhook test"}' "https://discord.com/api/webhooks/..."
```

The command prints nothing, and "webhook test" appears in the channel.

!!! danger "Treat a webhook address like a password"
    Anyone who has it can post in the channel. Never paste it into the code or a public chat.

## GitHub

**GitHub** is the website that stores the club's code. **Git** is the program that downloads it and records changes. The code is in a private repository, a project folder on GitHub, called `Whitehat-Society/wh-2026`.

1. Create a GitHub account at <https://github.com/signup> if you don't have one.
2. Send your GitHub username to the current infra lead and ask for access to `Whitehat-Society/wh-2026`.
3. Accept the invitation from the email, or from <https://github.com/Whitehat-Society>.
4. Install GitHub's command-line tool, `gh`, and sign in. It lets `git` download private code:
    ```bash
    # Linux and Windows (Ubuntu):
    sudo apt-get install -y gh
    # macOS:
    brew install gh

    gh auth login --git-protocol https --web
    ```
    Follow the prompts. It shows a code and opens a browser where you enter it.

**Check it worked:**

```bash
gh repo view Whitehat-Society/wh-2026 --json name -q .name
```

The output is `wh-2026`.

**Next:** [Get the code](../code/clone.md).
