# Settings and secrets

The tools read your event's details from three settings files and its passwords from AWS Secrets Manager, and this page fills in all four. The settings files contain no passwords, and git ignores them, so they never leave your computer.

<figure class="diagram">
--8<-- "diagrams/settings.svg"
<figcaption>The three files stay on your computer. The secret lives in AWS, so every teammate and every program reads the same passwords.</figcaption>
</figure>

Every command on this page runs in the `~/wh/wh-2026/utils` folder.

## 1. Cluster settings

1. Copy the example file:
    ```bash
    cd ~/wh/wh-2026/utils
    cp eks/terraform.tfvars.json.example eks/terraform.tfvars.json
    ```
2. Open the file with `nano eks/terraform.tfvars.json` and fill in each field between the quotes:

    | Field | What to enter |
    |---|---|
    | `event_name` | Your event name, for example `wh-2027`. |
    | `aws_region` | [Make it yours](make-it-yours.md) has already filled this in. |
    | `domain_name` | Your domain, for example `example-ctf.com`. The system only creates DNS records under this name. |
    | `hosted_zone_id` | The ID starting with `Z` from [Domain name](../accounts/domain.md#check-it-worked). |
    | `acme_email` | An email address, which Let's Encrypt writes to if a certificate is about to expire. |
    | `alarm_notification_emails` | The addresses that should receive alarm emails, for example `["you@example.com"]`. |
    | `node_min_size`, `node_desired_size`, `node_max_size` | `2`, `3` and `6`, which are the fewest, the usual and the most rented computers. They are split over three availability zones with at least one in each, so in practice the fewest is 3. This is enough for about 100 teams. |
    | `pulumi_state_bucket` | `<event>-pulumi-state`, for example `wh-2027-pulumi-state`. |
    | `scenarios_ecr_repo_name` | `<event>-scenarios`. Only the optional [chall-manager](../reference/chall-manager.md) uses it, but the field is still required. |

    Leave `k8s_version` as it is. Leave `node_instance_type` as `t3.medium` too, unless your account is a [Free-plan project](../accounts/aws.md#which-kind-of-account-you-have), in which case use `c7i-flex.large`. Save with Ctrl+O and Enter, and quit with Ctrl+X.

## 2. Image registry settings

This one-line command writes the file for you, using the event name you entered in step 1:

```bash
printf 'repo_name = "%s"\n' "$(jq -r .event_name eks/terraform.tfvars.json)" > ecr/terraform.tfvars
```

## 3. config.ini

1. Copy the example file, which [Make it yours](make-it-yours.md) has already filled with your values:
    ```bash
    cp config.ini.example config.ini
    ```
2. Clear the chall-manager address, which belongs to WH-2026's deleted system. The main deploy doesn't use chall-manager, so the field stays empty.
    ```bash
    perl -pi -e 's/^api_endpoint = .*/api_endpoint = /' config.ini
    ```
3. Print the settings and read them through:
    ```bash
    grep -v '^#' config.ini
    ```
    Under `[CTFD]`, `url` should be `https://ctf.<your-domain>`, and under `[CHALL_MANAGER]`, `domain` should be `challenges.<your-domain>`.

## 4. Secrets

The deploy expects the secret to exist and to be filled in before it starts, so you create it now, and Terraform takes it over during the deploy.

1. Create an empty secret:
    ```bash
    EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
    aws secretsmanager create-secret --name "$EVENT/config" --secret-string '{}'
    ```
2. Generate random passwords. The commands print five lines, so keep the window open, because you'll paste these values in the next step.
    ```bash
    echo "db_password       $(openssl rand -hex 24)"
    echo "admin_password    $(openssl rand -base64 18)"
    echo "secret_key        $(openssl rand -hex 32)"
    echo "pulumi_passphrase $(openssl rand -hex 32)"
    echo "ctfd_admin_token  ctfd_$(openssl rand -hex 32)"
    ```
3. Store all the secrets. The script asks for each value in turn, and nothing appears on screen while you paste, which is normal.
    ```bash
    python3 secrets.py bootstrap
    ```

    The questions come in the order shown in this table:

    | Question | What to enter |
    |---|---|
    | `admin_email`, `admin_name` | The scoreboard's admin login, for example the club email and `admin`. |
    | `admin_password` | The generated value. |
    | `ctfd_admin_token`, `ctfd_api_key` | The generated `ctfd_…` value, in both fields. Scripts use it to log in to CTFd. |
    | `db_password` | The generated value, which becomes the database password. |
    | `discord_webhook_url`, `discord_alert_webhook_url` | The two webhook addresses from [Discord and GitHub](../accounts/discord-github.md). |
    | `docker_hub_user`, `docker_hub_pass` | These are optional. A Docker Hub login raises the limit on image downloads, but you can press Enter to skip them. |
    | `pulumi_passphrase` | The generated value, which Pulumi uses to lock its records. |
    | `secret_key` | The generated value, which CTFd uses to sign login sessions. |

    At the end, type `y` to save everything.

!!! danger "Never lose or change `pulumi_passphrase`"
    Pulumi needs the passphrase to read its own records, and without it nobody can update or delete what Pulumi built. Secrets Manager keeps it safe for you, but don't change it while the system is running.

## Check it worked

```bash
python3 secrets.py list | wc -l
git check-ignore config.ini eks/terraform.tfvars.json ecr/terraform.tfvars
```

The first command prints `12`, or `10` if you skipped Docker Hub, which is one line for each secret. The second prints all three file names, which confirms that git will never upload them.

## If it fails

| Message | Fix |
|---|---|
| `ResourceExistsException` from `create-secret` | The secret already exists, so go on to step 3. |
| `... scheduled for deletion` | A teardown less than 7 days ago deleted the secret. Bring it back with `aws secretsmanager restore-secret --secret-id "$EVENT/config"`. |
| `ResourceNotFoundException` from `secrets.py` | The scripts are looking for a different secret name, so redo [Make it yours](make-it-yours.md). |

**Next:** [Deploy overview](../deploy/index.md).
