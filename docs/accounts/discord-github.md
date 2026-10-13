# Discord and GitHub

## Discord webhooks

A **webhook** is a secret web address that lets a program post messages into one Discord channel. The system posts in two different places, so you need two webhooks.

| Name used later | What posts there | Suggested channel |
|---|---|---|
| `discord_webhook_url` | CTFd, which announces the first three solves of each challenge | A public announcements channel |
| `discord_alert_webhook_url` | The alarms and the health check, which post when something breaks | A staff-only channel such as `#infra-alerts` |

<video controls preload="metadata" poster="../../assets/video/accounts/discord-webhook.jpg" src="../../assets/video/accounts/discord-webhook.mp4"></video>

Do these steps once for each of the two channels:

1. In Discord, hover over the channel and click the gear icon, which is labelled **Edit Channel**.
2. Open **Integrations** and click **Create Webhook**. If the channel already has webhooks, click **Webhooks** and then **New Webhook** instead.
3. Click the new webhook to open it, change its name to `CTFd` or `Infra alerts`, and click **Save Changes** in the bar at the bottom.
4. Click **Copy Webhook URL** and paste the address into a temporary note. You'll store it properly on [Settings and secrets](../code/config.md).

These steps need the **Manage Webhooks** permission on the server, so if **Integrations** is missing, ask a server admin to give you that permission.

**Check it worked:** send a test message, pasting your webhook address in place of the example:

```bash
curl -sS -H 'Content-Type: application/json' -d '{"content":"webhook test"}' "https://discord.com/api/webhooks/..."
```

The command prints nothing, and "webhook test" appears in the channel under the webhook's name.

!!! danger "Treat a webhook address like a password"
    Anyone who has the address can post in the channel, so never paste it into the code or into a public chat.

## GitHub

**GitHub** is the website that stores the club's code, and **Git** is the program that downloads the code and records changes to it. The code lives in a private repository, which is a project folder on GitHub, called `Whitehat-Society/wh-2026`.

1. Create a GitHub account at <https://github.com/signup> if you don't have one.
2. Send your GitHub username to the current infra lead and ask for access to `Whitehat-Society/wh-2026`.
3. Accept the invitation, either from the email or from <https://github.com/Whitehat-Society>.
4. Install GitHub's command-line tool, `gh`, and sign in with it, which lets `git` download private code:
    ```bash
    # Linux and Windows (Ubuntu):
    sudo apt-get install -y gh
    # macOS:
    brew install gh

    gh auth login --git-protocol https --web
    ```
    Follow the prompts. The tool shows a code and opens a browser where you enter it.

**Check it worked:**

```bash
gh repo view Whitehat-Society/wh-2026 --json name -q .name
```

The output should be `wh-2026`.

**Next:** [Code and settings: overview](../code/index.md).
