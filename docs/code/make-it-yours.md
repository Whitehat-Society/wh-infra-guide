# Make it yours

<span class="time">⏱ 10 min</span>

The code still contains WH-2026's values: the old AWS account ID, the domain `whitehats-ctf.com` and the event name `wh-2026`. Those point at an account that no longer exists. This page swaps in your three values in one go.

| Value | Old | Yours |
|---|---|---|
| AWS account ID | the 12-digit number in `utils/config.ini.example` | from `aws sts get-caller-identity` |
| Domain | `whitehats-ctf.com` | the domain from [Domain name](../accounts/domain.md) |
| Event name | `wh-2026` | e.g. `wh-2027`. Lowercase letters, digits and `-` only. Used as a prefix for every AWS resource and S3 bucket |

!!! info "Why the event name matters"
    S3 bucket names are global across all AWS customers. Buckets like `<event>-pulumi-state` and `<event>-ctfd-backups` must not already exist anywhere, so use a fresh event name.

1. Start a branch, so the swap is one reviewable commit:
    ```bash
    cd ~/wh/wh-2026
    NEW_EVENT=wh-2027
    git switch -c "event/$NEW_EVENT"
    ```
2. Set the values:
    ```bash
    OLD_ACCOUNT=$(grep -oE '[0-9]{12}' utils/config.ini.example | head -1)
    NEW_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    NEW_DOMAIN=example-ctf.com
    ```
3. Replace them across the code. Repo URLs (`Whitehat-Society/wh-2026`) are kept, and `docs/` is left alone because it records history:
    ```bash
    files() { git grep -lzIF "$1" -- . ':!docs' ':!*.md' ':!*.txt' ':!*.sql' ; }
    files "$OLD_ACCOUNT"     | xargs -0r perl -pi -e "s/$OLD_ACCOUNT/$NEW_ACCOUNT/g"
    files whitehats-ctf.com | xargs -0r perl -pi -e "s/whitehats-ctf\\.com/$NEW_DOMAIN/g"
    files wh-2026           | xargs -0r perl -pi -e "s#Whitehat-Society/wh-2026#\\@REPO\\@#g; s/wh-2026/$NEW_EVENT/g; s#\\@REPO\\@#Whitehat-Society/wh-2026#g"
    ```
4. Delete the old web-shared stack file. It's encrypted with WH-2026's Pulumi passphrase, which you don't have, and Pulumi recreates it on the first deploy:
    ```bash
    git rm -qf utils/web-shared/Pulumi.wh-2026.yaml
    ```
5. Commit:
    ```bash
    git add -A && git commit -m "chore: retarget infra to $NEW_EVENT"
    ```

## Check it worked

```bash
git grep -nIF -e "$OLD_ACCOUNT" -e whitehats-ctf.com -- utils web pwn ':!*.md' ':!*.txt' | head
git grep -nI 'wh-2026' -- utils ':!*.md' ':!*.txt' | grep -v 'Whitehat-Society/wh-2026' | head
```

Expected: both print nothing.

Then check the files that matter most:

```bash
grep -n 'CTFD_ECR_URI\|BACKUP_BUCKET\|PULUMI_STACK' utils/Makefile
grep -n 'DEFAULT_SECRET_NAME =' utils/secrets_helper.py
grep -n 'ctfImage\|ctf\.' utils/ctfd/main.go | head -3
```

Expected: your account ID, your domain and your event name in every line.

## If it fails

| Symptom | Fix |
|---|---|
| `perl: command not found` | `sudo apt-get install -y perl` |
| Something got replaced that shouldn't have | `git diff` shows every change. Undo one file with `git checkout -- <file>`, or everything with `git checkout -- .` and start again |

**Next:** [Config files & secrets](config.md).
