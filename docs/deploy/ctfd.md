# 2. The scoreboard

This stage starts CTFd, the scoreboard, with its database (**MariaDB**) and its fast memory store (**Redis**). `make deploy-ctfd` builds the CTFd image from `~/wh/CTFd`, uploads it to ECR, and runs the Pulumi program in `utils/ctfd/`.

<figure class="diagram">
--8<-- "diagrams/ctfd.svg"
<figcaption>Only MariaDB and the uploads disk keep data across restarts. Redis holds logged-in sessions and cached pages, which CTFd can rebuild.</figcaption>
</figure>

1. Deploy:
    ```bash
    cd ~/wh/wh-2026/utils
    make deploy-ctfd
    ```
    The last lines show `Resources:` with a count of resources created, then `Duration:`, and no line starting with `error:`.
2. Watch the three pods start:
    ```bash
    kubectl get pods -n ctfd -w
    ```
    `-w` keeps watching and prints a new line whenever something changes. When `ctfd`, `mariadb` and `redis` each show `1/1` and `Running`, press Ctrl+C.
3. Wait for the DNS record. ExternalDNS creates it within a few minutes of the Ingress appearing:
    ```bash
    DOMAIN=$(jq -r .domain_name eks/terraform.tfvars.json)
    dig +short "ctf.$DOMAIN"
    ```
    Repeat until it prints one or more IP addresses.

## Finish setup in the browser

The first time CTFd starts, it asks for basic details such as the event name. You answer them once, in a browser.

--8<-- "rec-pending.md"

1. Print the admin login you stored in Secrets Manager:
    ```bash
    python3 secrets.py get admin_name; python3 secrets.py get admin_email; python3 secrets.py get admin_password
    ```
2. Open `https://ctf.<your-domain>`. It sends you to the setup page.
3. **General:** enter the event name, e.g. `Whitehacks 2027`, and a short description.
4. **Mode:** choose **Team Mode**, so players register as teams.
5. **Administration:** enter exactly the name, email and password from step 1.
6. **Style, Date & Time, Integrations:** set the start and end times now, or later under **Admin → Config**. Leave everything else as it is and click **Finish**.
7. Go to **Admin → Config → Theme**, choose **core**, and click **Update**. CTFd 3.8 renamed its themes, and **core** is the current one.

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
