# Get the code

<span class="time">Time: about 5 minutes</span>

You need two folders side by side. Downloading a copy of a repository is called **cloning** it.

```
~/wh/
├── wh-2026/   the challenges and all the infrastructure code
└── CTFd/      the scoreboard program, which the deploy turns into a container image
```

They must sit side by side because the Makefile looks for CTFd at `../../CTFd`, relative to `wh-2026/utils`.

1. Clone the club's repository:
    ```bash
    mkdir -p ~/wh && cd ~/wh
    gh repo clone Whitehat-Society/wh-2026
    ```
2. Clone CTFd version 3.8.5. The deploy relies on features added in version 3.8:
    ```bash
    git clone --branch 3.8.5 --depth 1 https://github.com/CTFd/CTFd.git
    ```
3. Add the plugin that posts first solves to Discord. A **plugin** is an add-on that CTFd loads from its `plugins` folder:
    ```bash
    git clone --depth 1 https://github.com/sigpwny/ctfd-discord-webhook-plugin.git \
      CTFd/CTFd/plugins/ctfd-discord-webhook-plugin
    ```

!!! warning "Confirm the plugin with the previous infra lead"
    WH-2026 built CTFd from a folder on one person's computer that was never uploaded. This page rebuilds that folder from public sources. The plugin above reads the Discord settings the deploy provides, but ask the previous infra lead whether it is the same one. If they still have their `CTFd` folder, ask them to upload it to the club's GitHub.

## Check it worked

```bash
ls ~/wh
ls ~/wh/wh-2026/utils/Makefile ~/wh/CTFd/Dockerfile ~/wh/CTFd/CTFd/plugins/ctfd-discord-webhook-plugin/__init__.py
```

The first command prints `CTFd  wh-2026`. The second prints the three paths, with no `No such file or directory`.

## What's in wh-2026

| Folder | Contents |
|---|---|
| `web/`, `pwn/`, `crypto/`, `forensics/`, `osint/`, `misc/` | One folder per challenge. Each has a `challenge.yml` with its name, description, flag and type |
| `utils/Makefile` | Every deploy command. Run `make <target>` from inside `utils/` |
| `utils/eks/` | Terraform files: network, cluster, helper programs, alarms, backup bucket |
| `utils/ctfd/` | Pulumi program: CTFd, its database and its cache |
| `utils/web-shared/`, `utils/shared-tcp/` | Pulumi programs: the web and pwn challenges |
| `utils/builder/builder.py` | Builds and uploads challenge images, then deploys them |
| `utils/secrets.py` | Reads and writes the secrets in Secrets Manager |
| `docs/ops/` | The original, more technical runbooks this guide is based on |

**Next:** [Make it yours](make-it-yours.md).
