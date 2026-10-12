# Terminal basics

<span class="time">Time: about 15 minutes</span>

You need only a handful of terminal skills for this guide. Try each example in your own terminal as you read.

## Running a command

Type a command after the prompt and press Enter. The terminal runs it, prints any output, and shows a new prompt when it finishes.

```bash
echo hello
```

The terminal prints `hello`. `echo` prints whatever follows it.

A long-running command, such as a deploy, keeps printing for many minutes before the prompt returns. Wait for the prompt before typing the next command. To stop a command early, press **Ctrl+C**.

## Pasting a block of commands

Many boxes in this guide contain several lines. Copy the whole box and paste it in one go. The terminal runs the lines one after another.

A line that ends with a backslash, `\`, continues on the next line. The terminal treats both lines as one command.

## Folders and files

The terminal always works inside one folder, the **current folder**. Commands look for files there.

| Command | What it does |
|---|---|
| `pwd` | Prints the current folder |
| `ls` | Lists the files in the current folder |
| `cd wh-2026` | Moves into the folder `wh-2026` |
| `cd ..` | Moves up one folder |
| `cd ~` | Moves to your home folder. `~` is short for your home folder everywhere |
| `mkdir -p ~/wh` | Creates a folder (`-p`: no error if it already exists) |

Most commands in this guide start with `cd ~/wh/wh-2026/utils`, so they work no matter which folder you were in.

## Editing a file

`nano` is a simple text editor that runs inside the terminal.

1. Open a file: `nano notes.txt`
2. Type or change text. Use the arrow keys to move around.
3. Save with **Ctrl+O**, then press Enter.
4. Quit with **Ctrl+X**.

## Variables

A **variable** stores a value for later commands in the same terminal window. You set one with `NAME=value`, with no spaces around `=`, and use it by writing `$NAME`:

```bash
DOMAIN=example-ctf.com
echo "The scoreboard is at ctf.$DOMAIN"
```

Variables disappear when you close the terminal window. Some pages set a variable early and use it later, so keep one window open per page. If you open a new window, rerun the page's first command block.

A variable can also hold a command's output. `$( … )` runs the command inside it and puts its output in its place:

```bash
TODAY=$(date +%F)
echo "$TODAY"
```

## Installing software and sudo

Installing software changes the system, so Linux asks for your password first. Putting `sudo` in front of a command runs it with those extra rights. The password is the one you chose when you set up Ubuntu. Nothing appears while you type it.

## Reading errors

When a command fails, it usually prints a line containing `error` or `Error`. The first such line is the most useful one. Look it up in the page's **If it fails** table, or in [Troubleshooting](../reference/troubleshooting.md).

`command not found` means the program isn't installed, or the terminal hasn't noticed a new install yet. Close and reopen the terminal, then try again.

**Next:** [Install the tools](pc.md).
