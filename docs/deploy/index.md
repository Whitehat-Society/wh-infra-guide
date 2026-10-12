# Deploy: overview

To **deploy** the system means to create it in AWS and start every program in it. You'll do this in five stages, with one page for each stage, and you'll check that each stage works before you start the next. Every command runs in the `~/wh/wh-2026/utils` folder.

!!! warning "Billing starts on the next page"
    From the first command on the next page, AWS charges about US$0.45 an hour until you [delete everything](../teardown.md), so check that your [budget alert](../accounts/budget.md) exists before you start.

<figure class="diagram">
--8<-- "diagrams/who-builds.svg"
<figcaption>Stages 1 to 4. Stage 5 only checks the result and builds nothing.</figcaption>
</figure>

| Stage | Command | Page |
|---|---|---|
| 1 | `make deploy-eks` | [The cluster](eks.md) |
| 2 | `make deploy-ctfd`, then CTFd's setup page in a browser | [The scoreboard](ctfd.md) |
| 3 | `make build-images` | [The challenges](challenges.md) |
| 4 | `make deploy-ctfd-backup-cronjob` and `make deploy-healthcheck-cronjob` | [Backups and health checks](day2.md) |
| 5 | `make smoke-test`, then a browser checklist | [Final checks](verify.md) |

## Two habits that save time

1. **Use one terminal window for the whole deploy.** Some pages set a variable such as `EVENT` that later commands on the same page rely on. If you do open a new window, run the first command box of the page you're on again.
2. **Sign in again if your AWS login expires halfway.** When that happens, a command fails with `ExpiredToken` or `SSO session ... expired`. Run `aws sso login` and then the same `make` command again, and Terraform and Pulumi will both carry on from where they stopped.

**Next:** [1. The cluster](eks.md).
