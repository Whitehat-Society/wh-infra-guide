# Make it yours

The code still contains four values from WH-2026, and they point at an AWS account that no longer exists. This page replaces all four with your own values, across every file at once.

| Value | WH-2026's value | Your value |
|---|---|---|
| AWS account ID | The 12-digit number in `utils/config.ini.example` | The `Account` that `aws sts get-caller-identity` prints |
| Domain | `whitehats-ctf.com` | The domain from [Domain name](../accounts/domain.md) |
| Event name | `wh-2026` | A new name such as `wh-2027`, made of lowercase letters, digits and hyphens |
| Region | `ap-southeast-1` (Singapore) | The same region, unless your account only allows another one ([how to tell](../accounts/aws.md#which-kind-of-account-you-have)) |

The event name begins the name of almost everything the system creates, such as the cluster `wh-2027-eks` and the bucket `wh-2027-ctfd-backups`. Pick a new one each year, because S3 bucket names are shared by every AWS customer and an old name may still be taken from a previous event.

Before you change anything, start a **branch**, which is a separate line of changes in git. Working on a branch means the whole swap can be reviewed, and undone if necessary, as one unit.

1. Start the branch:
    ```bash
    cd ~/wh/wh-2026
    NEW_EVENT=wh-2027
    git switch -c "event/$NEW_EVENT"
    ```
2. Set the old and new values, replacing `example-ctf.com` with your domain:
    ```bash
    OLD_ACCOUNT=$(grep -oE '[0-9]{12}' utils/config.ini.example | head -1)
    NEW_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    NEW_DOMAIN=example-ctf.com
    NEW_REGION=$(aws configure get region)
    ```
3. Replace the values in every file. The commands leave out `docs/` and the Markdown files, because those record WH-2026's history, and they also leave the repository's own address, `Whitehat-Society/wh-2026`, unchanged.
    ```bash
    files() { git grep -lzIF "$1" -- . ':!docs' ':!*.md' ':!*.txt' ':!*.sql' ; }
    files "$OLD_ACCOUNT"     | xargs -0r perl -pi -e "s/$OLD_ACCOUNT/$NEW_ACCOUNT/g"
    files whitehats-ctf.com | xargs -0r perl -pi -e "s/whitehats-ctf\\.com/$NEW_DOMAIN/g"
    files wh-2026           | xargs -0r perl -pi -e "s#Whitehat-Society/wh-2026#\\@REPO\\@#g; s/wh-2026/$NEW_EVENT/g; s#\\@REPO\\@#Whitehat-Society/wh-2026#g"
    files ap-southeast-1    | xargs -0r perl -pi -e "s/ap-southeast-1/$NEW_REGION/g"
    ```
4. Delete one leftover settings file. It was locked with WH-2026's Pulumi passphrase, which nobody has any more, and Pulumi creates a fresh copy during the deploy anyway.
    ```bash
    git rm -qf utils/web-shared/Pulumi.wh-2026.yaml
    ```

## Check it worked

```bash
git grep -nIF -e "$OLD_ACCOUNT" -e whitehats-ctf.com -- utils web pwn ':!*.md' ':!*.txt' | head
git grep -nI 'wh-2026' -- utils ':!*.md' ':!*.txt' | grep -v 'Whitehat-Society/wh-2026' | head
[ "$NEW_REGION" = ap-southeast-1 ] || git grep -nI ap-southeast-1 -- utils web pwn ':!*.md' ':!*.txt' | head
```

If all three commands print nothing, no old value is left. Next, look at the lines that matter most:

```bash
grep -n 'CTFD_ECR_URI  \|BACKUP_BUCKET  \|PULUMI_STACK ?' utils/Makefile
grep -n 'DEFAULT_SECRET_NAME =' utils/secrets_helper.py
grep -n 'ctfdImage\|ctf\.' utils/ctfd/main.go | head -3
```

Every line should show your account ID, your domain or your event name. When everything matches, save the change as a **commit**, which is git's record of one set of changes:

```bash
git add -A && git commit -m "chore: retarget infra to $NEW_EVENT"
```

## If it fails

| Problem | Fix |
|---|---|
| `perl: command not found` | Install it with `sudo apt-get install -y perl`. |
| Something changed that shouldn't have | Before you commit, `git diff` shows every change. `git checkout -- <file>` undoes the changes to one file, and `git checkout -- .` undoes everything so that you can start again. |

**Next:** [Settings and secrets](config.md).
