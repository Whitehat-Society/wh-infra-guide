# 2. Scoreboard (CTFd)

<span class="time">⏱ ~15 min</span>

`make deploy-ctfd` builds the CTFd Docker image from `~/wh/CTFd`, pushes it to ECR, loads the secrets into Pulumi, and runs `pulumi up` on `utils/ctfd/`. That starts CTFd, MariaDB and Redis in the `ctfd` namespace, plus an Ingress for `ctf.<your-domain>`.

1. Deploy:
    ```bash
    cd ~/wh/wh-2026/utils
    make deploy-ctfd
    ```
    Expected at the end: `Resources: ... created` and `Duration: ...`, with no `error:` lines
2. Wait for the pods and the DNS record (~3 min):
    ```bash
    kubectl get pods -n ctfd -w        # Ctrl+C once ctfd, mariadb and redis are all 1/1 Running
    DOMAIN=$(jq -r .domain_name eks/terraform.tfvars.json)
    dig +short "ctf.$DOMAIN"           # repeat until it prints IP addresses
    ```

## Finish setup in the browser

--8<-- "rec-pending.md"

1. Print the admin login stored in Secrets Manager:
    ```bash
    python3 secrets.py get admin_name; python3 secrets.py get admin_email; python3 secrets.py get admin_password
    ```
2. Open `https://ctf.<your-domain>`. It redirects to `/setup`
3. **General:** event name (e.g. `Whitehacks 2027`) and description. **Mode:** **Team Mode**
4. **Administration:** use exactly the name, email and password from step 1
5. **Style / Date & Time / Integrations:** set the start and end time now, or later in **Admin → Config**. Leave the rest as is → **Finish**
6. **Admin → Config → Theme** → choose **core** → **Update**

## Let the CLI talk to CTFd

`ctfcli` and `builder.py` read `.ctf/config` in the repo root. It's git-ignored.

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

Expected: `HTTP/2 200` (or `302`), then your admin name. The browser shows a padlock, which means the Let's Encrypt certificate works.

## If it fails

| Symptom | Fix |
|---|---|
| `ImagePullBackOff` on the ctfd pod | The image push didn't finish. Run `make build-ctfd`, then `kubectl rollout restart deploy/ctfd -n ctfd` |
| PVC stuck `Pending` | The `gp3` StorageClass is missing. Rerun `make deploy-eks` (it's in `eks/storage.tf`) |
| `docker build` fails: `Dockerfile not found` | `~/wh/CTFd` is missing or in the wrong place. See [Get the code](../code/clone.md) |
| Browser shows a certificate warning | cert-manager is still issuing. `kubectl get certificate -n ctfd`; wait until `READY True` (≤ 5 min) |
| API call prints `null` | The setup wizard isn't finished, or `ctfd_admin_token` doesn't start with `ctfd_` |

**Next:** [3. Challenges](challenges.md).
