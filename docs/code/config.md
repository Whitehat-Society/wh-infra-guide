# Settings and secrets

<span class="time">Time: about 15 minutes</span>

The tools read your event's details from three settings files, and its passwords from AWS Secrets Manager. This page fills in all four. The settings files contain no passwords, and git ignores them, so they stay on your computer.

| Where | What it holds | Read by |
|---|---|---|
| `utils/eks/terraform.tfvars.json` | Event name, domain, cluster size, alarm emails | Terraform, when it builds the cluster |
| `utils/ecr/terraform.tfvars` | The name of the challenge image registry | Terraform, when it builds the registry |
| `utils/config.ini` | Domain, scoreboard address, bucket names | The Makefile, `builder.py` and the helper scripts |
| Secrets Manager, secret `<event>/config` | Passwords, tokens, webhook addresses | Everything that needs a secret |

Every command on this page runs in `~/wh/wh-2026/utils`.

## 1. Cluster settings

1. Copy the example file:
    ```bash
    cd ~/wh/wh-2026/utils
    cp eks/terraform.tfvars.json.example eks/terraform.tfvars.json
    ```
2. Open it with `nano eks/terraform.tfvars.json` and fill in each field between the quotes:

    | Field | What to enter |
    |---|---|
    | `event_name` | your event name, e.g. `wh-2027` |
    | `aws_region` | `ap-southeast-1` |
    | `domain_name` | your domain, e.g. `example-ctf.com`. The system only creates DNS records under this name |
    | `hosted_zone_id` | the ID starting with `Z` from [Domain name](../accounts/domain.md#check-it-worked) |
    | `acme_email` | an email address. Let's Encrypt writes to it if a certificate is about to expire |
    | `alarm_notification_emails` | the addresses that receive alarm emails, e.g. `["you@example.com"]` |
    | `node_min_size`, `node_desired_size`, `node_max_size` | `2`, `3` and `6`: the fewest, usual and most rented computers. Enough for about 100 teams |
    | `pulumi_state_bucket` | `<event>-pulumi-state`, e.g. `wh-2027-pulumi-state` |
    | `scenarios_ecr_repo_name` | `<event>-scenarios`. Only the optional [chall-manager](../reference/chall-manager.md) uses it, but the field is required |

    Leave `k8s_version` and `node_instance_type` as they are. Save with Ctrl+O and Enter, and quit with Ctrl+X.

## 2. Image registry settings

This one-line command writes the file for you, using the event name from step 1:

```bash
printf 'repo_name = "%s"\n' "$(jq -r .event_name eks/terraform.tfvars.json)" > ecr/terraform.tfvars
```

## 3. config.ini

1. Copy the example. [Make it yours](make-it-yours.md) has already put your values in it:
    ```bash
    cp config.ini.example config.ini
    ```
2. Clear the chall-manager address, which belongs to WH-2026's deleted system. The main deploy doesn't use chall-manager:
    ```bash
    perl -pi -e 's/^api_endpoint = .*/api_endpoint = /' config.ini
    ```
3. Print the settings and read them through:
    ```bash
    grep -v '^#' config.ini
    ```
    Under `[CTFD]`, `url` is `https://ctf.<your-domain>`. Under `[CHALL_MANAGER]`, `domain` is `challenges.<your-domain>`.

## 4. Secrets

The deploy expects the secret to exist and be filled in before it starts, so you create it now. During the deploy, Terraform takes it over.

1. Create an empty secret:
    ```bash
    EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
    aws secretsmanager create-secret --name "$EVENT/config" --secret-string '{}'
    ```
2. Generate random passwords. The command prints five lines; keep the window open, because you'll paste these in the next step:
    ```bash
    echo "db_password       $(openssl rand -hex 24)"
    echo "admin_password    $(openssl rand -base64 18)"
    echo "secret_key        $(openssl rand -hex 32)"
    echo "pulumi_passphrase $(openssl rand -hex 32)"
    echo "ctfd_admin_token  ctfd_$(openssl rand -hex 32)"
    ```
3. Store all the secrets. The script asks for each value in turn. Nothing appears on screen while you paste; that's normal:
    ```bash
    python3 secrets.py bootstrap
    ```

    | Name | What to enter |
    |---|---|
    | `admin_name`, `admin_email` | the scoreboard's admin login, e.g. `admin` and the club email |
    | `admin_password` | the generated value |
    | `ctfd_admin_token`, `ctfd_api_key` | the generated `ctfd_…` value, in both. Scripts use it to log in to CTFd |
    | `db_password` | the generated value. The database password |
    | `secret_key` | the generated value. CTFd uses it to sign login sessions |
    | `pulumi_passphrase` | the generated value. Pulumi uses it to lock its records |
    | `discord_webhook_url`, `discord_alert_webhook_url` | the two webhook addresses from [Discord and GitHub](../accounts/discord-github.md) |
    | `docker_hub_user`, `docker_hub_pass` | optional. A Docker Hub login raises the limit on image downloads. Press Enter to skip |

!!! danger "Never lose or change `pulumi_passphrase`"
    Pulumi uses it to read its own records. Without it, nobody can update or delete what Pulumi built. Secrets Manager keeps it safe. Don't change it while the system is running.

## Check it worked

```bash
python3 secrets.py list | wc -l
git check-ignore config.ini eks/terraform.tfvars.json ecr/terraform.tfvars
```

The first command prints `12`, or `10` if you skipped Docker Hub. The second prints all three file names, which confirms git will never upload them.

## If it fails

| Message | Fix |
|---|---|
| `ResourceExistsException` from `create-secret` | The secret already exists. Go on to step 3 |
| `... scheduled for deletion` | A teardown less than 7 days ago deleted it. Run `aws secretsmanager restore-secret --secret-id "$EVENT/config"` |
| `ResourceNotFoundException` from `secrets.py` | The scripts look for a different secret name. Redo [Make it yours](make-it-yours.md) |

**Next:** [Deploy overview](../deploy/index.md).
