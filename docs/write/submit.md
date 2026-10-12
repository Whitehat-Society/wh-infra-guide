# Hand it in

Run these checks before you hand the challenge to the infra team. Each one catches a problem that would otherwise surface during deploy, often late at night.

## Checklist

- [ ] The folder is directly inside a category folder, and its name uses only lowercase letters, digits and hyphens
- [ ] `challenge.yml` follows the [template for its type](challenge-yml.md#templates), with `state: hidden`
- [ ] The validator accepts it (below)
- [ ] Every file under `files:` exists, and contains nothing that gives the answer away
- [ ] For `shared-web` and `shared-tcp`: it builds and runs with the [test commands](server.md#test-it-on-your-computer), and your solve script gets the flag from the running container
- [ ] The solution is in `solution/`, and `.dockerignore` keeps it out of the image
- [ ] `README.md` says what the challenge teaches, how to solve it, and anything the infra team must know, e.g. "must stay at one copy"

## Validate

From the top of the repository:

```bash
python3 utils/validate_challenges.py
```

It ends with `validate_challenges: OK (N challenges checked)`. Each `ERROR:` line names a folder and the field to fix. `WARNING:` lines don't block the deploy, but read them.

If the command fails with `yaml.scanner.ScannerError` or `yaml.parser.ParserError`, your `challenge.yml` isn't valid YAML. The message gives the line number. The usual causes are a tab instead of spaces, or a `:` inside an unquoted value; put the value in quotes.

## Hand it in

1. Create a branch, commit only your folder, and push:
    ```bash
    git switch -c chal/<category>-<folder>
    git add <category>/<folder>
    git commit -m "chal(<category>): add <folder>"
    git push -u origin chal/<category>-<folder>
    ```
2. Open a pull request on GitHub. The repository's checks run the validator on every challenge; wait for them to pass. They don't build your Dockerfile (only `filelocker`'s), so your own test above is the only one before deploy.
3. Tell the infra team the challenge's name and type in the tech and infra channel.

The infra team deploys it with the steps in [Add a challenge](../operate/change.md#add-a-challenge).

## After the challenge is deployed

Send every change through the infra team, even small ones. They apply it with [Change a challenge](../operate/change.md), which also clears the old copies. Tell them which kind of change it is:

| You changed | They run |
|---|---|
| Description, flag, hint, attached file | `ctf challenge sync` |
| Server code or Dockerfile | `make build-images` |
| The challenge's name | The rename steps; never edit `name:` alone |
