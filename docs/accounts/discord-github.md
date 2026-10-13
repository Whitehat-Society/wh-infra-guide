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

**GitHub** is the website that stores the club's code, and **Git** is the program that downloads the code and records changes to it. The code lives in a private repository, which is a project folder on GitHub, called `Whitehat-Society/wh-base`. It holds everything an event needs, and each event starts as a copy of it.

1. Create a GitHub account at <https://github.com/signup> if you don't have one.
2. Send your GitHub username to the current infra lead and ask for access to `Whitehat-Society/wh-base`.
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
gh repo view Whitehat-Society/wh-base --json name -q .name
```

The output should be `wh-base`.

## Check your understanding

These questions also use what you learned in section 1. Work out your answer before you open the hidden one.

!!! question "1. A deploy late in the day"
    You signed in with `aws configure sso` at 2 pm. At 9.30 pm you start a deploy step that takes about 20 minutes. What is likely to happen, and what should you do before you start?

    ??? success "Answer"
        The login lasts 8 hours, so it runs out at about 10 pm, partway through the step, and the command fails with `ExpiredToken` or `SSO session … expired`. Run `aws sso login` before you start, so that the login covers the whole run. If it does run out halfway, nothing is lost. Sign in again and run the same command again, and Terraform and Pulumi carry on from where they stopped, because each keeps a record of what it has already built.

!!! question "2. A teammate asks for the root password"
    A new teammate needs to help with the deploy from their own laptop, and asks you to send them the root user's password so that they can sign in. What do you do instead, and why is it better for the club?

    ??? success "Answer"
        Keep the root password in the password manager, and give the teammate a login of their own by repeating steps 3 and 5 of [Create your everyday login](aws.md#part-3-create-your-everyday-login). The root user can close the account, and sharing it means sharing its second factor too. A personal login has the AdministratorAccess the deploy needs, its terminal keys expire after 8 hours by themselves, and when the teammate leaves the committee you remove their login without changing anyone else's.

!!! question "3. The name servers haven't changed yet"
    It's Friday night, and the deploy is planned for Saturday morning. You've just entered the four Route 53 name servers at the company that sold the club its domain, and `dig +short NS <your-domain>` still prints the old ones. What depends on this change, and what do you check before Saturday?

    ??? success "Answer"
        Two things depend on it. Players' browsers only find `ctf.<your-domain>` once the internet asks Route 53 about the domain, and Let's Encrypt only issues the certificate once it can see the records that cert-manager adds there. The change can take up to two days to spread, and your own network may remember the old answer for hours. Check on Saturday morning with Google's public DNS, as in [Check it worked](domain.md#check-it-worked), which tells you whether the wider internet has the change even if your own network doesn't yet. If the certificate isn't ready after the deploy, this is the first place to look.

**Next:** [Code and settings: overview](../code/index.md).
