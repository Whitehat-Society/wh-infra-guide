# Your settings

Everything that makes a deploy yours is in one file, `utils/eks/terraform.tfvars.json`. It arrives with `CHANGE-ME` in the fields you have to fill in, and every command refuses to run until none is left. The other names the system needs, such as the cluster's, the buckets' and the image registry's, are all worked out from this file by `utils/settings.py`, so you never type them anywhere else.

## 1. Fill in the file

1. Find your hosted zone's ID, which starts with `Z`. You'll paste it into the file in the next step.
    ```bash
    aws route53 list-hosted-zones --query 'HostedZones[].[Name,Id]' --output text
    ```
2. Open the file:
    ```bash
    cd ~/wh/wh-2027/utils
    nano eks/terraform.tfvars.json
    ```
3. Fill in each field between the quotes:

    | Field | What to enter |
    |---|---|
    | `event_name` | Your event's name, such as `wh-2027`, using lowercase letters, digits and hyphens. It begins the name of almost everything the system creates, such as the cluster `wh-2027-eks` and the bucket `wh-2027-ctfd-backups`. |
    | `aws_region` | Leave it as `ap-southeast-1` (Singapore), unless your account only allows another region ([how to tell](../accounts/aws.md#which-kind-of-account-you-have)). |
    | `domain_name` | Your domain, such as `example-ctf.com`. The system only creates DNS records under this name. |
    | `hosted_zone_id` | The ID from step 1, without the `/hostedzone/` in front of it. |
    | `acme_email` | An email address, which Let's Encrypt writes to if a certificate is about to expire. |
    | `alarm_notification_emails` | The addresses that should receive alarm emails, such as `["you@example.com"]`. Write `[]` for none, because the alarms also reach Discord. |
    | `node_min_size`, `node_desired_size`, `node_max_size` | Leave them at `2`, `3` and `6`, which are the fewest, the usual and the most rented computers. They are split over three availability zones with at least one in each, so in practice the fewest is 3. This is enough for about 100 teams. |

    Leave `k8s_version` as it is. Leave `node_instance_type` as `t3.medium` too, unless your account is a [Free-plan project](../accounts/aws.md#which-kind-of-account-you-have), in which case use `c7i-flex.large`. Save with Ctrl+O and Enter, and quit with Ctrl+X.

Pick a new event name each year. S3 bucket names are shared by every AWS customer, and a name from an earlier event may still be taken.

## 2. Keep the file on your computer

`wh-base` includes the settings file so that a fresh copy has every file it needs, but your filled-in copy holds your email addresses and IDs, so stop git from uploading it. The top of `.gitignore`, the file that lists what git leaves out, has the line ready.

1. Open `.gitignore` with `nano ../.gitignore`, delete the `# ` in front of `# utils/eks/terraform.tfvars.json`, and save.
2. Tell git to stop tracking the file, while keeping it on your computer, and save the change:
    ```bash
    git rm --cached eks/terraform.tfvars.json
    git commit -am "chore: keep the event settings out of git"
    ```

Teammates who deploy from another computer need the same file. Send it to them directly, for example in a private message, rather than through GitHub.

## Check it worked

```bash
make settings
git check-ignore eks/terraform.tfvars.json
```

`make settings` prints every name the deploy will use, starting with `event` and ending with the two image registries, and each one should contain your event's name, region or domain. `git check-ignore` prints the file's name, which confirms that git will never upload it.

## The other settings file

`utils/config.ini` holds the settings about the challenges rather than the cloud: which top-level folders hold challenges, and how many copies of each web and pwn challenge run. Its values suit most events, so you only change it when you add a category or during the event, as [Adding capacity](../operate/scaling.md) describes. It contains nothing private, so it stays in git.

## If it fails

| Message | Fix |
|---|---|
| `fill in … first (they still say CHANGE-ME)` | The message names the fields you missed, so open the file again and fill them in. |
| `json.decoder.JSONDecodeError: … line 5 column 3` | The file is no longer valid JSON, usually because a quote or a comma went missing near the line given. Every field's line ends with a comma except the last one, `node_desired_size`, so check the line given and the one above it. |
| `Unable to locate credentials` from `make settings` | Your terminal isn't signed in to AWS, so [sign in again](../accounts/cli-login.md#signing-in-again). |
| `git rm` says `did not match any files` | You already ran it once, so nothing more is needed. |

**Next:** [Secrets](config.md).
