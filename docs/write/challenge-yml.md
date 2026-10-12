# challenge.yml

`challenge.yml` is a **YAML** file: plain text where each line is `field: value`, and indented lines belong to the field above them. Indent with spaces, never tabs. Put quotes around any value containing `:`, `#`, `{` or a leading `*`.

Copy the template for your type, then change the values.

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
| `name` | Yes | The title players see. It must differ from every other challenge's name. See [Choosing the name](#choosing-the-name) |
| `author` | Yes | Your name, shown to the infra team |
| `category` | Yes | The heading CTFd lists the challenge under, e.g. `Web`, `Pwn`, `Crypto`. Use the same spelling as the other challenges in your folder's category |
| `description` | Yes | The text players read. It may use Markdown, e.g. `**bold**` and `[a link](https://…)`. Start it with `|` on the first line, as in the templates, to write several lines |
| `attribution` | No | A credit line shown under the description |
| `value`, `type`, `extra` | Yes | Scoring. Keep the template's values: every challenge starts at 1000 points and loses value as more teams solve it, down to 100 after 31 solves. This is CTFd's **dynamic** scoring |
| `challenge_type` | Yes | `text`, `shared-web` or `shared-tcp`; see [Pick a type](index.md#pick-a-type) |
| `port_number` | Web and pwn | The port your program listens on inside the container |
| `exposed_port_number` | Web and pwn | Set it to the same number as `port_number` |
| `protocol` | Web and pwn | `http` for `shared-web`, `tcp` for `shared-tcp`. Use `http` even though players see `https`: the cluster adds the encryption |
| `flags` | Yes | One or more accepted answers; see [Flags](#flags) |
| `files` | No | Files players download, as paths inside your folder |
| `hints` | No | A plain string is a free hint. `{content: "…", cost: 10}` costs the team 10 points to open |
| `requirements` | No | Names of challenges a team must solve before this one appears |
| `tags` | No | Short public labels, e.g. `beginner` |
| `state` | Yes | Always `hidden`. The infra team makes challenges visible when the CTF starts |
| `version` | Yes | Always `"0.1"`, the version of this file format |

Leave out `connection_info`, `image`, `host` and `healthcheck`. The deploy tools fill in the address themselves and don't use the others.

### Choosing the name

- CTFd finds an existing challenge by its name. **Renaming a challenge after it is deployed creates a second copy**, and the old one keeps its solves. To rename one that is already deployed, ask the infra team; they follow [Rename a challenge](../operate/change.md#rename-a-challenge).
- For `shared-web` and `shared-tcp`, the name also becomes the challenge's address. Capitals become lowercase, and every run of characters other than letters and digits becomes one hyphen. `Xoph, Dark Embers` becomes `xoph-dark-embers`, so players open `https://xoph-dark-embers.challenges.<domain>`. Two names that give the same address, such as `Base64 Converter` and `base64-converter`, clash.
- Keep it under 50 characters.

### Flags

The flag format is `WH<year>{...}`, e.g. `WH2027{...}`. Use only letters, digits and `_` inside the braces, so players can't mistype it.

```yaml
flags:
  - WH2027{exact_match}                                            # must match exactly, capitals included
  - {type: static, content: "WH2027{any_case}", data: case_insensitive}
  - {type: regex,  content: "WH2027\\{team_[0-9]+\\}", data: case_insensitive}
```

A **regex** flag accepts any answer matching a pattern. Use it only when the answer really varies, and test the pattern before you hand it in.

## What the build changes in your file

`make build-images` writes into `challenge.yml` for `shared-web` and `shared-tcp` challenges: it adds or replaces the `connection_info:` line with the real address. Expect this line to change after each deploy, and don't edit it by hand.

**Next:** [Write the Dockerfile and test it](server.md), or for a `text` challenge, [check it and hand it in](submit.md).
