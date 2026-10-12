# Scaling up

<span class="time">⏱ 2–8 min per change</span>

**Only the nodes autoscale. No pod autoscales.** Every replica count is a fixed number in code or config. More capacity means changing that number and redeploying.

## How to add capacity

=== "More web pods"

    A fresh deploy runs **1 pod per web challenge**. WH-2026 raised it to 2 during the event.

    1. In `utils/builder/builder.py`, in the `shared-web` branch of `build_challenges`, change `'replicas': 1,` to `'replicas': 2,`
    2. Redeploy:
        ```bash
        cd ~/wh/wh-2026/utils && make build-images
        ```
    3. Check: `kubectl get pods -n challenges-web` shows 2 pods per challenge

    !!! warning "Stateful web challenges break with more than 1 replica"
        Logins and stored data don't follow a player between pods. Read the table in [Known weak spots](risks.md#many-players-on-one-challenge) before scaling `xssive-login`, `inspectpost` or `pokemon-portal`.

=== "More pwn pods"

    1. In `utils/config.ini`, set `shared_tcp_replicas` under `[CHALL_MANAGER]`, e.g. `5`
    2. Redeploy:
        ```bash
        cd ~/wh/wh-2026/utils && make build-images
        ```
    3. Check: `kubectl get pods -n challenges-tcp`

    Safe for every pwn challenge: each connection gets its own process anyway.

=== "More NGINX pods"

    1. In `utils/eks/helm.tf`, raise `replicaCount` for `ingress-nginx`
    2. `terraform -chdir=eks apply -var-file=terraform.tfvars.json`

=== "More nodes, now"

    The autoscaler adds nodes when pods are `Pending`. To add them ahead of a rush:

    ```bash
    EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
    NG=$(aws eks list-nodegroups --cluster-name "$EVENT-eks" --query 'nodegroups[0]' --output text)
    aws eks update-nodegroup-config --cluster-name "$EVENT-eks" --nodegroup-name "$NG" \
      --scaling-config minSize=4,maxSize=6,desiredSize=4
    ```

    Set it back to `minSize=2,desiredSize=3` after the event, or just [tear down](../teardown.md).

## Which layers scale, and how

<div class="wh">
--8<-- "scaling-layers.html"
</div>

## What happens under load

These diagrams are from WH-2026's configuration. They show why a traffic spike alone never adds capacity.

<div class="wh">
--8<-- "scaling-figs.html"
</div>

<div class="wh">
--8<-- "scaling-cards.html"
</div>
