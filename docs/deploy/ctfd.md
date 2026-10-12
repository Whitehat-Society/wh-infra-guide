# 2. The scoreboard

This stage starts CTFd, the scoreboard, together with its database, which is called **MariaDB**, and its fast memory store, which is called **Redis**. `make deploy-ctfd` builds the CTFd image from `~/wh/CTFd`, uploads it to ECR, and then runs the Pulumi program in `utils/ctfd/`.

<figure class="diagram">
--8<-- "diagrams/ctfd.svg"
<figcaption>MariaDB, Redis and the uploaded files each have their own disk, so all three keep their data across restarts. MariaDB holds the teams and solves, and Redis holds logins and cached pages, as <a href="../../operate/data/#clear-ctfds-cache">Clear CTFd's cache</a> explains.</figcaption>
</figure>

1. Start the deploy:
    ```bash
    make deploy-ctfd
    ```
    The last lines show `Resources:` with the number of resources created, followed by `Duration:`, and there should be no line starting with `error:`.
2. Watch the three pods start:
    ```bash
    kubectl get pods -n ctfd -w
    ```
    The `-w` option keeps watching and prints a new line whenever something changes. When `ctfd`, `mariadb` and `redis` each show `1/1` and `Running`, press Ctrl+C.
3. Wait for the DNS record, which ExternalDNS creates within a few minutes of the Ingress appearing:
    ```bash
    DOMAIN=$(jq -r .domain_name eks/terraform.tfvars.json)
    dig +short "ctf.$DOMAIN"
    ```
    Repeat the `dig` command until it prints one or more IP addresses.

    !!! warning "Don't open the address in a browser before this prints an address"
        If you ask for a name before its record exists, your computer and your router remember the answer "doesn't exist" for up to 15 minutes, even after the record appears. If that has happened, wait 15 minutes. Running `ipconfig /flushdns` in Windows PowerShell clears your computer's copy of the answer, but not your router's. To make Chrome skip the router, open **Settings → Privacy and security → Security**, and under **Use secure DNS** choose **Google (Public DNS)**.

## Finish setup in the browser

The first time CTFd starts, it asks for some basic details such as the event name. You only answer them once, in a browser.

<video controls preload="metadata" poster="../../assets/video/deploy/ctfd-setup.jpg" src="../../assets/video/deploy/ctfd-setup.mp4"></video>

1. Print the admin login you stored in Secrets Manager:
    ```bash
    python3 secrets.py get admin_name; python3 secrets.py get admin_email; python3 secrets.py get admin_password
    ```
2. Open `https://ctf.<your-domain>`, which takes you to the setup page.
3. On the **General** tab, enter the event name, for example `Whitehacks 2027`, and a short description.
4. On the **Mode** tab, choose **Team Mode** so that players register as teams.
5. On the **Settings** tab, leave the visibility options as they are and set **Team Size** to the largest team allowed, for example `4`.
6. On the **Administration** tab, enter exactly the name, email and password from step 1, and untick the newsletter box. CTFd also knows this login from its settings, and both lead to the same admin account.
7. On the **Style**, **Date & Time** and **Integrations** tabs, keep the theme **core**. You can set the start and end times now, or later under **Admin → Config**. Then click **Finish**.

CTFd now opens its home page with your event name, and the top bar shows **Admin Panel**.

## Let the scripts talk to CTFd

ctfcli and `builder.py` read the scoreboard's address and an access token from the file `.ctf/config` at the top of the repository, and the commands below write that file. Git ignores it, so the token stays on your computer.

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

The first command prints `HTTP/2 200` or `HTTP/2 302`, which means that CTFd answered, and the second prints your admin name, which means that the access token works. In the browser, the address bar should also show a padlock.

## If it fails

| Message | Fix |
|---|---|
| The `ctfd` pod shows `ImagePullBackOff` | Kubernetes can't download the CTFd image, usually because the upload didn't finish. Run `make build-ctfd` and then `kubectl rollout restart deploy/ctfd -n ctfd`. |
| A pod stays `Pending`, and `kubectl get pvc -n ctfd` also shows `Pending` | The disk type is missing, so run `make deploy-eks` again. |
| `Dockerfile not found` during the build | The CTFd folder is missing or in the wrong place, as described in [Get the code](../code/clone.md). |
| The browser warns about the certificate | Let's Encrypt hasn't issued the certificate yet. Run `kubectl get certificate -n ctfd` every minute or so until `READY` is `True`, which can take up to 5 minutes. |
| The second check prints `null` | Either setup isn't finished, or the token stored as `ctfd_admin_token` doesn't start with `ctfd_`. |

**Next:** [3. The challenges](challenges.md).
