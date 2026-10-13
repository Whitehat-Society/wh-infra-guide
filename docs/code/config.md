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

## Check your understanding

These questions also use what you learned in sections 1 and 3. Work out your answer before you open the hidden one.

!!! question "1. Reusing last year's settings file"
    To save time, you copy last year's `terraform.tfvars.json`, whose `event_name` is `wh-2026`, and change only the domain. You use the same AWS account as last year, and last year's system was deleted three days ago. What happens when you run `make secrets`, and what else goes wrong?

    ??? success "Answer"
        Every name comes from `event_name`, so the new event takes over all of last year's names. `make secrets` finds `wh-2026/config` still waiting out its 7 days of deletion, and it restores the secret instead of creating a new one. Your event would then run with last year's passwords, including the admin password that last year's committee knows. The buckets would also be named `wh-2026-pulumi-state` and `wh-2026-ctfd-backups`, and if another account holds those names, `make deploy-eks` fails with `BucketAlreadyExists`. Give each event a new `event_name`, and check every name with `make settings` before you go on.

!!! question "2. A teammate builds from their own laptop"
    During the event, a teammate has to run `make build-images` from their own laptop. They have cloned the event's repository and installed the tools. What else do they need, and what don't they need?

    ??? success "Answer"
        They need two things. The first is your filled-in `utils/eks/terraform.tfvars.json`, sent to them privately, because git no longer tracks it, so their copy of the repository doesn't contain it, and without it `settings.py` can't work out any names. The second is a login of their own through the same **AdministratorAccess** permission set that you deployed with. Everyone who signs in through that permission set acts as the same AWS role, and the cluster only lets in the role that created it, so a login made some other way can reach AWS but not the cluster. They don't need any password or token, because the build reads the Pulumi passphrase and CTFd's admin token from Secrets Manager. That is the reason secrets live there rather than in files.

!!! question "3. The settings file reached GitHub"
    You skipped step 2 of [Your settings](make-it-yours.md), and a teammate notices that your filled-in `terraform.tfvars.json` is in the event's repository on GitHub. What did that expose, and what didn't it?

    ??? success "Answer"
        It exposed your email addresses, the domain and the hosted zone's ID, which is why the file stays out of git. It exposed no passwords, tokens or webhook addresses, because those are only ever in Secrets Manager. Do step 2 now so that later changes stay on your computer. The old version stays in the repository's history, so if the repository could become public, ask the infra lead about removing it.

**Next:** [Deploy overview](../deploy/index.md).
