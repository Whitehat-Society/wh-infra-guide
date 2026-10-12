# Open a terminal

A **terminal** is a window where you type commands instead of clicking. Almost every step in this guide is a command, so you need a terminal that understands the same commands on every computer. The tools in this guide expect a Linux-style terminal.

=== "Windows"

    Windows terminals use different commands, so you'll install **WSL** (Windows Subsystem for Linux). WSL runs Ubuntu, a version of Linux, inside Windows. From then on, you'll type every command into the Ubuntu window.

    1. Click Start, type `PowerShell`, right-click **Windows PowerShell** and choose **Run as administrator**.
    2. Type this and press Enter:
        ```powershell
        wsl --install -d Ubuntu-24.04
        ```
    3. Restart the computer when asked.
    4. Open **Ubuntu** from the Start menu. The first start takes a minute.
    5. When asked, choose a username and a password. The password is for installing software later. Nothing appears on screen while you type it; that's normal.

    **Check it worked:** the Ubuntu window shows a line ending in `$`, such as `alex@laptop:~$`. That line is the **prompt**. It means the terminal is waiting for a command.

    !!! tip "Pasting in Ubuntu"
        Ctrl+V doesn't paste in the Ubuntu window. Right-click to paste, or use Ctrl+Shift+V.

    **If it fails:**

    | Message | Fix |
    |---|---|
    | "Virtualization is disabled" or error `0x80370102` | Turn on virtualization in your computer's BIOS settings. It's called *Intel VT-x*, *AMD-V* or *SVM*. Search your laptop model plus "enable virtualization" for instructions |
    | `wsl` is not recognized | Update Windows through Settings → Windows Update, then try again |

=== "macOS"

    macOS has a terminal built in.

    1. Press Command+Space, type `Terminal`, press Enter.

    **Check it worked:** the window shows a line ending in `%` or `$`. That line is the **prompt**. It means the terminal is waiting for a command.

=== "Linux"

    Open your distribution's terminal app. On Ubuntu, press Ctrl+Alt+T.

    **Check it worked:** the window shows a line ending in `$`. That line is the **prompt**. It means the terminal is waiting for a command.

    This guide's install commands are written for Ubuntu 22.04 or 24.04.

**Next:** [Terminal basics](terminal-basics.md).
