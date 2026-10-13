# Get the code

`wh-base` is the club's starting point for every event. It holds the infrastructure code and three template challenges, and it names no particular event, so you start by downloading a copy of it, which is called **cloning**, into a folder named after your event.

1. Clone `wh-base` into a new folder, replacing `wh-2027` with your event's name:
    ```bash
    mkdir -p ~/wh && cd ~/wh
    gh repo clone Whitehat-Society/wh-base wh-2027
    ```
2. Give the event its own repository on GitHub. Challenge writers send their challenges there, and your settings and changes stay out of `wh-base`, which the next event starts from. Creating a repository under `Whitehat-Society` needs permission from an owner of the GitHub organisation, so ask the infra lead first if the last command fails.
    ```bash
    cd ~/wh/wh-2027
    git remote rename origin base
    gh repo create Whitehat-Society/wh-2027 --private --source . --remote origin --push
    ```
    A **remote** is git's name for a copy of the repository on GitHub. After these commands, `origin` is the event's repository, where you push your work, and `base` is `wh-base`, where you can fetch fixes later with `git pull base main`.

## Check it worked

```bash
cd ~/wh/wh-2027
ls
git remote -v
```

`ls` prints `README.md  misc  pwn  utils  web`, and `git remote -v` lists `origin` pointing at your event's repository and `base` pointing at `wh-base`.

## What's in the folder

| Path | What it is |
|---|---|
| `web/`, `pwn/`, `misc/`, and later `crypto/`, `forensics/`, `osint/` | One folder per challenge. `web/example-web`, `pwn/example-tcp` and `misc/example-text` are the templates, one of each kind. |
| `utils/Makefile` | Every deploy command. You run `make <target>` from inside `utils/`, and `make` on its own lists them. |
| `utils/eks/` | The Terraform files for the network, the cluster, the helper programs, the alarms and the buckets. `terraform.tfvars.json` here is the one settings file you edit. |
| `utils/settings.py` | Works out every other name, such as the cluster's and the buckets', from that settings file. |
| `utils/config.ini` | Which folders hold challenges, and how many copies of each challenge run. |
| `utils/ctfd/` | The Pulumi program for CTFd, its database and its cache. `image/` holds the recipe for the CTFd image, and the two `*-cronjob.yaml` files are the backup and health-check jobs. |
| `utils/web-shared/`, `utils/shared-tcp/` | The Pulumi programs for the web and pwn challenges. |
| `utils/builder/builder.py` | The script that builds and uploads the challenge images, deploys them and loads them into CTFd. |
| `utils/secrets.py` | The script that reads and writes the passwords in Secrets Manager. |

**Next:** [Your settings](make-it-yours.md).
