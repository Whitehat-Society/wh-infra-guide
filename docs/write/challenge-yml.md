# challenge.yml

`challenge.yml` is a **YAML** file, which is plain text where each line reads `field: value` and indented lines belong to the field above them. Always indent with spaces rather than tabs, and put quotes around any value that contains `:`, `#` or `{`, or that starts with `*`.

The easiest way to start is to copy the template folder for your type, as [Start from a template](index.md#start-from-a-template) describes, and change its values. The templates below show the same fields.

## Templates

=== "text"

    ```yaml
    name: "Lost XOR Password"
    author: "Your Name"
    category: Crypto
    description: |
      I encrypted my password with XOR and lost the key.
      All I have is the file below.
    attribution: Written by Your Name
    value: 1000
    type: dynamic
    extra:
      initial: 1000
      decay: 31
      minimum: 100
    challenge_type: text

    flags:
      - WH2027{x0r_1s_n0t_3ncrypt10n}

    files:
      - dist/ciphertext.txt

    hints:
      - XOR with the same byte twice gives back what you started with.
      - {content: "The key is one byte long.", cost: 10}

    state: hidden
    version: "0.1"
    ```

=== "shared-web"

    ```yaml
    name: "inspectpost"
    author: "Your Name"
    category: Web
    description: |
      I'm building a blog. Look around, but don't do anything bad.
    attribution: Written by Your Name
    value: 1000
    type: dynamic
    extra:
      initial: 1000
      decay: 31
      minimum: 100
    challenge_type: shared-web
    port_number: 80
    exposed_port_number: 80
    protocol: http

    flags:
      - WH2027{d0nt_trust_th3_fr0nt3nd}

    state: hidden
    version: "0.1"
    ```

=== "shared-tcp"

    ```yaml
    name: "Xoph, Dark Embers"
    author: "Your Name"
    category: Pwn
    description: |
      Connect and see what the program does. The binary is attached.
    attribution: Written by Your Name
    value: 1000
    type: dynamic
    extra:
      initial: 1000
      decay: 31
      minimum: 100
    challenge_type: shared-tcp
    port_number: 1337
    exposed_port_number: 1337
    protocol: tcp

    flags:
      - WH2027{b0f_1s_b4ck}

    files:
      - public/xoph

    state: hidden
    version: "0.1"
    ```

## Fields

| Field | Required | What it means |
|---|---|---|
| `name` | Yes | The title players see, which has to differ from every other challenge's name. See [Choosing the name](#choosing-the-name). |
| `author` | Yes | Your name, which the infra team sees. |
| `category` | Yes | The heading CTFd lists the challenge under, such as `Web`, `Pwn` or `Crypto`. Use the same spelling as the other challenges in your folder's category. |
| `description` | Yes | The text players read. It may use Markdown, such as `**bold**` and `[a link](https://…)`. To write several lines, start it with `|` on the first line, as the templates do. |
| `attribution` | No | A credit line shown under the description. |
| `value`, `type`, `extra` | Yes | The scoring. Keep the template's values, under which every challenge starts at 1000 points and loses value as more teams solve it, down to 100 after 31 solves. CTFd calls this **dynamic** scoring. |
| `challenge_type` | Yes | `text`, `shared-web` or `shared-tcp`, as described in [Pick a type](index.md#pick-a-type). |
| `port_number` | Web and pwn | The port your program listens on inside the container. |
| `exposed_port_number` | Web and pwn | The same number as `port_number`. |
| `protocol` | Web and pwn | `http` for `shared-web` and `tcp` for `shared-tcp`. Use `http` even though players see `https`, because the cluster adds the encryption. |
| `flags` | Yes | One or more accepted answers, as described in [Flags](#flags). |
| `files` | No | The files players download, given as paths inside your folder. |
| `hints` | No | A plain string is a free hint, while `{content: "…", cost: 10}` costs the team 10 points to open. |
| `requirements` | No | The names of challenges a team has to solve before this one appears. |
| `tags` | No | Short public labels, such as `beginner`. |
| `state` | Yes | Always `hidden`, because the infra team makes challenges visible when the CTF starts. |
| `version` | Yes | Always `"0.1"`, which is the version of this file format. |

Leave out `connection_info`, `image`, `host` and `healthcheck`. The deploy tools fill in the address themselves and don't use the other three fields.

### Choosing the name

CTFd finds an existing challenge by its name, so **renaming a challenge after it is deployed creates a second copy**, and the old copy keeps its solves. If you need to rename a challenge that is already deployed, ask the infra team, who will follow [Rename a challenge](../operate/change.md#rename-a-challenge).

For `shared-web` and `shared-tcp` challenges, the name also becomes the challenge's address. Capitals become lowercase, and every run of characters other than letters and digits becomes a single hyphen. `Xoph, Dark Embers` therefore becomes `xoph-dark-embers`, and players open `https://xoph-dark-embers.challenges.<domain>`. Two names that give the same address, such as `Base64 Converter` and `base64-converter`, clash with each other.

For these two types, the address must start with a letter and be under 50 characters, so `1337 Login` and `!!!` are refused by `make validate`.

### Flags

The flag format is `WH<year>{...}`, for example `WH2027{...}`. Use only letters, digits and `_` inside the braces, so that players can't mistype the flag.

```yaml
flags:
  - WH2027{exact_match}                                            # must match exactly, capitals included
  - {type: static, content: "WH2027{any_case}", data: case_insensitive}
  - {type: regex,  content: "WH2027\\{team_[0-9]+\\}", data: case_insensitive}
```

A **regex** flag accepts any answer that matches a pattern. Only use one when the answer really does vary, and test the pattern before you hand the challenge in.

## What the build changes in your file

For `shared-web` and `shared-tcp` challenges, `make build-images` writes into `challenge.yml` by adding or replacing the `connection_info:` line with the real address. Expect this line to change after each deploy, and don't edit it by hand.

**Next:** [Write the Dockerfile and test it](server.md), or for a `text` challenge, [check it and hand it in](submit.md).
