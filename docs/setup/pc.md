# Install the tools

The guide uses about a dozen command-line programs, and this page installs all of them. Every command box on the page is safe to run again, so if a download is interrupted you can simply repeat it.

<figure class="diagram">
--8<-- "diagrams/tools.svg"
<figcaption>Every tool on the left runs on your computer and reaches one part of the system over the internet. You need Terraform 1.9 or newer, Pulumi 3, and Go 1.25 or newer.</figcaption>
</figure>

## 1. Install Docker

=== "Windows"

    On Windows, Docker comes as an app called Docker Desktop, which the Ubuntu window can use once you connect the two.

    1. Open **PowerShell** (not Ubuntu) and run:
        ```powershell
        winget install -e --id Docker.DockerDesktop
        ```
    2. Start **Docker Desktop** from the Start menu and accept its terms.
    3. In Docker Desktop, open **Settings → Resources → WSL integration**, switch on **Ubuntu-24.04**, and click **Apply & restart**.

    From here on, do everything inside the Ubuntu window.

=== "macOS"

    1. Install **Homebrew**, the usual way to install command-line programs on macOS:
        ```bash
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        ```
    2. When it finishes, Homebrew prints two commands under *Next steps*. Run both of them, and then close and reopen Terminal.
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

    The last command lets you use Docker without typing `sudo`, and it takes effect once you log out and back in.

## 2. Install the other programs

=== "Windows"

    Follow the Linux tab, and type its commands into the Ubuntu window.

=== "macOS"

    ```bash
    brew install git make jq netcat awscli hashicorp/tap/terraform kubectl pulumi/tap/pulumi go python@3.12
    ```

=== "Linux"

    Run the boxes below one at a time, in order.

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

    When you've run every box, close the terminal and open a new one, so that the new window picks up the programs you just installed.

## 3. Install the Python programs

The Python programs go into a **virtual environment**, which is a private folder of Python libraries. Keeping them there stops this guide's libraries from clashing with anything else on your computer.

```bash
python3 -m venv ~/.venvs/wh
echo 'source ~/.venvs/wh/bin/activate' >> ~/.bashrc
source ~/.venvs/wh/bin/activate
pip install boto3 docker PyYAML requests pytest ctfcli
```

On macOS, Homebrew's Python is `python3.12`, while `python3` may still be the older one that came with macOS. Create the environment with `python3.12 -m venv ~/.venvs/wh` instead of the first line, and replace `~/.bashrc` with `~/.zshrc`. After activating it, `python --version` should print `Python 3.12`. Your prompt now starts with `(wh)`, which shows that the environment is active, and the `echo` line makes sure it is activated in every new window too.

## 4. Tell git who you are

Git labels every change you save with your name and email address, so set them once:

```bash
git config --global user.name  "Your Name"
git config --global user.email "you@example.com"
```

## Check it worked

Paste this whole box into the terminal. It prints one line for each program:

```bash
for t in git aws terraform kubectl pulumi go docker python3 ctf make jq nc curl dig; do
  printf '%-10s ' "$t"; command -v "$t" >/dev/null || { echo MISSING; continue; }
  case $t in
    go) "$t" version 2>&1 | head -1 ;; kubectl) kubectl version --client 2>&1 | head -1 ;;
    nc|make|dig) echo ok ;; ctf) ctf version 2>/dev/null || echo ok ;;
    *) "$t" --version 2>&1 | head -1 ;;
  esac
done
docker run --rm hello-world | grep -m1 'Hello from Docker'
```

No line should say `MISSING`, `terraform` should be at `v1.9` or newer, and `go` should be at `go1.25` or newer. The last line should read `Hello from Docker!`, which shows that Docker can download and run a container.

## If it fails

| Message | Fix |
|---|---|
| `MISSING` or `command not found` right after installing | Close and reopen the terminal. If the program is still missing, run its install box again. |
| `error getting credentials` … `logon session does not exist` | This happens on Windows. Remove the line `"credsStore": "desktop.exe"` from `~/.docker/config.json`. |
| `Cannot connect to the Docker daemon` | Start Docker Desktop and wait until it says *Engine running*. On Windows, also check that you switched on WSL integration in step 1.3. |
| `permission denied ... docker.sock` | On Linux, log out and back in. On Windows, check that Docker Desktop is running and that its WSL integration is on. |
| `go` older than 1.25 | An older copy of Go is installed somewhere else. `which -a go` lists every copy, so you can remove the old one. |
| `ctf` is MISSING | The virtual environment isn't active. Run `source ~/.venvs/wh/bin/activate`. |

## Check your understanding

Work out your answer before you open the hidden one.

!!! question "1. The variable that vanished"
    A page starts with `DOMAIN=$(python3 settings.py domain)`. Halfway down, you open a second terminal window to watch the pods, and later you paste the page's `curl -sI "https://ctf.$DOMAIN"` into that second window. `curl` answers `Could not resolve host: ctf.`. What went wrong, and how do you fix it?

    ??? success "Answer"
        A variable only exists in the window that set it. In the second window `$DOMAIN` is empty, so `curl` tried to reach a computer called `ctf.`. Either run the command in the first window, or run the page's first command box in the second window as well.

!!! question "2. Only one tool is missing"
    You're on macOS. Yesterday the tool check passed. Today, in a new Terminal window, `ctf` says `command not found`, while `aws`, `terraform` and every other tool still work. What is the likely cause, and why does it affect only `ctf`?

    ??? success "Answer"
        `ctf` was installed inside the virtual environment, so the terminal only finds it while that environment is active, whereas the other tools were installed for the whole computer. A new window activates the environment only if its start-up file says so, and on macOS that file is `~/.zshrc`. If the `source ~/.venvs/wh/bin/activate` line went into `~/.bashrc`, it never runs. Run the `source` line now, and add it to `~/.zshrc` so that every new window gets it.

**Next:** [Accounts: overview](../accounts/index.md).
