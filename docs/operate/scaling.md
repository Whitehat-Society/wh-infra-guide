# Adding capacity

When players report slow challenges, the fix is usually more copies of a program or more computers to run them on. This system grows in only one way by itself: it rents another computer when a new pod has nowhere to run. Everything else changes only when you change a number and redeploy.

## What grows by itself, and what doesn't

<div class="wh">
<div class="layers">
  <div class="layer l-auto"><b>DNS and load balancers</b><span>AWS adds capacity to these by itself. There is nothing to set</span><span class="pill p-ok">automatic</span></div>
  <div class="layer l-auto"><b>Rented computers (nodes): 2 to 6</b><span>Added when a new pod can't fit, returned after 10 quiet minutes</span><span class="pill p-ok">automatic</span></div>
  <div class="layer l-man"><b>NGINX: 2 copies</b><span>Change the number in <code>utils/eks/helm.tf</code>, then run Terraform</span><span class="pill p-warn">you change it</span></div>
  <div class="layer l-man"><b>Web challenges: 1 copy each</b><span>Change the number in <code>builder.py</code>, then <code>make build-images</code></span><span class="pill p-warn">you change it</span></div>
  <div class="layer l-man"><b>Pwn challenges: 3 copies each</b><span>Change <code>shared_tcp_replicas</code> in <code>config.ini</code>, then <code>make build-images</code></span><span class="pill p-warn">you change it</span></div>
  <div class="layer l-none"><b>CTFd, MariaDB, Redis: 1 copy each</b><span>Each keeps its data on a disk only one copy can use. You can give them more memory, but not more copies</span><span class="pill p-crit">can't add copies</span></div>
</div>
</div>

Each computer (a `t3.medium`) holds at most 17 pods, whatever their size, and that limit is usually reached before memory or processor. With 15 pwn pods, 5 web pods, CTFd and the cluster's own helpers, the test system ran on 4 computers.

Busy pods alone never trigger a new computer. A new computer is rented only when a new pod can't start. So during a rush, more capacity means you raise a copy count, and the new pods then trigger new computers if they need them.

## How to add capacity

=== "More web challenge copies"

    1. Open `utils/builder/builder.py`. In the part of `build_challenges` that handles `shared-web`, change `'replicas': 1,` to `'replicas': 2,`.
    2. Redeploy:
        ```bash
        cd ~/wh/wh-2026/utils && make build-images
        ```
    3. Check: `kubectl get pods -n challenges-web` shows two pods per challenge.

    !!! warning "Some web challenges break with two copies"
        Each copy keeps its own logins and its own data, so a player can be logged in on one copy and logged out on the other. Read [Many players on one challenge](risks.md#many-players-on-one-challenge) before you add copies of `xssive-login`, `inspectpost` or `pokemon-portal`.

=== "More pwn challenge copies"

    1. In `utils/config.ini`, under `[CHALL_MANAGER]`, set `shared_tcp_replicas` to the number of copies you want, e.g. `5`.
    2. Redeploy:
        ```bash
        cd ~/wh/wh-2026/utils && make build-images
        ```
    3. Check: `kubectl get pods -n challenges-tcp` shows the new number of pods per challenge.

    Extra pwn copies are always safe, because every connection already gets its own run of the program.

=== "More NGINX copies"

    1. In `utils/eks/helm.tf`, find `replicaCount` in the `ingress-nginx` section and raise it.
    2. Apply the change:
        ```bash
        cd ~/wh/wh-2026/utils && terraform -chdir=eks apply -var-file=terraform.tfvars.json
        ```
        Type `yes` when asked.

=== "More computers, right now"

    The cluster adds computers by itself, but each takes 2 to 5 minutes to join. Before an expected rush, such as the start of the event, add them in advance:

    ```bash
    cd ~/wh/wh-2026/utils
    EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
    NG=$(aws eks list-nodegroups --cluster-name "$EVENT-eks" --query 'nodegroups[0]' --output text)
    aws eks update-nodegroup-config --cluster-name "$EVENT-eks" --nodegroup-name "$NG" \
      --scaling-config minSize=4,maxSize=6,desiredSize=4
    ```

    This keeps at least four computers running. Afterwards, set `minSize=2,desiredSize=3` again with the same command, or [delete everything](../teardown.md).

## What happens under load

These diagrams show how the system behaved at WH-2026. Read each one from top to bottom: each arrow is a message from one part to another.

<div class="wh">
<figure class="figure" data-seq="pwnload">
  <h3>40 players connect to one pwn challenge at once</h3>
  <div class="scroll"></div>
  <figcaption>The same happens for every pwn challenge.</figcaption>
</figure>
<figure class="figure" data-seq="webload">
  <h3>Many players on one web challenge</h3>
  <div class="scroll"></div>
  <figcaption>The request limit is the only part that reacts to load. No copies are added.</figcaption>
</figure>
<figure class="figure" data-seq="scaleup">
  <h3>The only way capacity grows: you raise a copy count</h3>
  <div class="scroll"></div>
  <figcaption>Times are the usual AWS and Kubernetes delays, not measurements.</figcaption>
</figure>
</div>
