# Appendix: chall-manager

**This appendix is optional.** The rest of the guide works without it.

## What it does

In the main system, every player shares one running copy of each challenge. [chall-manager](https://github.com/ctfer-io/chall-manager) instead starts a **separate copy for each team**, when the team asks for one, and deletes it after a set time. Players click a button in CTFd and receive their own address. That removes the shared-data problems described in [Known weak spots](../operate/risks.md#many-players-on-one-challenge), at the cost of many more parts that can fail.

At WH-2026, chall-manager ran for one challenge, `filelocker`, and no player used it. Every other challenge used the shared approach this guide describes.

## What it adds

| Part | Where it comes from |
|---|---|
| The chall-manager program, and a "janitor" that deletes expired copies, in the namespace `chall-manager` | The Pulumi program in `utils/chall-manager/`, deployed with `make deploy-chall-manager` |
| A *scenario* for each challenge: a small Pulumi program that creates one team's copy, with its Service and Ingress | e.g. `web/filelocker/src/scenario/` |
| A registry for scenarios | The ECR registry `<event>-scenarios`, which `make deploy-eks` already creates |
| The button in CTFd | The `ctfd-chall-manager` plugin, added to `CTFd/CTFd/plugins/` |
| Two more tools on your computer | `oras`, which uploads scenarios, and `chall-manager-cli`, which talks to chall-manager |

## How to set it up

Do this after finishing [Deploy](../deploy/index.md). The steps are in the wh-2026 repository:

1. `docs/ops/deploy-live-infra.md`, from **Step 2** (deploy chall-manager) to **Step 5** (check that two teams get separate copies).
2. `docs/ops/event-runbook.md`, **Phase E**: a test with 30 teams at once, `make load-test TEAMS=30`.
3. Switch the chall-manager alarm back on. [1. The cluster](../deploy/eks.md) switched it off:
    ```bash
    aws cloudwatch enable-alarm-actions --alarm-names "$EVENT-chall-manager-pod-down"
    ```

## Problems found at WH-2026

- **chall-manager forgets everything when it restarts.** It keeps its records inside its own pod. After any restart, run `make build-images` to register the challenges again.
- **Commands that create a copy get cut off.** The load balancer in front of chall-manager drops connections that are silent for 30 seconds, and creating a copy takes longer. Connect directly instead: `kubectl port-forward -n chall-manager svc/chall-manager 18081:8080`, then use `--url localhost:18081`.
- **Web scenarios must name NGINX.** Each scenario's Ingress needs the annotation `kubernetes.io/ingress.class: nginx`. Without it, NGINX ignores the Ingress, and creating a copy never finishes.
