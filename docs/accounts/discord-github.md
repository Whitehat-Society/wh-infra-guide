# Discord & GitHub

<span class="time">⏱ 10 min</span>

## Discord webhooks

The stack posts to Discord in two places, so it needs two webhook URLs:

| Secret name | Who posts | Suggested channel |
|---|---|---|
| `discord_webhook_url` | CTFd: first-blood announcements (first 3 solves per challenge) | `#announcements` (public) |
| `discord_alert_webhook_url` | CloudWatch alarms and the 5-minute challenge health check | `#infra-alerts` (staff only) |

--8<-- "rec-pending.md"

For each channel:

1. In Discord, hover over the channel → ⚙️ **Edit Channel**
2. **Integrations** → **Webhooks** → **New Webhook**
3. Click the new webhook, name it `CTFd` or `Infra alerts`, then **Copy Webhook URL**
4. Paste it somewhere temporary. You'll store it as a secret in [Config files & secrets](../code/config.md)

You need the **Manage Webhooks** permission on the server. Ask a server admin if the **Integrations** tab is missing.

**Check it worked:** send a test message (replace the URL):

```bash
curl -sS -H 'Content-Type: application/json' -d '{"content":"webhook test"}' "https://discord.com/api/webhooks/..."
```

Expected: no output from `curl`, and "webhook test" appears in the channel.

!!! danger "A webhook URL is a password"
    Anyone who has it can post to the channel. Never commit it to git or paste it in public chat.

## GitHub

1. Make a GitHub account if you don't have one: <https://github.com/signup>
2. Send your username to the current infra lead and ask for access to **Whitehat-Society/wh-2026**
3. Accept the invite from the email, or at <https://github.com/Whitehat-Society>
4. Sign the CLI in, so `git clone` works for private repos:
    ```bash
    # Linux/WSL: sudo apt-get install -y gh     macOS: brew install gh
    gh auth login --git-protocol https --web
    ```

**Check it worked:**

```bash
gh repo view Whitehat-Society/wh-2026 --json name -q .name
```

Expected: `wh-2026`.

**Next:** [Get the code](../code/clone.md).
