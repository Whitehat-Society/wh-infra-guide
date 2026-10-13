# 3. The challenges

This stage builds every challenge, starts the web and pwn challenges on the cluster, and loads every challenge into CTFd, all with a single command, `make build-images`.

<figure class="diagram">
--8<-- "diagrams/build-images.svg"
<figcaption><code>builder.py</code> reads each challenge's <code>challenge_type</code>. The <code>shared-web</code> and <code>shared-tcp</code> challenges get an image (1) and pods (2), and every challenge, including the <code>text</code> ones, is loaded into CTFd (3) together with the connection details that players see.</figcaption>
</figure>

The first run takes the longest. Docker keeps the parts of each image it builds in its **cache**, so later runs only rebuild what has changed.

There is no command for deploying a single challenge, because every run handles all of them. A run is still quick, though, since the unchanged parts are skipped. These times were measured on WH-2026's test deploy, with 10 challenges:

| Part of the run | Time |
|---|---|
| Building and uploading all 10 challenge images, with the cache | 10 seconds |
| Pulumi, pwn challenges, nothing changed | 4 seconds |
| Pulumi, one web challenge changed | 13 seconds |
| A whole run that changed one challenge | about 1 minute |
| Pulumi when one challenge's pods never start | 10 minutes, then it fails |

When a run seems stuck, the cause is almost always the situation in the last row, where Pulumi waits up to 10 minutes for pods that never become ready. To see which challenge is the problem, open a second terminal and run `kubectl get pods -n challenges-tcp; kubectl get pods -n challenges-web`.

## Run it

1. Make sure Docker Desktop is running, because the builder uses it to build the images. `docker info --format '{{.ServerVersion}}'` prints a version number when it is.
2. Build and deploy the challenges:
    ```bash
    cd ~/wh/wh-2027/utils
    make build-images
    ```
    The builder logs Docker in to ECR, builds and uploads each image, runs Pulumi for the pwn and then the web challenges, loads every challenge into CTFd, and finally fills in each challenge's address.
3. While it runs, watch for these lines, which mean that each step has finished:
    - `[challenges] Pulumi deploy complete.`
    - `Done: 3 added to CTFd, 0 already there, 1 web and 1 pwn deployed`, with your own numbers once you add challenges. A later run counts the same challenges as `already there`, because the builder only adds challenges that CTFd doesn't have yet.

## Check it worked

```bash
kubectl get pods -n challenges-web
kubectl get pods -n challenges-tcp
kubectl get svc -n challenges-tcp
curl -s -H "Authorization: Token $(python3 secrets.py get ctfd_admin_token)" -H "Content-Type: application/json" \
  "https://ctf.$(jq -r .domain_name eks/terraform.tfvars.json)/api/v1/challenges?view=admin" | jq ".data | length"
```

The first command should show one `Running` pod for each web challenge. The second should show three `Running` pods for each pwn challenge, because each pwn challenge runs three copies and its load balancer spreads players across them.

The third command lists the pwn load balancers, and each line should have an `EXTERNAL-IP` ending in `.elb.<region>.amazonaws.com`. A new load balancer takes about 3 minutes to get one. The last command prints the number of challenges loaded into the scoreboard.

In the browser, **Admin → Challenges** lists every challenge. They are all hidden for now, so players can't see them yet.

## Showing the challenges on event day

Each `challenge.yml` contains `state: hidden`, so when the CTF starts you need to make the challenges visible, either all at once or one at a time.

=== "All at once, from the terminal"

    ```bash
    cd ~/wh/wh-2027
    git grep -l '^state: hidden' -- '*/*/challenge.yml' | grep -v /example- | xargs perl -pi -e 's/^state: hidden/state: visible/'
    ctf challenge sync
    ```

    The first command changes `hidden` to `visible` in every file except the templates', and `ctf challenge sync` sends the change to CTFd.

=== "One at a time, in the browser"

    Go to **Admin → Challenges**, open a challenge, set **State** to **Visible**, and click **Update**.

## Changing a challenge later

Edit the files in the challenge's folder first. If you only changed text, flags or attached files, send the change to CTFd with `cd ~/wh/wh-2027 && ctf challenge sync <category>/<challenge-folder>`. If you changed the challenge's code or Dockerfile, run `make build-images` again, which rebuilds unchanged challenges quickly from the cache and only restarts the ones that changed.

[Change a challenge](../operate/change.md) covers every kind of change, including renaming and removing.

## If it fails

| Message | Fix |
|---|---|
| `Cannot connect to the Docker daemon` | Docker Desktop isn't running, so start it and run `make build-images` again. |
| `JSONDecodeError` from `ctf` | CTFd's setup page isn't finished, so ctfcli got the setup page back instead of an answer. Finish [the setup](ctfd.md#finish-setup-in-the-browser) and run `make build-images` again. |
| `passphrase must be set` or `incorrect passphrase` | The `pulumi_passphrase` secret is missing or was changed. `python3 secrets.py list` shows whether it exists, and [Secrets](../code/config.md) explains why it must never change. |
| `creating failed` for a `Deployment`, then `make: *** [Makefile: … build-images] Error 1` | One challenge's pods never started, so Pulumi gave up and the builder stopped before loading the challenges into CTFd. Find the broken pod with `kubectl get pods -A \| grep -v Running`, fix it as the rows below describe, and run `make build-images` again. |
| A pod shows `StartError` or `CrashLoopBackOff`, and `kubectl describe pod` says `executable file not found` | The challenge's Dockerfile starts a program that its image doesn't contain. Fix the Dockerfile, for example by installing `socat`, and run `make build-images` again. |
| A web pod shows `CrashLoopBackOff` | The challenge program keeps crashing, and `kubectl logs -n challenges-web deploy/<name>` shows its last output. The cause is usually in the challenge's own code. |
| A pwn `EXTERNAL-IP` stays `<pending>` | The load balancer controller couldn't create the load balancer, and `kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller --tail=50` shows why. |

**Next:** [4. Backups and health checks](day2.md).
