# 2. The scoreboard

This stage starts CTFd, the scoreboard, with its database (**MariaDB**) and its fast memory store (**Redis**). `make deploy-ctfd` builds the CTFd image from `~/wh/CTFd`, uploads it to ECR, and runs the Pulumi program in `utils/ctfd/`.

<figure class="diagram">
--8<-- "diagrams/ctfd.svg"
<figcaption>Each of MariaDB, Redis and the uploads has its own disk, so all three keep their data across restarts. MariaDB holds teams and solves. Redis holds logins and cached pages; see <a href="../../operate/data/#clear-ctfds-cache">Clear CTFd's cache</a>.</figcaption>
</figure>

1. Give Pulumi the address of the backup job's permissions role. Terraform created the role on the previous page, but the Makefile doesn't pass it on, so you set it once by hand:
    --8<-- "pulumi-env.md"
    ```bash
    pulumi -C ctfd stack select --create "$EVENT"
    pulumi -C ctfd config set backup_irsa_arn "$(terraform -chdir=eks output -raw ctfd_backup_irsa_arn)"
    ```
    Without this, the deploy stops with `missing configuration value 'backup_irsa_arn'`.
2. Deploy:
    ```bash
    make deploy-ctfd
    ```
    The last lines show `Resources:` with a count of resources created, then `Duration:`, and no line starting with `error:`.
3. Watch the three pods start:
    ```bash
    kubectl get pods -n ctfd -w
    ```
    `-w` keeps watching and prints a new line whenever something changes. When `ctfd`, `mariadb` and `redis` each show `1/1` and `Running`, press Ctrl+C.
4. Wait for the DNS record. ExternalDNS creates it within a few minutes of the Ingress appearing:
    ```bash
    DOMAIN=$(jq -r .domain_name eks/terraform.tfvars.json)
    dig +short "ctf.$DOMAIN"
    ```
    Repeat until it prints one or more IP addresses.

    !!! warning "Don't open the address in a browser before this prints an address"
        If you ask for a name before its record exists, your computer and your router remember the answer "doesn't exist" for up to 15 minutes, even after the record appears. If that happened, wait 15 minutes. `ipconfig /flushdns` in Windows PowerShell clears your computer's copy, but not your router's. To skip the router in Chrome, open **Settings → Privacy and security → Security**, and under **Use secure DNS** choose **Google (Public DNS)**.

## Finish setup in the browser

The first time CTFd starts, it asks for basic details such as the event name. You answer them once, in a browser.

<video controls preload="metadata" poster="../../assets/video/deploy/ctfd-setup.jpg" src="../../assets/video/deploy/ctfd-setup.mp4"></video>

1. Print the admin login you stored in Secrets Manager:
    ```bash
    python3 secrets.py get admin_name; python3 secrets.py get admin_email; python3 secrets.py get admin_password
    ```
2. Open `https://ctf.<your-domain>`. It sends you to the setup page.
3. **General:** enter the event name, e.g. `Whitehacks 2027`, and a short description.
4. **Mode:** choose **Team Mode**, so players register as teams.
5. **Settings:** leave the visibility options as they are. Set **Team Size** to the largest team allowed, e.g. `4`.
6. **Administration:** enter exactly the name, email and password from step 1, and untick the newsletter box. CTFd also knows this login from its settings, and both lead to the same admin account.
7. **Style, Date & Time, Integrations:** keep the theme **core**. Set the start and end times now, or later under **Admin → Config**. Click **Finish**.

CTFd opens its home page with your event name, and the top bar shows **Admin Panel**.

## Let the scripts talk to CTFd

ctfcli and `builder.py` read the scoreboard's address and an access token from the file `.ctf/config` at the top of the repo. This block writes it. Git ignores the file, so the token stays on your computer.

```bash
cd ~/wh/wh-2026
mkdir -p .ctf
printf '[config]\nurl = https://ctf.%s\naccess_token = %s\n\n[challenges]\n' \
  "$(jq -r .domain_name utils/eks/terraform.tfvars.json)" \
  "$(python3 utils/secrets.py get ctfd_admin_token)" > .ctf/config
cd utils
```

## Check it worked

```bash
curl -sI "https://ctf.$DOMAIN" | head -1
curl -s -H "Authorization: Token $(python3 secrets.py get ctfd_admin_token)" \
  -H 'Content-Type: application/json' "https://ctf.$DOMAIN/api/v1/users/me" | jq -r .data.name
```

The first command prints `HTTP/2 200` or `HTTP/2 302`, which means CTFd answered. The second prints your admin name, which means the access token works. In the browser, the address bar shows a padlock.

## If it fails

| Message | Fix |
|---|---|
| The `ctfd` pod shows `ImagePullBackOff` | Kubernetes can't download the CTFd image, usually because the upload didn't finish. Run `make build-ctfd`, then `kubectl rollout restart deploy/ctfd -n ctfd` |
| A pod stays `Pending`, and `kubectl get pvc -n ctfd` also shows `Pending` | The disk type is missing. Rerun `make deploy-eks` |
| `Dockerfile not found` during the build | The CTFd folder is missing or in the wrong place. See [Get the code](../code/clone.md) |
| The browser warns about the certificate | Let's Encrypt hasn't issued it yet. Run `kubectl get certificate -n ctfd` until `READY` is `True`, up to 5 minutes |
| The second check prints `null` | Setup isn't finished, or the token stored as `ctfd_admin_token` doesn't start with `ctfd_` |

**Next:** [3. The challenges](challenges.md).
