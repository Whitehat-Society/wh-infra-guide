# Terminal basics

You only need a handful of terminal skills for this guide, and this page covers all of them. Try each example in your own terminal as you read, since typing them once makes the rest of the guide much easier to follow.

## Running a command

Type a command after the prompt and press Enter. The terminal runs the command, prints any output, and shows a new prompt when it has finished.

```bash
echo hello
```

The terminal prints `hello`, because `echo` simply prints whatever follows it.

A long-running command, such as a deploy, can keep printing for many minutes before the prompt comes back. Wait for the prompt before you type the next command. If you need to stop a command early, press **Ctrl+C**.

## Pasting a block of commands

Many boxes in this guide contain several lines. You can copy the whole box and paste it in one go, and the terminal will run the lines one after another.

When a line ends with a backslash (`\`), the command continues on the next line, and the terminal treats both lines as a single command.

## Folders and files

The terminal always works inside one folder, which is called the **current folder**, and commands look for files there unless you tell them otherwise.

| Command | What it does |
|---|---|
| `pwd` | Prints the current folder. |
| `ls` | Lists the files in the current folder. |
| `cd wh-2026` | Moves into the folder `wh-2026`. |
| `cd ..` | Moves up one folder. |
| `cd ~` | Moves to your home folder. `~` is short for your home folder in any command. |
| `mkdir -p ~/wh` | Creates a folder. The `-p` option stops it from complaining if the folder already exists. |

Most command boxes in this guide start with `cd ~/wh/wh-2026/utils`, so that they work no matter which folder you were in before.

## Editing a file

`nano` is a simple text editor that runs inside the terminal.

1. Open a file by typing `nano notes.txt`.
2. Type or change the text, using the arrow keys to move around.
3. Save with **Ctrl+O**, and then press Enter to confirm the file name.
4. Quit with **Ctrl+X**.

## Variables

A **variable** stores a value so that later commands in the same terminal window can use it. You set a variable with `NAME=value`, with no spaces around the `=`, and you use it by writing `$NAME`:

```bash
DOMAIN=example-ctf.com
echo "The scoreboard is at ctf.$DOMAIN"
```

Variables disappear when you close the terminal window. Some pages set a variable early and use it further down, so keep one window open for the whole page. If you do open a new window, run the page's first command box again.

A variable can also hold the output of a command. When you write `$( … )`, the terminal runs the command inside the brackets and puts its output in their place:

```bash
TODAY=$(date +%F)
echo "$TODAY"
```

## Installing software with sudo

Installing software changes the whole system, so Linux asks for your password first. Putting `sudo` in front of a command runs it with those extra rights. The password is the one you chose when you set up Ubuntu, and nothing appears on screen while you type it.

## Reading errors

When a command fails, it usually prints a line containing `error` or `Error`, and the first such line is normally the most useful one. Look it up in the *If it fails* table at the bottom of the page you're on, or in [Troubleshooting](../reference/troubleshooting.md).

The message `command not found` means that the program isn't installed, or that the terminal hasn't noticed a new install yet. Close the terminal, open it again, and retry the command.

**Next:** [Install the tools](pc.md).
