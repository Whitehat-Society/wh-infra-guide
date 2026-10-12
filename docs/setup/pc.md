# Install the tools

<span class="time">⏱ ~45 min, mostly downloads</span>

You need about ten command-line tools. Pick your operating system tab and run the blocks in order. Each block is safe to run again if something gets interrupted.

| Tool | What it does here |
|---|---|
| `git` | Downloads the code |
| `aws` (AWS CLI v2) | Talks to your AWS account |
| `terraform` ≥ 1.9 | Builds the AWS side: network, cluster, add-ons |
| `kubectl` | Talks to the Kubernetes cluster |
| `pulumi` v3 | Deploys CTFd and the challenges onto the cluster |
| `go` ≥ 1.25 | Pulumi programs in this repo are written in Go |
| `docker` | Builds the challenge images |
| `python3` + `ctfcli` | Runs `builder.py` and loads challenges into CTFd |
| `make`, `jq`, `nc`, `curl` | Glue used by the Makefile and the checks |

## 1. Get a Linux-style terminal

=== "Windows"

    Everything in this guide runs inside **WSL** (Windows Subsystem for Linux), an Ubuntu system that runs inside Windows.

    1. Open **PowerShell as Administrator** (Start menu → type `PowerShell` → right-click → *Run as administrator*)
    2. Run:
        ```powershell
        wsl --install -d Ubuntu-24.04
        ```
    3. Restart the PC when asked
    4. Open **Ubuntu** from the Start menu. Choose a username and password (the password is for `sudo`, so remember it)
    5. Install Docker Desktop from PowerShell:
        ```powershell
        winget install -e --id Docker.DockerDesktop
        ```
    6. Start Docker Desktop once, then go to **Settings → Resources → WSL integration** and switch on **Ubuntu-24.04**

    From here on, follow the **Linux (Ubuntu)** tab inside the Ubuntu window, but **skip the Docker block** there because Docker Desktop already provides it.

=== "macOS"

    1. Open **Terminal** (⌘ Space → `Terminal`)
    2. Install Homebrew, the macOS package manager:
        ```bash
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        ```
    3. Follow the two `echo ... >> ~/.zprofile` lines it prints at the end, then close and reopen Terminal

=== "Linux (Ubuntu)"

    You already have a terminal. These steps assume Ubuntu 22.04 or 24.04.

## 2. Install the tools

=== "Windows"

    Use the **Linux (Ubuntu)** tab, inside the Ubuntu window. Skip its Docker block.

=== "macOS"

    ```bash
    brew install git make jq netcat awscli hashicorp/tap/terraform kubectl pulumi/tap/pulumi go python@3.12
    brew install --cask docker
    open -a Docker      # start Docker once and accept the prompts
    ```

=== "Linux (Ubuntu)"

    **Basics**
    ```bash
    sudo apt-get update
    sudo apt-get install -y git make jq unzip curl gnupg netcat-openbsd dnsutils python3 python3-venv python3-pip
    ```

    **AWS CLI v2**
    ```bash
    cd /tmp
    curl -sSLo awscliv2.zip "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip"
    unzip -qo awscliv2.zip && sudo ./aws/install --update
    cd ~
    ```

    **Terraform**
    ```bash
    curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor --yes -o /usr/share/keyrings/hashicorp.gpg
    echo "deb [signed-by=/usr/share/keyrings/hashicorp.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" \
      | sudo tee /etc/apt/sources.list.d/hashicorp.list
    sudo apt-get update && sudo apt-get install -y terraform
    ```

    **kubectl**
    ```bash
    ARCH=$(dpkg --print-architecture)
    curl -sSLo /tmp/kubectl "https://dl.k8s.io/release/$(curl -sSL https://dl.k8s.io/release/stable.txt)/bin/linux/${ARCH}/kubectl"
    sudo install -m 0755 /tmp/kubectl /usr/local/bin/kubectl
    ```

    **Go**
    ```bash
    GOV=$(curl -sSL 'https://go.dev/VERSION?m=text' | head -1)
    curl -sSLo /tmp/go.tgz "https://go.dev/dl/${GOV}.linux-$(dpkg --print-architecture).tar.gz"
    sudo rm -rf /usr/local/go && sudo tar -C /usr/local -xzf /tmp/go.tgz
    echo 'export PATH="$PATH:/usr/local/go/bin:$HOME/go/bin"' >> ~/.bashrc
    ```

    **Pulumi**
    ```bash
    curl -fsSL https://get.pulumi.com | sh
    ```

    **Docker** (skip on Windows/WSL)
    ```bash
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
    ```

    Close and reopen the terminal so the new `PATH` and the `docker` group take effect.

## 3. Python packages

The repo's scripts need a few Python libraries plus `ctfcli`. Put them in one virtual environment so they don't clash with system Python:

```bash
python3 -m venv ~/.venvs/wh
echo 'source ~/.venvs/wh/bin/activate' >> ~/.bashrc   # macOS: ~/.zshrc
source ~/.venvs/wh/bin/activate
pip install boto3 docker PyYAML requests pytest ctfcli
```

## 4. Tell git who you are

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

## Check it worked

Paste this whole block. Every line should print a version, and none should print `MISSING`:

```bash
for t in git aws terraform kubectl pulumi go docker python3 ctf make jq nc curl; do
  printf '%-10s ' "$t"; command -v "$t" >/dev/null || { echo MISSING; continue; }
  case $t in
    go) go version ;; kubectl) kubectl version --client 2>&1 | head -1 ;;
    nc|make) echo ok ;; ctf) ctf version 2>/dev/null || echo ok ;;
    *) "$t" --version 2>&1 | head -1 ;;
  esac
done
docker run --rm hello-world | grep -m1 'Hello from Docker'
```

Expected: `terraform` shows `v1.9` or newer, `go` shows `go1.25` or newer, and the last line prints `Hello from Docker!`.

## If it fails

| Symptom | Fix |
|---|---|
| `command not found` right after installing | Close and reopen the terminal, or run `source ~/.bashrc` |
| `permission denied ... docker.sock` | Linux: log out and back in (the `docker` group applies at login). WSL: make sure Docker Desktop is running and WSL integration is on |
| `wsl --install` says virtualization is disabled | Turn on *Intel VT-x* / *AMD-V* (sometimes called *SVM*) in the BIOS, then retry |
| `go version` shows something older than 1.25 | An older Go is earlier on `PATH`. Run `which -a go` and remove the old one |

**Next:** [Create the AWS account](../accounts/aws.md).
