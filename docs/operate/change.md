# Change a challenge

Find the kind of change you need below. Each section updates every place that holds a copy of the challenge, so that no old version is left behind, and [Where data is kept](data.md) explains what those copies are.

All the commands start in `~/wh/wh-2027/utils`. They assume that you are signed in to AWS and that Docker Desktop is running, and `make build-images` logs Docker in to ECR by itself.

<figure class="diagram">
--8<-- "diagrams/change.svg"
<figcaption>(1) Text, flags, hints and files go to CTFd with <code>ctf challenge sync</code>. (2) Server code goes through <code>make build-images</code>, which pushes a new image and moves the pods onto it. (3) The health check has its own list of challenges, which is copied into the cluster.</figcaption>
</figure>

## Fix text, a flag, a hint or a file

1. Edit `challenge.yml`, or replace the file in the challenge's folder.
2. Send the change to CTFd, for example with `ctf challenge sync web/example-web`:
    ```bash
    cd ~/wh/wh-2027
    ctf challenge sync <category>/<folder>
    cd utils
    ```

`sync` replaces the challenge's description, value, flags, hints and tags in CTFd with the ones in the file. It also uploads each file whose content has changed and deletes any file that is no longer listed under `files:`. Every solve and score is kept.

**Check it worked:** open the challenge as a player in a private browser window, and the change appears after you reload the page.

!!! warning "Changing a flag after players solved it"
    Teams that already solved the challenge keep their solve and points, but anyone who submits the old flag after your change is told it is incorrect. That is what you want if the old flag leaked. If you only fixed a typo, keep the old flag as a second entry under `flags:` so that nobody is penalised.

## Fix the server code of a web or pwn challenge

1. Change the code or the Dockerfile, and test it on your computer as described in [Test it on your computer](../write/server.md#test-it-on-your-computer).
2. Rebuild and redeploy:
    ```bash
    make build-images
    ```
    The command rebuilds every challenge, but Docker reuses its cache for the ones you didn't change, and Pulumi only restarts the challenges whose image changed, so expect it to take about 3 minutes. Each challenge that is already in CTFd prints a red `Found already existing challenge with the same name … Perhaps you meant sync instead of install?`, which is expected and harmless.
3. Watch your challenge's pods being replaced:
    ```bash
    kubectl get pods -n challenges-web     # challenges-tcp for pwn
    ```
    The pods for your challenge now have a new ending to their name and a small `AGE`.

**Check it worked:** the challenge behaves like the new version. If it still behaves like the old one, follow [Old code still running](data.md#old-code-still-running).

!!! danger "A challenge that fails to build is removed"
    If one challenge's image fails to build, the builder leaves that challenge out of the list it gives Pulumi, and Pulumi then deletes the challenge's pods. The run then ends with `FAILED, and left out of this run:` followed by the challenge's folder, so read the last lines before you walk away, and if you see that line, fix the challenge and run the build again straight away.

## Add a challenge

1. Check the writer's folder against the checklist in [Hand it in](../write/submit.md), and then validate every challenge:
    ```bash
    make validate-challenges
    ```
    It should end with `validate_challenges: OK`.
2. Deploy the new challenge:
    ```bash
    make build-images
    ```
    The new challenge is installed in CTFd as hidden.
3. For a web or pwn challenge, give the health check the new list of challenges. The list is read from the `challenge.yml` files, so this takes one command:
    ```bash
    make deploy-healthcheck-cronjob
    ```

**Check it worked:** **Admin → Challenges** lists the challenge, its address answers, and `make run-healthcheck` shows it as `PASS`.

## Hide a challenge during the event

Hiding a challenge takes effect at once and keeps every solve, so prefer it to deleting the challenge.

=== "In the browser"

    **Admin → Challenges →** the challenge **→ State: Hidden → Update**.

=== "From the terminal"

    Set `state: hidden` in its `challenge.yml`, and then run `cd ~/wh/wh-2027 && ctf challenge sync <category>/<folder>`.

The challenge's server keeps running, so players who saved its address can still reach it. To stop the server as well, scale it to zero copies with `kubectl scale deploy/<name> -n challenges-web --replicas=0`. The next `make build-images` starts it again.

## Remove a challenge for good

Removing a challenge deletes its solves, and every team that solved it loses those points.

1. [Take a backup](backups.md#take-a-backup-now).
2. Delete the challenge from CTFd by opening **Admin → Challenges →** the challenge, clicking **Delete** (the bin icon) and confirming. ctfcli can't delete challenges, so this step has to happen in the browser.
3. For a web or pwn challenge, take it off the cluster. Either move its folder out of the category folder, or set `challenge_type: text` in its `challenge.yml`, and then run:
    ```bash
    make build-images
    ```
    Pulumi deletes the challenge's pods and Service, and for a pwn challenge its load balancer too, and ExternalDNS deletes its address within a few minutes. A warning ending in `DependencyViolation: resource sg-… has a dependent object` is harmless, because the load balancer controller tries again and the leftover security group is gone a minute later.
4. Give the health check the new list with `make deploy-healthcheck-cronjob`.
5. If you like, delete the challenge's image as well, which otherwise stays in ECR until teardown:
    ```bash
    aws ecr batch-delete-image --repository-name "$(python3 settings.py event)" --image-ids imageTag=<name>
    ```

**Check it worked:**

```bash
kubectl get deploy -A | grep <name>
```

prints nothing, and `make run-healthcheck` no longer lists the challenge.

## Replace a challenge completely

Use this when a challenge was loaded so wrongly, for example with the wrong `type`, that fixing it in place is harder than starting again. Be aware that it loses the challenge's solves.

1. Do steps 1 and 2 of [Remove a challenge for good](#remove-a-challenge-for-good).
2. Fix the folder.
3. Install it again:
    ```bash
    cd ~/wh/wh-2027
    ctf challenge install <category>/<folder>
    cd utils
    ```
4. For a web or pwn challenge, run `make build-images` so that its address is filled in.

## Rename a challenge

CTFd finds challenges by name, so the name has to change in CTFd first and in the file second.

1. Open **Admin → Challenges →** the challenge, change its **Name**, and click **Update**.
2. Change `name:` in `challenge.yml` to exactly the same text.
3. Run `cd ~/wh/wh-2027 && ctf challenge sync <category>/<folder>`, which should end with `Success! All challenges synced!`. If it says `Could not find existing challenge … Perhaps you meant install instead of sync?` instead, the two names differ, so compare them character by character. Don't run `install` at this point, because it would create a second copy of the challenge.

For a web or pwn challenge, the name is also its address, so renaming it gives it a new address and the old one stops working. A pwn challenge also gets a new load balancer. Run `make build-images`, and then update the health check as in step 3 of [Add a challenge](#add-a-challenge). For these reasons, avoid renaming a web or pwn challenge once players have its address.

## Change many challenges at once

Make all your edits first, and then run:

```bash
make build-images                  # only if any server code changed
cd ~/wh/wh-2027 && ctf challenge sync && cd utils
```

Without a folder name, `ctf challenge sync` syncs every challenge listed in `.ctf/config`.

**Next:** [Collect the results](results.md).
