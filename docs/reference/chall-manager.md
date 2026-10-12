# Appendix: chall-manager (optional)

**Skip this unless you need per-player challenge instances.** The rest of the guide works without it.

## What it is

[chall-manager](https://github.com/ctfer-io/chall-manager) starts a **separate copy of a challenge for each team**, on demand, and deletes it after a timeout. Players click "Boot" in CTFd and get their own URL. It fixes the shared-state problems in [Known weak spots](../operate/risks.md#many-players-on-one-challenge), at the cost of a lot more moving parts.

At WH-2026 it ran for one challenge, `filelocker`, and it served no players. Every other challenge used the shared model described in this guide.

## What it adds

| Piece | Where |
|---|---|
| chall-manager + janitor pods (namespace `chall-manager`) | `utils/chall-manager/` (Pulumi Go) → `make deploy-chall-manager` |
| A "scenario" per challenge: a small Pulumi program that creates one player's pod, Service and Ingress | `web/filelocker/src/scenario/` |
| Scenario images in ECR | repo `<event>-scenarios`, created by `make deploy-eks` |
| The CTFd plugin that shows the Boot button | `ctfd-chall-manager` plugin in `CTFd/CTFd/plugins/`, CTFd 3.8+ |
| Extra tools on your PC | `oras`, `chall-manager-cli` |

## How to turn it on

Follow these in the wh-2026 repo, after finishing [Deploy](../deploy/index.md):

1. `docs/ops/deploy-live-infra.md`, **Step 2** (deploy chall-manager) through **Step 5** (check two teams get separate instances)
2. `docs/ops/event-runbook.md`, **Phase E** (load test with `make load-test TEAMS=30`)
3. Re-enable the alarm you silenced in [1. Cluster](../deploy/eks.md):
    ```bash
    aws cloudwatch enable-alarm-actions --alarm-names "$EVENT-chall-manager-pod-down"
    ```

## Known problems from WH-2026

- chall-manager keeps its database in `/tmp` inside the pod. **A pod restart forgets every challenge.** Rerun `make build-images` after any restart
- The gRPC endpoint sits behind an NLB with a 30-second idle timeout, so CLI calls that create instances get cut off. Use `kubectl port-forward -n chall-manager svc/chall-manager 18081:8080` and `--url localhost:18081`
- HTTP scenarios must set the annotation `kubernetes.io/ingress.class: nginx`, or instance creation hangs forever
