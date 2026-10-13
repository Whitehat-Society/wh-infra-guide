# Your challenge folder

This section is for challenge writers.

## The goal

When you finish, your challenge appears in CTFd with its text, files and points, players who find the flag score, and, if it has a server, every player can reach that server. The infra team should be able to deploy it without changing anything in your folder. You don't need any AWS access to write a challenge, only Git, plus Docker if your challenge has a server.

## The order

| Page | What you'll have afterwards |
|---|---|
| Your challenge folder, this page | The right type for your challenge, and the folder laid out the way the deploy expects. |
| [challenge.yml](challenge-yml.md) | The file that describes the challenge to CTFd and to the deploy. |
| [Challenges with a server](server.md) | A Dockerfile that you have tested on your own computer. Skip this page for a `text` challenge. |
| [Hand it in](submit.md) | A folder that passes the checklist and the validator, handed to the infra team. |

## How a challenge gets deployed

Each challenge is one folder in the event's repository, such as `wh-2027`, placed inside its category's folder such as `web/` or `crypto/`. The infra team creates that repository as a copy of `wh-base`, so ask them for its name and for access to it. A file in that folder named `challenge.yml` describes the challenge, including its name, text, points, flag and type. The deploy tools read this file and nothing else, so anything they need has to be in it.

<figure class="diagram">
--8<-- "diagrams/write-flow.svg"
<figcaption>(1) For a challenge with a server, the infra team's <code>make build-images</code> builds your Dockerfile into an image and starts it on the cluster. (2) For every challenge, ctfcli copies the text, flags, hints and files from <code>challenge.yml</code> into CTFd, and the challenge's address is added to CTFd automatically.</figcaption>
</figure>

## Pick a type

The `challenge_type` field in `challenge.yml` decides how the challenge is deployed, and there are three types to choose from.

| `challenge_type` | Use it when | Players get |
|---|---|---|
| `text` | Players only read the description and download files, as in crypto, forensics, OSINT and most misc challenges | Text and files in CTFd |
| `shared-web` | Players open a website you wrote | A link such as `https://<name>.challenges.<domain>` |
| `shared-tcp` | Players connect to a program with `nc`, as in most pwn challenges | A command such as `nc <address> 1337` |

"Shared" means that all players use the same running copies. A player who breaks the server breaks it for everyone until it restarts, so design the challenge to survive that, as [Shared by every player](server.md#shared-by-every-player) explains.

## Start from a template

The repository comes with one working template challenge of each type, and copying the one that matches yours is the quickest way to get the layout right. Each template's `README.md` explains how it works and how to test it.

| Type | Template folder | What it is |
|---|---|---|
| `text` | `misc/example-text/` | A file encrypted with XOR, and a solve script. |
| `shared-web` | `web/example-web/` | A small Flask site that hides its flag behind `robots.txt`. |
| `shared-tcp` | `pwn/example-tcp/` | A C program with a buffer overflow, served with `socat`. |

For example, to start a web challenge called `lost-cookie`, copy the template and then change every field in the copy's `challenge.yml`:

```bash
cp -r web/example-web web/lost-cookie
```

Delete the templates from the event's repository before the CTF starts, or leave them with `state: hidden`, so that players never see them.

## Folder layout

=== "text"

    ```
    crypto/
    └── lost-xor-password/          folder name: lowercase letters, digits, hyphens
        ├── challenge.yml           required
        ├── README.md               notes for the infra team and reviewers
        ├── dist/                   files players download
        │   └── ciphertext.txt
        └── solution/               your solve script and write-up; never given to players
            └── solve.py
    ```

=== "shared-web"

    ```
    web/
    └── inspectpost/
        ├── challenge.yml           required
        ├── Dockerfile              required: builds the website
        ├── .dockerignore           keeps solution/ and other files out of the image
        ├── README.md
        ├── src/                    the website's code
        └── solution/
            └── solve.py
    ```

=== "shared-tcp"

    ```
    pwn/
    └── loop/
        ├── challenge.yml           required
        ├── Dockerfile              required: builds the program and serves it with socat
        ├── .dockerignore
        ├── README.md
        ├── source/                 the program's source code
        │   └── loop.c
        ├── public/                 what players download, e.g. the compiled binary
        │   └── loop
        └── solution/
            └── exploit.py
    ```

A few rules apply to every type of challenge.

- The folder has to sit directly inside a category folder. The tools only read the categories listed in `utils/config.ini` under `[CTF]`, as `categories = web,pwn,crypto,forensics,osint,misc`, and they ignore a folder anywhere else.
- Name the folder with lowercase letters, digits and hyphens. Spaces and capitals do work for `text` challenges, but they make commands harder to type.
- Every path in `challenge.yml` is relative to the challenge folder itself.
- Keep solutions in `solution/`, and list everything the image doesn't need in `.dockerignore`, because anything inside the image could leak to a player who breaks in.
- Don't commit files larger than about 50 MB. Ask the infra team where to put them instead.

## Next

1. [Write challenge.yml](challenge-yml.md).
2. For a `shared-web` or `shared-tcp` challenge, [write the Dockerfile and test it](server.md).
3. [Check the challenge and hand it in](submit.md).
