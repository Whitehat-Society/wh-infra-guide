# 3. The challenges

This stage builds every challenge, starts the web and pwn challenges on the cluster, and loads every challenge into CTFd. One command, `make build-images`, does it all.

<figure class="diagram">
--8<-- "diagrams/build-images.svg"
<figcaption><code>builder.py</code> reads each challenge's <code>challenge_type</code>: <code>shared-web</code> and <code>shared-tcp</code> challenges get an image (1) and pods (2); every challenge, including <code>text</code> ones, is loaded into CTFd (3) with the connection details players see.</figcaption>
</figure>

The first run takes longest. Docker keeps parts of each image it builds, its **cache**, so later runs only rebuild what changed.

There is no command for a single challenge: every run handles all of them. That is still quick, because unchanged parts are skipped. Measured on the test deploy:

| Part of the run | Took |
|---|---|
| Building and uploading all 11 images, with the cache | 10 seconds |
| Pulumi, pwn challenges, nothing changed | 4 seconds |
| Pulumi, one web challenge changed | 13 seconds |
| A whole run that changed one challenge | about 1 minute |
| Pulumi when one challenge's pods never start | 10 minutes, then it fails |

A run that seems stuck is almost always the last line: Pulumi waits up to 10 minutes for pods that never become ready. Open a second terminal and run `kubectl get pods -n challenges-tcp; kubectl get pods -n challenges-web` to see which one.

## Run it

1. Log Docker in to ECR, so it may upload images there. The login lasts 12 hours:
    ```bash
    cd ~/wh/wh-2026/utils
    ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    aws ecr get-login-password | docker login --username AWS --password-stdin "$ACCOUNT.dkr.ecr.$(aws configure get region).amazonaws.com"
    ```
    The last line is `Login Succeeded`.
2. Prepare Terraform for the image registry. Run this once; `make build-images` doesn't do it for you:
    ```bash
    terraform -chdir=ecr init
    ```
    It ends with `Terraform has been successfully initialized!`
3. Build and deploy:
    ```bash
    make build-images
    ```
    Near the start, Terraform asks `Do you want to perform these actions?`. Type `yes` and press Enter.
4. While it runs, watch for these two lines. They mean the web and pwn challenges are up:
    - `[shared-web] Pulumi deploy complete.`
    - `[shared-tcp] Pulumi deploy complete.`

!!! note "One error is expected: filelocker"
    `filelocker` gives each team its own copy of the challenge, which needs the optional chall-manager. This deploy leaves chall-manager out, so the builder prints an error for `filelocker` (its image build may also fail first) and moves on to the next challenge. Keep `filelocker` hidden in CTFd, or set it up with the [chall-manager appendix](../reference/chall-manager.md).

## Check it worked

```bash
kubectl get pods -n challenges-web
kubectl get pods -n challenges-tcp
kubectl get svc -n challenges-tcp
curl -s -H "Authorization: Token $(python3 secrets.py get ctfd_admin_token)" -H "Content-Type: application/json" \
  "https://ctf.$(jq -r .domain_name eks/terraform.tfvars.json)/api/v1/challenges?view=admin" | jq ".data | length"
```

What each command should show:

1. **Web challenges:** one `Running` pod per web challenge.
2. **Pwn challenges:** three `Running` pods per pwn challenge. Each pwn challenge runs three copies, and its load balancer spreads players across them.
3. **Pwn load balancers:** each line has an `EXTERNAL-IP` ending in `.elb.<region>.amazonaws.com`. A new load balancer takes about 3 minutes to get one.
4. **CTFd:** the number of challenges loaded into the scoreboard.

In the browser, **Admin → Challenges** lists every challenge. All of them are hidden, so players can't see them yet.

## Showing the challenges on event day

Each `challenge.yml` contains `state: hidden`. When the CTF starts, make them visible:

=== "All at once, from the terminal"

    ```bash
    cd ~/wh/wh-2026
    git grep -l '^state: hidden' -- '*/*/challenge.yml' | grep -v filelocker | xargs perl -pi -e 's/^state: hidden/state: visible/'
    ctf challenge sync
    ```

    The first command changes `hidden` to `visible` in every file except `filelocker`'s. `ctf challenge sync` sends the change to CTFd.

=== "One at a time, in the browser"

    Go to **Admin → Challenges**, open a challenge, set **State** to **Visible**, and click **Update**.

## Changing a challenge later

Edit the files in the challenge's folder, then:

- If you changed only text, flags or attached files: `cd ~/wh/wh-2026 && ctf challenge sync <category>/<challenge-folder>`
- If you changed the challenge's code or Dockerfile: rerun `make build-images`. Unchanged challenges rebuild quickly from the cache. The new image keeps the same name, so Kubernetes keeps running the old copy it already downloaded. Make it download the new one and restart the pods:
    ```bash
    NAME=<name>; NS=challenges-web   # challenges-tcp for a pwn challenge
    kubectl patch deploy "$NAME" -n "$NS" -p "{\"spec\":{\"template\":{\"spec\":{\"containers\":[{\"name\":\"$NAME\",\"imagePullPolicy\":\"Always\"}]}}}}"
    kubectl rollout restart deploy "$NAME" -n "$NS"
    kubectl rollout status deploy "$NAME" -n "$NS"
    ```
    The last line says `successfully rolled out`.

## If it fails

| Message | Fix |
|---|---|
| `Required plugins are not installed` | Step 2 was skipped. Run `terraform -chdir=ecr init`, then `make build-images` again |
| `denied: Your authorization token has expired` | The ECR login expired. Redo step 1 |
| `JSONDecodeError` at the very end | CTFd's setup isn't finished, or `.ctf/config` is wrong. Fix it, then run `cd ~/wh/wh-2026 && ctf challenge install` |
| `passphrase must be set` or `incorrect passphrase` | The `pulumi_passphrase` secret is missing, or WH-2026's old settings file is still there. See step 4 of [Make it yours](../code/make-it-yours.md) |
| `Challenge name must be alphanumeric with hyphens only` | The builder uses each web and pwn challenge's `name:` as the image and pod name, so it may only contain letters, digits and hyphens. Change `name:` in that `challenge.yml`, e.g. `Xoph, Dark Embers` to `xoph-dark-embers`, then rerun `make build-images` |
| `creating failed` for a `Deployment`, then `make: *** [Makefile:29: build-images] Error 1` | One challenge's pods never started, so Pulumi gave up, and the builder stopped before the challenges after it. Find the broken pod with `kubectl get pods -A \| grep -v Running`, fix it as in the rows below, then rerun `make build-images` |
| A pod shows `StartError` or `CrashLoopBackOff`, and `kubectl describe pod` says `executable file not found` | The challenge's Dockerfile starts a program its image doesn't contain. Fix the Dockerfile, e.g. install `socat`. Rerun `make build-images`, then make the pods download the new image as in [Changing a challenge later](#changing-a-challenge-later) |
| A web pod shows `CrashLoopBackOff` | The challenge program keeps crashing. `kubectl logs -n challenges-web deploy/<name>` shows its last output. The cause is usually in the challenge's own code |
| A pwn `EXTERNAL-IP` stays `<pending>` | The load balancer controller couldn't create it. `kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller --tail=50` shows why |

**Next:** [4. Backups and health checks](day2.md).
