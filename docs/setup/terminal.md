# Open a terminal

A **terminal** is a window where you type commands instead of clicking buttons. Almost every step in this guide is a command, so you need a terminal that understands the same commands on every computer. The tools in this guide expect a Linux-style terminal, and the tabs below show how to get one on your system.

=== "Windows"

    The terminals that come with Windows use different commands, so you'll install **WSL** (Windows Subsystem for Linux). WSL runs Ubuntu, a version of Linux, inside Windows, and from then on you'll type every command into the Ubuntu window.

    <figure class="diagram">
    --8<-- "diagrams/wsl.svg"
    <figcaption>Ubuntu runs inside Windows. Docker Desktop and your browser stay ordinary Windows apps, and Ubuntu makes use of them.</figcaption>
    </figure>

    1. Click Start, type `PowerShell`, right-click **Windows PowerShell** and choose **Run as administrator**.
    2. Type this command and press Enter:
        ```powershell
        wsl --install -d Ubuntu-24.04
        ```
    3. Restart the computer when Windows asks you to.
    4. Open **Ubuntu** from the Start menu. It takes about a minute to start the first time.
    5. When Ubuntu asks, choose a username and a password. You'll need the password later to install software. Nothing appears on screen while you type it, which is normal.

    **Check it worked:** the Ubuntu window shows a line ending in `$`, such as `alex@laptop:~$`. That line is called the **prompt**, and it means the terminal is waiting for a command.

    !!! tip "Pasting in Ubuntu"
        Ctrl+V doesn't paste in the Ubuntu window. Right-click to paste instead, or press Ctrl+Shift+V.

    **If it fails:**

    | Message | Fix |
    |---|---|
    | "Virtualization is disabled" or error `0x80370102` | Turn on virtualization in your computer's BIOS settings, where it is called *Intel VT-x*, *AMD-V* or *SVM*. Search the web for your laptop model and "enable virtualization" to find the instructions. |
    | `wsl` is not recognized | Update Windows through **Settings → Windows Update**, and then try again. |

=== "macOS"

    macOS has a terminal built in. To open it, press Command+Space, type `Terminal` and press Enter.

    **Check it worked:** the window shows a line ending in `%` or `$`. That line is called the **prompt**, and it means the terminal is waiting for a command.

=== "Linux"

    Open your distribution's terminal app. On Ubuntu you can press Ctrl+Alt+T.

    **Check it worked:** the window shows a line ending in `$`. That line is called the **prompt**, and it means the terminal is waiting for a command.

    The install commands in this guide are written for Ubuntu 22.04 or 24.04.

**Next:** [Terminal basics](terminal-basics.md).
