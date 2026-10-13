# Adding capacity

When players report slow challenges, the fix is usually more copies of a program, or more computers to run them on. This system only grows by itself in one way, which is by renting another computer when a new pod has nowhere to run. Everything else changes only when you change a number and redeploy.

## What grows by itself, and what doesn't

<div class="wh">
<div class="layers">
  <div class="layer l-auto"><b>DNS and load balancers</b><span>AWS adds capacity to these by itself, so there is nothing to set</span><span class="pill p-ok">automatic</span></div>
  <div class="layer l-auto"><b>Rented computers (nodes): 3 to 6</b><span>One or two in each of three zones. A computer is added when a new pod can't fit, and returned after 10 quiet minutes</span><span class="pill p-ok">automatic</span></div>
  <div class="layer l-man"><b>NGINX: 2 copies</b><span>Change the number in <code>utils/eks/helm.tf</code> and run Terraform</span><span class="pill p-warn">you change it</span></div>
  <div class="layer l-man"><b>Web challenges: 1 copy each</b><span>Change <code>shared_web_replicas</code> in <code>config.ini</code> and run <code>make build-images</code></span><span class="pill p-warn">you change it</span></div>
  <div class="layer l-man"><b>Pwn challenges: 3 copies each</b><span>Change <code>shared_tcp_replicas</code> in <code>config.ini</code> and run <code>make build-images</code></span><span class="pill p-warn">you change it</span></div>
  <div class="layer l-none"><b>CTFd, MariaDB, Redis: 1 copy each</b><span>Each keeps its data on a disk that only one copy can use, so you can give them more memory but not more copies</span><span class="pill p-crit">can't add copies</span></div>
</div>
</div>

Each computer, a `t3.medium`, holds at most 17 pods whatever their size, and that limit is usually reached before the memory or processor runs out. With 15 pwn pods, 5 web pods, CTFd and the cluster's own helpers, the test system ran on 4 computers.

Busy pods on their own never trigger a new computer, because a computer is only rented when a new pod can't start. During a rush, then, adding capacity means raising a copy count yourself, and the new pods will trigger new computers if they need them.

## How to add capacity

=== "More web challenge copies"

    1. In `utils/config.ini`, under `[CHALLENGES]`, set `shared_web_replicas` to `2`.
    2. Deploy the change:
        ```bash
        cd ~/wh/wh-2027/utils && make build-images
        ```
    3. Check that `kubectl get pods -n challenges-web` now shows two pods for each challenge.

    !!! warning "Some web challenges break with two copies"
        Each copy keeps its own logins and its own data, so a player can be logged in on one copy and logged out on the other. Read [Many players on one challenge](risks.md#many-players-on-one-challenge) before you add copies, and check each challenge's README, where its writer says whether it can run as several copies. The setting applies to every web challenge at once.

=== "More pwn challenge copies"

    1. In `utils/config.ini`, under `[CHALLENGES]`, set `shared_tcp_replicas` to the number of copies you want, for example `5`.
    2. Deploy the change:
        ```bash
        cd ~/wh/wh-2027/utils && make build-images
        ```
    3. Check that `kubectl get pods -n challenges-tcp` shows the new number of pods for each challenge.

    Extra pwn copies are always safe, because every connection already gets its own run of the program.

=== "More NGINX copies"

    1. In `utils/eks/helm.tf`, find `replicaCount` in the `ingress-nginx` section and raise it.
    2. Apply the change, and type `yes` when Terraform asks:
        ```bash
        cd ~/wh/wh-2027/utils && terraform -chdir=eks apply -var-file=terraform.tfvars.json
        ```

=== "More computers, right now"

    The cluster adds computers by itself, but each one takes 2 to 5 minutes to join. Before a rush you can predict, such as the start of the event, add them in advance:

    ```bash
    cd ~/wh/wh-2027/utils
    EVENT=$(python3 settings.py event)
    for NG in $(aws eks list-nodegroups --cluster-name "$EVENT-eks" --query 'nodegroups[]' --output text); do
      aws eks update-nodegroup-config --cluster-name "$EVENT-eks" --nodegroup-name "$NG" \
        --scaling-config minSize=2,maxSize=2,desiredSize=2 --query 'update.status' --output text
    done
    ```

    There is one group of computers in each availability zone, so this keeps two computers in each zone, six in all, and it prints `InProgress` once for each group. When the rush is over, run it again with `minSize=1,maxSize=2,desiredSize=1`, or [delete everything](../teardown.md) if the event has ended.

## What happens under load

These diagrams show how the system behaved at WH-2026. Read each one from top to bottom, where every arrow is a message from one part of the system to another.

<div class="wh">
<figure class="figure" data-seq="pwnload">
  <h3>40 players connect to one pwn challenge at once</h3>
  <div class="scroll"></div>
  <figcaption>The same happens for every pwn challenge.</figcaption>
</figure>
<figure class="figure" data-seq="webload">
  <h3>Many players on one web challenge</h3>
  <div class="scroll"></div>
  <figcaption>The request limit is the only part that reacts to load, and no copies are added.</figcaption>
</figure>
<figure class="figure" data-seq="scaleup">
  <h3>The only way capacity grows: you raise a copy count</h3>
  <div class="scroll"></div>
  <figcaption>The times are the usual AWS and Kubernetes delays rather than measurements.</figcaption>
</figure>
</div>
