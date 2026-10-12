# Get the code

You need two folders next to each other, and you get each one by downloading a copy of a repository, which is called **cloning** it.

```
~/wh/
├── wh-2026/   the challenges and all the infrastructure code
└── CTFd/      the scoreboard program, which the deploy turns into a container image
```

The two folders have to sit side by side, because the Makefile looks for CTFd at `../../CTFd`, counting from `wh-2026/utils`.

1. Clone the club's repository:
    ```bash
    mkdir -p ~/wh && cd ~/wh
    gh repo clone Whitehat-Society/wh-2026
    ```
2. Clone CTFd version 3.8.5, since the deploy relies on features that were added in version 3.8:
    ```bash
    git clone --branch 3.8.5 --depth 1 https://github.com/CTFd/CTFd.git
    ```
3. Add the plugin that posts first solves to Discord. A **plugin** is an add-on that CTFd loads from its `plugins` folder.
    ```bash
    git clone --depth 1 https://github.com/sigpwny/ctfd-discord-webhook-plugin.git \
      CTFd/CTFd/plugins/ctfd-discord-webhook-plugin
    ```

!!! warning "Confirm the plugin with the previous infra lead"
    WH-2026 built CTFd from a folder on one person's computer, and that folder was never uploaded, so this page rebuilds it from public sources. The plugin above reads the Discord settings that the deploy provides, but ask the previous infra lead whether it is the same plugin they used. If they still have their `CTFd` folder, ask them to upload it to the club's GitHub.

## Check it worked

```bash
ls ~/wh
ls ~/wh/wh-2026/utils/Makefile ~/wh/CTFd/Dockerfile ~/wh/CTFd/CTFd/plugins/ctfd-discord-webhook-plugin/__init__.py
```

The first command prints `CTFd  wh-2026`, and the second prints the three paths without any `No such file or directory` message.

## What's in wh-2026

| Folder | Contents |
|---|---|
| `web/`, `pwn/`, `crypto/`, `forensics/`, `osint/`, `misc/` | One folder per challenge, each with a `challenge.yml` that holds the challenge's name, description, flag and type. |
| `utils/Makefile` | Every deploy command. You run `make <target>` from inside `utils/`. |
| `utils/eks/` | The Terraform files for the network, the cluster, the helper programs, the alarms and the backup bucket. |
| `utils/ctfd/` | The Pulumi program for CTFd, its database and its cache. |
| `utils/web-shared/`, `utils/shared-tcp/` | The Pulumi programs for the web and pwn challenges. |
| `utils/builder/builder.py` | The script that builds and uploads the challenge images and then deploys them. |
| `utils/secrets.py` | The script that reads and writes the secrets in Secrets Manager. |
| `docs/ops/` | The original, more technical runbooks that this guide is based on. |

**Next:** [Make it yours](make-it-yours.md).
