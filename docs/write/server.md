# Challenges with a server

A `shared-web` or `shared-tcp` challenge needs a **Dockerfile** in its folder: a recipe that builds your program into an image. The cluster runs that image unchanged, so if it works on your computer with the commands below, it works on the cluster.

## Rules for the Dockerfile

| Rule | Why |
|---|---|
| The program listens on `port_number`, on every address (`0.0.0.0`), not only `127.0.0.1` | Connections arrive from outside the container |
| A web challenge speaks plain `http` | The cluster adds `https` in front of it |
| A pwn challenge serves its program with `socat`, and installs `socat` in the **final** stage of the Dockerfile | In a multi-stage Dockerfile only the last stage ends up in the image. A missing `socat` stops the pod with `executable file not found` |
| For a 32-bit program, leave `stdbuf -i0 -o0 -e0` out of the `socat` line, and turn off output buffering in the program itself with `setvbuf(stdout, NULL, _IONBF, 0);` | `stdbuf` only works with 64-bit programs. With a 32-bit one, every player first sees `ERROR: ld.so: object '…libstdbuf.so' … cannot be preloaded` |
| `CMD` starts the program in the foreground, and it never exits | Kubernetes restarts a container whose main program exits, and players see the challenge go down |
| The image needs nothing outside itself: no second container, no `docker-compose.yml`, no database server | The cluster starts exactly one container from your Dockerfile. `docker-compose.yml` is ignored. Use SQLite or files inside the image for data |
| The program runs as a normal user, not `root` | A player who breaks in shouldn't control the container |
| It fits in 512 MB of memory and half a processor core | Those are the cluster's limits per copy. A container that uses more memory is stopped and restarted |
| Start from a fixed version, e.g. `FROM python:3.12-slim` or `FROM ubuntu:24.04`, not `:latest` | A `:latest` image changes without warning, and the next deploy may break |

!!! warning "Don't use `pwn.red/jail` as the base image"
    It needs special permissions that the cluster doesn't give, and it has no `socat`. Use `ubuntu` or `debian` with `socat`, as in the example below.

## Examples

=== "shared-tcp (pwn)"

    ```dockerfile
    # Stage 1: compile the program
    FROM ubuntu:24.04 AS builder
    RUN apt-get update && apt-get install -y --no-install-recommends build-essential \
        && rm -rf /var/lib/apt/lists/*
    WORKDIR /build
    COPY source/chal.c .
    RUN gcc -O0 -fno-stack-protector -no-pie -o chal chal.c

    # Stage 2: the image that runs; only this stage is kept
    FROM ubuntu:24.04
    RUN apt-get update && apt-get install -y --no-install-recommends socat \
        && rm -rf /var/lib/apt/lists/*
    WORKDIR /chal
    COPY --from=builder /build/chal /chal/chal
    RUN echo 'WH2027{example_flag}' > /chal/flag.txt \
        && chmod 555 /chal/chal && chmod 444 /chal/flag.txt
    RUN useradd -m -u 1001 ctf
    USER ctf
    EXPOSE 1337
    CMD ["socat", "-T60", "TCP-LISTEN:1337,reuseaddr,fork", "EXEC:stdbuf -i0 -o0 -e0 /chal/chal,pty,stderr,setsid,sane,rawer,echo=0"]
    ```

    `socat` waits for connections on port 1337 and starts a fresh copy of `/chal/chal` for each one, so players never share a running program. `-T60` closes a connection after 60 idle seconds.

=== "shared-web"

    ```dockerfile
    FROM python:3.12-slim
    WORKDIR /app
    COPY src/requirements.txt .
    RUN pip install --no-cache-dir -r requirements.txt
    COPY src/ .
    RUN useradd -m -u 1001 web && chown -R web /app
    USER web
    EXPOSE 8080
    CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "2", "app:app"]
    ```

    The program listens on 8080, so set `port_number` and `exposed_port_number` to `8080`. A normal user may not open ports below 1024 on every system; Docker on your computer allows it, so a mistake wouldn't show until the deploy.

Add a `.dockerignore` file next to the Dockerfile so your solution and notes stay out of the image:

```
solution/
README.md
.git
```

## Test it on your computer

Run these from inside your challenge folder. Replace `1337` with your `port_number`.

=== "shared-tcp"

    ```bash
    docker build -t mychal .
    docker run --rm -p 1337:1337 --memory 512m --cpus 0.5 mychal
    ```
    In a second terminal:
    ```bash
    nc localhost 1337
    ```

=== "shared-web"

    ```bash
    docker build -t mychal .
    docker run --rm -p 8080:8080 --memory 512m --cpus 0.5 mychal
    ```
    Open `http://localhost:8080` in a browser. In `-p 8080:8080`, the first number is the port on your computer and the second is `port_number`.

`--memory` and `--cpus` apply the cluster's limits, so problems show up now rather than during the CTF. Press Ctrl+C in the first terminal to stop the container.

**Check it worked:**

- [ ] The challenge answers, and your solve script gets the flag from it
- [ ] It accepts 20 connections at once: `for i in $(seq 20); do nc -z -w 2 localhost 1337 && echo ok & done; wait` prints `ok` 20 times
- [ ] `docker run --rm mychal id` prints a user other than `uid=0(root)`

## Shared by every player

All players use the same copies of your server. Ask yourself what happens when one player:

- **Changes stored data**, such as a profile or a database row. Other players see the change. Reset the data per session, or keep it per player.
- **Crashes the program.** For pwn, `socat` starts a fresh program for each connection, so a crash affects only that player. For web, the whole site restarts and everyone waits a few seconds.
- **Sends thousands of requests.** The cluster limits each address to 20 requests per second to a web challenge, and answers `503` beyond that. Design the intended solution to need fewer.
- **Logs in on one copy, then reaches another.** During a rush the infra team may run two copies of a web challenge, each with its own memory. Keep logins in a signed cookie, not only in the program's memory, or say in your README that the challenge must stay at one copy.

Write the answers in your README, so the infra team knows the limits.

**Next:** [Check it and hand it in](submit.md).
