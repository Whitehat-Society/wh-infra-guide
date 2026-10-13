# Deploy: overview

## The goal

By the end of this section, the CTF is live. Players can open `ctf.<your-domain>`, every web and pwn challenge answers, and alarms, backups and health checks are running. To **deploy** the system means to create it in AWS and start every program in it, and it takes about 1.5 hours on a fresh account.

## The order

The stages build the chain from [What we're building](../concepts/big-picture.md#the-chain-of-parts) from the bottom up, because each part runs on the one beneath it. You check that each stage works before you start the next, so that a problem shows up on the page that caused it. Every command runs in the `~/wh/wh-2027/utils` folder.

!!! warning "Billing starts on the next page"
    From the first command on the next page, AWS charges about US$0.45 an hour until you [delete everything](../teardown.md), so check that your [budget alert](../accounts/budget.md) exists before you start.

<figure class="diagram">
--8<-- "diagrams/who-builds.svg"
<figcaption>Stages 1 to 4. Stage 5 only checks the result and builds nothing.</figcaption>
</figure>

| Stage | Builds part | Command | Page |
|---|---|---|---|
| 1 | 2 and 3, plus the alarms from 6 | `make deploy-eks` | [The cluster](eks.md) |
| 2 | 4 | `make deploy-ctfd`, then CTFd's setup page in a browser | [The scoreboard](ctfd.md) |
| 3 | 5 | `make build-images` | [The challenges](challenges.md) |
| 4 | The jobs from 6 | `make deploy-ctfd-backup-cronjob` and `make deploy-healthcheck-cronjob` | [Backups and health checks](day2.md) |
| 5 | Nothing, it checks the result | `make smoke-test`, then a browser checklist | [Final checks](verify.md) |

## Two habits that save time

1. **Use one terminal window for the whole deploy.** Some pages set a variable such as `EVENT` that later commands on the same page rely on. If you do open a new window, run the first command box of the page you're on again.
2. **Sign in again if your AWS login expires halfway.** When that happens, a command fails with `ExpiredToken` or `SSO session ... expired`. Run `aws sso login` and then the same `make` command again, and Terraform and Pulumi will both carry on from where they stopped.

**Next:** [1. The cluster](eks.md).
