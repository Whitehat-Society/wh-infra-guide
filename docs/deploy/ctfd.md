# 2. The scoreboard

This stage starts CTFd, the scoreboard, together with its database, which is called **MariaDB**, and its fast memory store, which is called **Redis**. `make deploy-ctfd` builds the CTFd image from `utils/ctfd/image/`, uploads it to ECR, and then runs the Pulumi program in `utils/ctfd/` with the image pinned to the exact copy it just uploaded.

<figure class="diagram">
--8<-- "diagrams/ctfd.svg"
<figcaption>MariaDB, Redis and the uploaded files each have their own disk, so all three keep their data across restarts. MariaDB holds the teams and solves, and Redis holds logins and cached pages, as <a href="../../operate/data/#clear-ctfds-cache">Clear CTFd's cache</a> explains.</figcaption>
</figure>

1. Make sure Docker Desktop is running, and start the deploy:
    ```bash
    cd ~/wh/wh-2027/utils
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
    DOMAIN=$(python3 settings.py domain)
    NS=$(aws route53 get-hosted-zone --id "$(jq -r .hosted_zone_id eks/terraform.tfvars.json)" --query 'DelegationSet.NameServers[0]' --output text)
    dig +short "ctf.$DOMAIN" @"$NS"
    ```
    Repeat the `dig` command until it prints one or more IP addresses. `@"$NS"` asks Route 53's own name server, which always has the newest records and which nobody's cache sits in front of.

    !!! warning "Don't look the name up any other way until this prints an address"
        If you ask for a name before its record exists, whether in a browser, with `curl`, or with `dig` without the `@`, every resolver on the way remembers the answer "doesn't exist" for up to 15 minutes, even after the record appears. That includes your computer, your router, and public resolvers such as Google's `8.8.8.8`. If that has happened, wait 15 minutes. Running `ipconfig /flushdns` in Windows PowerShell clears your computer's copy of the answer, but not your router's. To make Chrome skip the router, open **Settings → Privacy and security → Security**, and under **Use secure DNS** choose **Google (Public DNS)**.

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
| The `ctfd` pod shows `ImagePullBackOff` | Kubernetes can't download the CTFd image, usually because the upload didn't finish. Run `make deploy-ctfd` again, which uploads the image and points CTFd at it. |
| A pod stays `Pending`, and `kubectl get pvc -n ctfd` also shows `Pending` | The disk type is missing, so run `make deploy-eks` again. |
| `Cannot connect to the Docker daemon` | Docker Desktop isn't running, so start it and run `make deploy-ctfd` again. |
| The `dig` in step 3 still prints nothing after 5 minutes | An earlier event's cluster probably left a record with the same name behind. Run `python3 dns_records.py check`, and if it names an old cluster, remove its records with the `make dns-clean` command it prints. |
| The browser warns about the certificate | Let's Encrypt hasn't issued the certificate yet. Run `kubectl get certificate -n ctfd` every minute or so until `READY` is `True`, which can take up to 5 minutes. |
| The second check prints `null` | Either setup isn't finished, or the token stored as `ctfd_admin_token` doesn't start with `ctfd_`. |

**Next:** [3. The challenges](challenges.md).
