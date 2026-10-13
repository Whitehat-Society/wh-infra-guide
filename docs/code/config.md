# Secrets

The event's passwords and tokens live in one **secret** in AWS Secrets Manager, named `<event>/config`, rather than in any file. Every teammate and every program reads the same values from there, and nothing secret is ever on GitHub.

<figure class="diagram">
--8<-- "diagrams/settings.svg"
<figcaption>The settings files stay on your computer, and every name the tools use is worked out from them. The secret lives in AWS, so every teammate and every program reads the same passwords.</figcaption>
</figure>

## Create and fill the secret

One command creates the secret, generates the passwords and asks you for the four values that only you know:

```bash
cd ~/wh/wh-2027/utils
make secrets
```

It generates these five, once, and never changes them afterwards:

| Secret | What it is for |
|---|---|
| `admin_password` | The scoreboard's admin login. Read it with `python3 secrets.py get admin_password` when you need it. |
| `ctfd_admin_token` | The token that scripts use to log in to CTFd. |
| `db_password` | The database's password. |
| `pulumi_passphrase` | The passphrase that locks Pulumi's records. |
| `secret_key` | The key CTFd uses to sign login sessions. |

Then it asks for these four, one at a time. Type or paste each value and press Enter:

| Question | What to enter |
|---|---|
| `admin_email` | The scoreboard admin's email address, such as the club's email. |
| `admin_name` | The admin's username, such as `admin`. |
| `discord_webhook_url` | The first-solve webhook address from [Discord and GitHub](../accounts/discord-github.md). |
| `discord_alert_webhook_url` | The alerts webhook address from the same page. |

Running `make secrets` again is safe. It keeps every value that is already set, so pressing Enter at a question leaves that value unchanged, and typing a new value replaces it.

!!! danger "Never lose or change `pulumi_passphrase`"
    Pulumi needs the passphrase to read its own records, and without it nobody can update or delete what Pulumi built. Secrets Manager keeps it safe for you, so don't change it while the system is running.

## Check it worked

```bash
python3 secrets.py list
```

It prints nine names, from `admin_email` to `secret_key`. If `make secrets` ended with `Still empty:` and a list of names, those values are missing, and running `make secrets` again lets you fill them in.

## If it fails

| Message | Fix |
|---|---|
| `AccessDeniedException` | Your terminal is signed in as a user without permission, or not signed in at all, so [sign in again](../accounts/cli-login.md#signing-in-again). |
| `Restored <event>/config, which a teardown had scheduled for deletion.` | This isn't an error. A teardown in the last 7 days deleted the secret, and the command brought it back with its old values. |
| `fill in … first (they still say CHANGE-ME)` | The settings file isn't finished, so go back to [Your settings](make-it-yours.md). |

**Next:** [Deploy overview](../deploy/index.md).
