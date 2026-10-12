# 3. Challenges

<span class="time">⏱ ~20 min, longer on the first run (no Docker cache)</span>

`make build-images` does everything for the challenges in one go:

1. `terraform apply` in `utils/ecr/` creates the ECR repository for challenge images, and writes its URI into `config.ini`
2. `builder.py` reads every `challenge.yml` and sorts challenges by `challenge_type`:
    - `shared-web`: build, push to ECR, then one Pulumi run deploys all web challenges (`utils/web-shared`)
    - `shared-tcp`: build, push, then one Pulumi run deploys all pwn challenges, each with its own load balancer (`utils/shared-tcp`)
    - `text`: nothing to build
3. `ctf challenge install` loads every challenge, its files and flags into CTFd
4. It writes each challenge's URL or `nc` command into CTFd's `connection_info`

## Run it

1. Log Docker in to ECR. The login lasts 12 hours:
    ```bash
    cd ~/wh/wh-2026/utils
    ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    aws ecr get-login-password | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.ap-southeast-1.amazonaws.com"
    ```
    Expected: `Login Succeeded`
2. Build and deploy:
    ```bash
    make build-images
    ```
    Terraform stops once to ask `Do you want to perform these actions?`. Type `yes`.
3. While it runs, look for these lines:
    - `[shared-web] Pulumi deploy complete.`
    - `[shared-tcp] Pulumi deploy complete.`

!!! note "Expected error: filelocker"
    `filelocker` is the one challenge that needs per-player instances (`challenge_type: chall-manager`). The event-day stack doesn't run chall-manager, so its build step prints an error, and the builder moves on to the next challenge. Leave it hidden in CTFd, or follow the [chall-manager appendix](../reference/chall-manager.md).

## Check it worked

```bash
kubectl get pods -n challenges-web
kubectl get pods -n challenges-tcp
kubectl get svc -n challenges-tcp
curl -s -H "Authorization: Token $(python3 secrets.py get ctfd_admin_token)" -H "Content-Type: application/json" \
  "https://ctf.$(jq -r .domain_name eks/terraform.tfvars.json)/api/v1/challenges?view=admin" | jq ".data | length"
```

Expected: 1 `Running` pod per web challenge and 3 per pwn challenge. The last command prints the number of challenges in CTFd. Each pwn Service has an `EXTERNAL-IP` ending in `.elb.ap-southeast-1.amazonaws.com`. Load balancers take ~3 min to get one.

In the browser, **Admin → Challenges** lists every challenge. They're all hidden, so players can't see them yet.

## Showing challenges on event day

Every `challenge.yml` has `state: hidden`. When the CTF starts:

=== "All at once (CLI)"

    ```bash
    cd ~/wh/wh-2026
    git grep -l '^state: hidden' -- '*/*/challenge.yml' | grep -v filelocker | xargs perl -pi -e 's/^state: hidden/state: visible/'
    ctf challenge sync
    ```

=== "One by one (browser)"

    **Admin → Challenges →** a challenge **→ State: Visible → Update**.

## Changing a challenge later

Edit its folder, then:

- Only text, flags or files changed: `cd ~/wh/wh-2026 && ctf challenge sync <folder>`
- Code or Dockerfile changed: rerun `make build-images`. Unchanged images build from cache

## If it fails

| Symptom | Fix |
|---|---|
| `denied: Your authorization token has expired` | Redo step 1 |
| `JSONDecodeError` at the very end | The CTFd setup wizard isn't finished, or `.ctf/config` is wrong. Fix that, then `cd ~/wh/wh-2026 && ctf challenge install` |
| `error: passphrase must be set` / `incorrect passphrase` | The `pulumi_passphrase` secret is missing, or an old `Pulumi.<stack>.yaml` is still there. See [Make it yours](../code/make-it-yours.md) step 4 |
| Web pod `CrashLoopBackOff` | `kubectl logs -n challenges-web deploy/<name>`. It's usually the challenge's own code, not the infrastructure |
| pwn `EXTERNAL-IP` stays `<pending>` | `kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller --tail=50` |

**Next:** [4. Backups & health checks](day2.md).
