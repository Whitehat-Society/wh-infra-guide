# Install the tools

The guide uses about a dozen command-line programs. This page installs all of them. Each block is safe to run again if a download gets interrupted.

<figure class="diagram">
--8<-- "diagrams/tools.svg"
<figcaption>Every tool on the left runs on your computer and reaches one part of the system over the internet. Versions needed: Terraform 1.9 or newer, Pulumi 3, Go 1.25 or newer.</figcaption>
</figure>

## 1. Install Docker

=== "Windows"

    Docker on Windows comes as an app, **Docker Desktop**, that WSL can use.

    1. Open **PowerShell** (not Ubuntu) and run:
        ```powershell
        winget install -e --id Docker.DockerDesktop
        ```
    2. Start **Docker Desktop** from the Start menu and accept its terms.
    3. In Docker Desktop, open **Settings → Resources → WSL integration**, switch on **Ubuntu-24.04**, and click **Apply & restart**.

    Do everything after this inside the Ubuntu window.

=== "macOS"

    1. Install **Homebrew**, the usual way to install command-line programs on macOS:
        ```bash
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        ```
    2. At the end, Homebrew prints two commands under **Next steps**. Run them, then close and reopen Terminal.
    3. Install Docker Desktop and start it once:
        ```bash
        brew install --cask docker
        open -a Docker
        ```

=== "Linux"

    ```bash
    sudo apt-get update && sudo apt-get install -y curl
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker "$USER"
    ```

    The last command lets you use Docker without `sudo`. It takes effect after you log out and back in.

## 2. Install the other programs

=== "Windows"

    Follow the **Linux** tab, typing the commands into the Ubuntu window.

=== "macOS"

    ```bash
    brew install git make jq netcat awscli hashicorp/tap/terraform kubectl pulumi/tap/pulumi go python@3.12
    ```

=== "Linux"

    Run each block in turn.

    **Basic tools**
    ```bash
    sudo apt-get update
    sudo apt-get install -y git make jq unzip curl gnupg netcat-openbsd dnsutils perl python3 python3-venv python3-pip
    ```

    **AWS CLI**
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

    Close the terminal and open a new one. The new window picks up the programs you just installed.

## 3. Install the Python programs

Python programs are installed into a **virtual environment**, a private folder of Python libraries. It keeps this guide's libraries from clashing with anything else on your computer.

```bash
python3 -m venv ~/.venvs/wh
echo 'source ~/.venvs/wh/bin/activate' >> ~/.bashrc
source ~/.venvs/wh/bin/activate
pip install boto3 docker PyYAML requests pytest ctfcli
```

On macOS, replace `~/.bashrc` with `~/.zshrc`. Your prompt now starts with `(wh)`, which shows the environment is active. The `echo` line activates it in every new window.

## 4. Tell git who you are

Git labels every change you save with a name and an email:

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

## Check it worked

Paste this whole block. It prints one line per program:

```bash
for t in git aws terraform kubectl pulumi go docker python3 ctf make jq nc curl dig; do
  printf '%-10s ' "$t"; command -v "$t" >/dev/null || { echo MISSING; continue; }
  case $t in
    go) go version ;; kubectl) kubectl version --client 2>&1 | head -1 ;;
    nc|make|dig) echo ok ;; ctf) ctf version 2>/dev/null || echo ok ;;
    *) "$t" --version 2>&1 | head -1 ;;
  esac
done
docker run --rm hello-world | grep -m1 'Hello from Docker'
```

You should see:

- no line that says `MISSING`
- `terraform` at `v1.9` or newer, and `go` at `go1.25` or newer
- `Hello from Docker!` on the last line, which means Docker can download and run a container

## If it fails

| Message | Fix |
|---|---|
| `MISSING` or `command not found` right after installing | Close and reopen the terminal. If it's still missing, rerun that program's install block |
| `permission denied ... docker.sock` | Linux: log out and back in. Windows: check that Docker Desktop is running and its WSL integration is on |
| `go` older than 1.25 | An older Go is installed elsewhere. `which -a go` lists every copy; remove the old one |
| `ctf` is MISSING | The virtual environment isn't active. Run `source ~/.venvs/wh/bin/activate` |

**Next:** [Create the AWS account](../accounts/aws.md).
