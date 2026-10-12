# Your challenge folder

This section is for challenge writers. It describes what to put in your folder so that the infra team can deploy it without changing anything. You need no AWS access to write a challenge, only Git and, for challenges with a server, Docker.

Each challenge is one folder in the `wh-2026` repository, inside its category's folder, such as `web/` or `crypto/`. A file in that folder named `challenge.yml` describes the challenge: its name, text, points, flag and type. The deploy tools read this file and nothing else, so anything they need must be in it.

<figure class="diagram">
--8<-- "diagrams/write-flow.svg"
<figcaption>(1) For a challenge with a server, the infra team's <code>make build-images</code> builds your Dockerfile into an image and starts it on the cluster. (2) For every challenge, ctfcli copies the text, flags, hints and files from <code>challenge.yml</code> into CTFd. The challenge's address is added to CTFd automatically.</figcaption>
</figure>

## Pick a type

The field `challenge_type` in `challenge.yml` decides how the challenge is deployed:

| `challenge_type` | Use it when | Players get |
|---|---|---|
| `text` | Players only read the description and download files: crypto, forensics, OSINT, most misc | Text and files in CTFd |
| `shared-web` | Players open a website you wrote | A link such as `https://<name>.challenges.<domain>` |
| `shared-tcp` | Players connect to a program with `nc`, as in most pwn challenges | A command such as `nc <address> 1337` |

"Shared" means that all players use the same running copies. A player who breaks the server breaks it for everyone until it restarts, so design the challenge to survive that; see [Shared by every player](server.md#shared-by-every-player).

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

Rules that apply to every type:

- The folder must sit directly inside a category folder. The categories the tools read are listed in `utils/config.ini` under `[CTF]`, as `categories = web,pwn,crypto,forensics,osint,misc`. A folder anywhere else is ignored.
- Name the folder in lowercase letters, digits and hyphens. Spaces and capitals work for `text` challenges, but they make commands harder to type.
- Every path in `challenge.yml` is relative to the folder itself.
- Keep solutions in `solution/`, and list in `.dockerignore` everything the image doesn't need. Whatever is in the image could leak to a player who breaks in.
- Don't commit files larger than about 50 MB. Ask the infra team where to put them.

## Next

1. [Write challenge.yml](challenge-yml.md).
2. For `shared-web` and `shared-tcp`, [write the Dockerfile and test it](server.md).
3. [Check it and hand it in](submit.md).
