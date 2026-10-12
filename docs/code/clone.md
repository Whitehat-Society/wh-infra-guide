# Get the code

<span class="time">⏱ 5 min</span>

You need two folders side by side. The Makefile builds CTFd from `../../CTFd`, relative to `wh-2026/utils`:

```
~/wh/
├── wh-2026/   challenges + all infrastructure code (private)
└── CTFd/      the scoreboard app, built into a Docker image
```

1. Clone the infrastructure repo:
    ```bash
    mkdir -p ~/wh && cd ~/wh
    gh repo clone Whitehat-Society/wh-2026
    ```
2. Clone CTFd **3.8.5**. The deployment and the scoring plugin depend on features added in 3.8:
    ```bash
    git clone --branch 3.8.5 --depth 1 https://github.com/CTFd/CTFd.git
    ```
3. Add the Discord first-blood plugin. CTFd loads every folder in `CTFd/plugins/`:
    ```bash
    git clone --depth 1 https://github.com/sigpwny/ctfd-discord-webhook-plugin.git \
      CTFd/CTFd/plugins/ctfd-discord-webhook-plugin
    ```

!!! warning "Check the plugin source with the previous infra lead"
    WH-2026 built CTFd from a local folder that was never pushed, so this page rebuilds it from upstream. The plugin above is the one that reads the `DISCORD_WEBHOOK_URL`, `DISCORD_WEBHOOK_LIMIT` and `DISCORD_WEBHOOK_MESSAGE` settings the deployment sets. Confirm it's the same one, and if they still have their `CTFd/` folder, push it to the club's GitHub.

## Check it worked

```bash
ls ~/wh
ls ~/wh/wh-2026/utils/Makefile ~/wh/CTFd/Dockerfile ~/wh/CTFd/CTFd/plugins/ctfd-discord-webhook-plugin/__init__.py
```

Expected: `CTFd  wh-2026`, then the three paths print with no `No such file` errors.

## What's in wh-2026

| Folder | What it is |
|---|---|
| `web/`, `pwn/`, `crypto/`, `forensics/`, `osint/`, `misc/` | One folder per challenge, each with a `challenge.yml` |
| `utils/Makefile` | Every deploy command. You run `make <target>` from `utils/` |
| `utils/eks/` | Terraform: network, cluster, add-ons, alarms, backups bucket |
| `utils/ctfd/` | Pulumi (Go): CTFd + MariaDB + Redis on the cluster |
| `utils/web-shared/`, `utils/shared-tcp/` | Pulumi (Go): the web and pwn challenge deployments |
| `utils/builder/builder.py` | Builds and pushes challenge images, then deploys them |
| `utils/secrets.py` | Reads and writes the secrets stored in AWS Secrets Manager |
| `docs/ops/` | The original runbooks this guide is based on |

**Next:** [Make it yours](make-it-yours.md).
