# Make it yours

The code still contains four values from WH-2026, and they point at an AWS account that no longer exists. This page replaces them with yours across every file at once.

| Value | WH-2026's value | Your value |
|---|---|---|
| AWS account ID | the 12-digit number in `utils/config.ini.example` | the `Account` printed by `aws sts get-caller-identity` |
| Domain | `whitehats-ctf.com` | the domain from [Domain name](../accounts/domain.md) |
| Event name | `wh-2026` | e.g. `wh-2027`. Use only lowercase letters, digits and `-` |
| Region | `ap-southeast-1` (Singapore) | the same, unless your account only allows another region ([how to tell](../accounts/aws.md#which-kind-of-account-you-have)) |

The event name starts the name of almost everything the system creates, such as the cluster `wh-2027-eks` and the bucket `wh-2027-ctfd-backups`. Use a new one each year. S3 bucket names are shared across every AWS customer, and a name may still be held from a previous event.

Before changing anything, you'll start a **branch**: a separate line of changes in git, so the swap can be reviewed and undone as a unit.

1. Start the branch:
    ```bash
    cd ~/wh/wh-2026
    NEW_EVENT=wh-2027
    git switch -c "event/$NEW_EVENT"
    ```
2. Set the old and new values. Replace `example-ctf.com` with your domain:
    ```bash
    OLD_ACCOUNT=$(grep -oE '[0-9]{12}' utils/config.ini.example | head -1)
    NEW_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    NEW_DOMAIN=example-ctf.com
    NEW_REGION=$(aws configure get region)
    ```
3. Replace the values in every file. The commands leave out `docs/` and the Markdown files, which record WH-2026's history, and they keep the repository's own address, `Whitehat-Society/wh-2026`, unchanged:
    ```bash
    files() { git grep -lzIF "$1" -- . ':!docs' ':!*.md' ':!*.txt' ':!*.sql' ; }
    files "$OLD_ACCOUNT"     | xargs -0r perl -pi -e "s/$OLD_ACCOUNT/$NEW_ACCOUNT/g"
    files whitehats-ctf.com | xargs -0r perl -pi -e "s/whitehats-ctf\\.com/$NEW_DOMAIN/g"
    files wh-2026           | xargs -0r perl -pi -e "s#Whitehat-Society/wh-2026#\\@REPO\\@#g; s/wh-2026/$NEW_EVENT/g; s#\\@REPO\\@#Whitehat-Society/wh-2026#g"
    files ap-southeast-1    | xargs -0r perl -pi -e "s/ap-southeast-1/$NEW_REGION/g"
    ```
4. Delete one leftover settings file. It was locked with WH-2026's Pulumi passphrase, which nobody has any more, and Pulumi creates a fresh one during the deploy:
    ```bash
    git rm -qf utils/web-shared/Pulumi.wh-2026.yaml
    ```

## Check it worked

```bash
git grep -nIF -e "$OLD_ACCOUNT" -e whitehats-ctf.com -- utils web pwn ':!*.md' ':!*.txt' | head
git grep -nI 'wh-2026' -- utils ':!*.md' ':!*.txt' | grep -v 'Whitehat-Society/wh-2026' | head
[ "$NEW_REGION" = ap-southeast-1 ] || git grep -nI ap-southeast-1 -- utils web pwn ':!*.md' ':!*.txt' | head
```

All three commands print nothing, which means no old value is left.

Then look at the lines that matter most:

```bash
grep -n 'CTFD_ECR_URI  \|BACKUP_BUCKET  \|PULUMI_STACK ?' utils/Makefile
grep -n 'DEFAULT_SECRET_NAME =' utils/secrets_helper.py
grep -n 'ctfdImage\|ctf\.' utils/ctfd/main.go | head -3
```

Every line shows your account ID, your domain or your event name.

When everything matches, save the change as a **commit**, git's record of one set of changes:

```bash
git add -A && git commit -m "chore: retarget infra to $NEW_EVENT"
```

## If it fails

| Problem | Fix |
|---|---|
| `perl: command not found` | `sudo apt-get install -y perl` |
| Something changed that shouldn't have | Before committing, `git diff` shows every change. `git checkout -- <file>` undoes one file, and `git checkout -- .` undoes everything so you can start again |

**Next:** [Settings and secrets](config.md).
