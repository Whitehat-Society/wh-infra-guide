# Config files & secrets

<span class="time">⏱ 15 min</span>

Three config files hold settings that are safe to read. Passwords and tokens live in **AWS Secrets Manager**, never in files. All three config files are git-ignored, so they stay on your PC.

| File | Read by |
|---|---|
| `utils/eks/terraform.tfvars.json` | Terraform: cluster, network, DNS, alarms |
| `utils/ecr/terraform.tfvars` | Terraform: the ECR repository for challenge images |
| `utils/config.ini` | Makefile, `builder.py`, helper scripts |
| Secrets Manager `<event>/config` | Everything that needs a password or token |

All commands on this page run in `~/wh/wh-2026/utils`.

## 1. Cluster settings

1. Copy the example:
    ```bash
    cd ~/wh/wh-2026/utils
    cp eks/terraform.tfvars.json.example eks/terraform.tfvars.json
    ```
2. Open it (`nano eks/terraform.tfvars.json`) and fill in:

    | Field | Value |
    |---|---|
    | `event_name` | your event name, e.g. `wh-2027` |
    | `aws_region` | `ap-southeast-1` |
    | `domain_name` | your domain, e.g. `example-ctf.com`. ExternalDNS only manages records under this name |
    | `hosted_zone_id` | the `Z…` ID from [Domain name](../accounts/domain.md#check-it-worked) |
    | `acme_email` | an email Let's Encrypt can warn about expiring certificates |
    | `alarm_notification_emails` | `["you@example.com"]`. Each address gets a confirmation email to click |
    | `node_min_size` / `node_desired_size` / `node_max_size` | `2` / `3` / `6` is enough for ~100 teams |
    | `pulumi_state_bucket` | `<event>-pulumi-state` |
    | `scenarios_ecr_repo_name` | `<event>-scenarios` |

    Leave `k8s_version` and `node_instance_type` as they are.

## 2. Challenge image repository

```bash
printf 'repo_name = "%s"\n' "$(jq -r .event_name eks/terraform.tfvars.json)" > ecr/terraform.tfvars
```

## 3. config.ini

```bash
cp config.ini.example config.ini
```

The [Make it yours](make-it-yours.md) step already put your account, domain and event name in it. Two values need a change:

```bash
perl -pi -e 's/^api_endpoint = .*/api_endpoint = /' config.ini   # chall-manager isn't used; see the appendix
grep -n '' config.ini | grep -v '^[0-9]*:#'
```

Check that `[CTFD] url` is `https://ctf.<your-domain>` and `[CHALL_MANAGER] domain` is `challenges.<your-domain>`.

## 4. Secrets

Terraform expects the secret to have a value before it builds the alarm-to-Discord function. So you create it first, fill it, and `make deploy-eks` imports it into Terraform later.

1. Create the empty secret:
    ```bash
    EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
    aws secretsmanager create-secret --name "$EVENT/config" --secret-string '{}'
    ```
2. Generate the random values now, so you can paste them in step 3:
    ```bash
    echo "db_password       $(openssl rand -hex 24)"
    echo "admin_password    $(openssl rand -base64 18)"
    echo "secret_key        $(openssl rand -hex 32)"
    echo "pulumi_passphrase $(openssl rand -hex 32)"
    echo "ctfd_admin_token  ctfd_$(openssl rand -hex 32)"
    ```
3. Store all 12 values. Input is hidden while you type or paste:
    ```bash
    python3 secrets.py bootstrap
    ```

    | Key | What to enter |
    |---|---|
    | `admin_name`, `admin_email` | the CTFd admin login (e.g. `admin`, the infra email) |
    | `admin_password` | generated above |
    | `ctfd_admin_token`, `ctfd_api_key` | the generated `ctfd_…` value, in both |
    | `db_password`, `secret_key`, `pulumi_passphrase` | generated above |
    | `discord_webhook_url`, `discord_alert_webhook_url` | the two webhooks from [Discord & GitHub](../accounts/discord-github.md) |
    | `docker_hub_user`, `docker_hub_pass` | optional Docker Hub login, to avoid image-pull rate limits. Press Enter to skip |

!!! danger "Don't lose `pulumi_passphrase`"
    Pulumi encrypts its state with it. Without it, nobody can update or delete what Pulumi deployed. It's safe in Secrets Manager. Just don't change it while the stack is running.

## Check it worked

```bash
python3 secrets.py list | wc -l
git check-ignore config.ini eks/terraform.tfvars.json ecr/terraform.tfvars
```

Expected: `12` (or `10` if you skipped Docker Hub), then all three file names. That means git will never commit them.

## If it fails

| Symptom | Fix |
|---|---|
| `ResourceExistsException` on create-secret | It already exists. Skip to step 3 |
| `... scheduled for deletion` | A previous teardown deleted it less than 7 days ago. Run `aws secretsmanager restore-secret --secret-id "$EVENT/config"` |
| `ResourceNotFoundException` from `secrets.py` | The secret name in `secrets_helper.py` doesn't match `event_name`. Redo [Make it yours](make-it-yours.md) |

**Next:** [Deploy overview](../deploy/index.md).
