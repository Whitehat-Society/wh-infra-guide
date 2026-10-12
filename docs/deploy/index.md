# Deploy: overview

To **deploy** means to create the system in AWS and start every program. You'll do it in five stages, one page each, and check that each stage works before starting the next. Every command runs in `~/wh/wh-2026/utils`.

!!! warning "Billing starts on the next page"
    From the first command on the next page, AWS charges about US$0.45 an hour until you [delete everything](../teardown.md). Check that your [budget alert](../accounts/budget.md) exists before you start.

<figure class="diagram">
--8<-- "diagrams/who-builds.svg"
<figcaption>Stages 1 to 4. Stage 5 only checks; it builds nothing.</figcaption>
</figure>

| Stage | Command | Page |
|---|---|---|
| 1 | `make deploy-eks` | [The cluster](eks.md) |
| 2 | `make deploy-ctfd`, then CTFd's setup page in a browser | [The scoreboard](ctfd.md) |
| 3 | `make build-images` | [The challenges](challenges.md) |
| 4 | `make deploy-ctfd-backup-cronjob` and `make deploy-healthcheck-cronjob` | [Backups and health checks](day2.md) |
| 5 | `make smoke-test`, then a browser checklist | [Final checks](verify.md) |

## Two habits that save time

1. **Use one terminal window for the whole deploy.** Some pages set a variable, such as `EVENT`, that later commands on the same page use. If you open a new window, rerun the first command block of the page you're on.
2. **If your AWS login expires halfway**, a command fails with `ExpiredToken` or `SSO session ... expired`. Run `aws sso login`, then rerun the same `make` command. Terraform and Pulumi both carry on from where they stopped.

**Next:** [1. The cluster](eks.md).
