# Change a challenge

Pick the change you need. Each one lists every place that holds a copy, so that no old version is left behind. [Where data is kept](data.md) explains the copies.

All commands start in `~/wh/wh-2026/utils`, signed in, with Docker logged in to ECR (step 1 of [The challenges](../deploy/challenges.md)).

<figure class="diagram">
--8<-- "diagrams/change.svg"
<figcaption>(1) Text, flags, hints and files go to CTFd with <code>ctf challenge sync</code>. (2) Server code goes through <code>make build-images</code>, which pushes a new image and moves the pods to it. (3) The health check has its own list of challenges, copied into the cluster.</figcaption>
</figure>

## Fix text, a flag, a hint or a file

1. Edit `challenge.yml`, or replace the file in the challenge's folder.
2. Send the change to CTFd:
    ```bash
    cd ~/wh/wh-2026
    ctf challenge sync <category>/<folder>
    cd utils
    ```
    For example `ctf challenge sync web/inspectpost`.

What `sync` does in CTFd:

- replaces the description, value, flags, hints and tags with the ones in the file
- re-uploads each file whose content changed, and deletes files no longer listed under `files:`
- keeps every solve and score

**Check it worked:** open the challenge as a player in a private browser window. The change shows after a page reload.

!!! warning "Changing a flag after players solved it"
    Teams that solved it keep their solve and points. Teams who submitted the old flag after your change get "incorrect". If the old flag leaked, that is what you want; if you only fixed a typo, keep the old flag as a second entry under `flags:`.

## Fix the server code of a web or pwn challenge

1. Change the code or the Dockerfile, and test it on your computer as in [Test it on your computer](../write/server.md#test-it-on-your-computer).
2. Rebuild and redeploy:
    ```bash
    make build-images
    ```
    It rebuilds every challenge, but Docker reuses its cache for those you didn't change, and Pulumi restarts only the challenges whose image changed. Expect about 3 minutes. Each challenge already in CTFd prints a red `Found already existing challenge with the same name … Perhaps you meant sync instead of install?`; that is expected, and harmless.
3. Watch your challenge's pods being replaced:
    ```bash
    kubectl get pods -n challenges-web     # challenges-tcp for pwn
    ```
    The pods for your challenge have a new name ending and a small `AGE`.

**Check it worked:** the challenge behaves like the new version. If it still behaves like the old one, follow [Old code still running](data.md#old-code-still-running).

!!! danger "A challenge that fails to build is removed"
    If one challenge's image fails to build, the builder leaves it out of the list it gives Pulumi, and Pulumi deletes that challenge's pods. Read the output for `Error` lines before you walk away, and fix and rerun at once.

## Add a challenge

1. Check the writer's folder against [Hand it in](../write/submit.md). Then validate every challenge:
    ```bash
    make validate-challenges
    ```
    It ends with `validate_challenges: OK`.
2. Deploy:
    ```bash
    make build-images
    ```
    A new challenge is installed in CTFd as hidden.
3. For a web or pwn challenge, add it to the health check. In `utils/healthcheck.py`, add the name, as it appears in its address, to `WEB_CHALLENGES`, or add `"<name>": <port>` to `SHARED_TCP_CHALLENGES`. For a pwn challenge, also redo step 2 of [Health checks](../deploy/day2.md#health-checks), adding the name to the `for` line. Then copy the new list into the cluster:
    ```bash
    make deploy-healthcheck-cronjob
    ```

**Check it worked:** **Admin → Challenges** lists it; its address answers; `make run-healthcheck` shows it as `PASS`.

## Hide a challenge during the event

Hiding is instant and keeps every solve. Prefer it over deleting.

=== "In the browser"

    **Admin → Challenges →** the challenge **→ State: Hidden → Update**.

=== "From the terminal"

    Set `state: hidden` in its `challenge.yml`, then `cd ~/wh/wh-2026 && ctf challenge sync <category>/<folder>`.

The server keeps running, so players who saved the address can still reach it. To stop it too, scale it to zero copies: `kubectl scale deploy/<name> -n challenges-web --replicas=0`. The next `make build-images` starts it again.

## Remove a challenge for good

Removing deletes its solves, and every team that solved it loses those points.

1. [Take a backup](backups.md#take-a-backup-now).
2. Delete it from CTFd: **Admin → Challenges →** the challenge **→ Delete** (the bin icon), and confirm. ctfcli can't delete challenges.
3. For a web or pwn challenge, take it off the cluster. Move its folder out of the category folder, or set `challenge_type: text` in its `challenge.yml`, then:
    ```bash
    make build-images
    ```
    Pulumi deletes its pods and Service, and for pwn its load balancer. ExternalDNS deletes its address within a few minutes.
4. Remove it from `utils/healthcheck.py` and from the `for` line in step 2 of [Health checks](../deploy/day2.md#health-checks), then `make deploy-healthcheck-cronjob`.
5. Optional: delete its image, which otherwise stays in ECR until teardown:
    ```bash
    aws ecr batch-delete-image --repository-name "$(jq -r .event_name eks/terraform.tfvars.json)" --image-ids imageTag=<name>
    ```

**Check it worked:**

```bash
kubectl get deploy -A | grep <name>
```

prints nothing, and `make run-healthcheck` doesn't list it.

## Replace a challenge completely

Use this when a challenge was loaded so wrongly that fixing it in place is harder than starting again, e.g. the wrong `type`. It loses the challenge's solves.

1. Do steps 1 and 2 of [Remove a challenge for good](#remove-a-challenge-for-good).
2. Fix the folder.
3. Install it again:
    ```bash
    cd ~/wh/wh-2026
    ctf challenge install <category>/<folder>
    cd utils
    ```
4. For a web or pwn challenge, run `make build-images` so its address is filled in.

## Rename a challenge

CTFd finds challenges by name, so the name must change in CTFd first:

1. **Admin → Challenges →** the challenge **→** change **Name → Update**.
2. Change `name:` in `challenge.yml` to exactly the same text.
3. Check: `cd ~/wh/wh-2026 && ctf challenge sync <category>/<folder>` ends with `Success! All challenges synced!`. `Could not find existing challenge … Perhaps you meant install instead of sync?` means the two names differ; compare them character by character. Don't run `install` here, which would create a second copy.

For a web or pwn challenge, the name is also its address. Renaming gives it a new address, and the old one stops working; for pwn it also gets a new load balancer. Run `make build-images`, then update the health check as in step 3 of [Add a challenge](#add-a-challenge). Avoid renaming a web or pwn challenge once players have the address.

## Change many challenges at once

Make all the edits, then:

```bash
make build-images                  # only if any server code changed
cd ~/wh/wh-2026 && ctf challenge sync && cd utils
```

`ctf challenge sync` without a folder syncs every challenge listed in `.ctf/config`.

**Next:** [Collect the results](results.md).
