# Hand it in

Run these checks before you hand the challenge to the infra team. Each one catches a problem that would otherwise only surface during the deploy, which is often late at night.

## Checklist

- [ ] The folder sits directly inside a category folder, and its name uses only lowercase letters, digits and hyphens.
- [ ] `challenge.yml` follows the [template for its type](challenge-yml.md#templates), with `state: hidden`.
- [ ] The validator described below accepts it.
- [ ] Every file under `files:` exists and contains nothing that gives the answer away.
- [ ] A `shared-web` or `shared-tcp` challenge builds and runs with the [test commands](server.md#test-it-on-your-computer), and your solve script gets the flag from the running container.
- [ ] The solution is in `solution/`, and `.dockerignore` keeps it out of the image.
- [ ] `README.md` says what the challenge teaches, how to solve it, and anything the infra team needs to know, such as "must stay at one copy".

## Validate

Run the validator from the top of the repository:

```bash
python3 utils/validate_challenges.py
```

It should end with `validate_challenges: OK (N challenges checked)`. Each `ERROR:` line names a folder and the field you need to fix. `WARNING:` lines don't block the deploy, but you should still read them.

If it stops with `No module named 'yaml'`, install the one library it needs with `python3 -m pip install pyyaml`, and run it again.

If the command fails with `yaml.scanner.ScannerError` or `yaml.parser.ParserError`, your `challenge.yml` isn't valid YAML, and the message gives the line number. The usual causes are a tab where there should be spaces, or a `:` inside a value without quotes, which you fix by putting the value in quotes.

## Hand it in

1. Create a branch, commit only your folder, and push it:
    ```bash
    git switch -c chal/<category>-<folder>
    git add <category>/<folder>
    git commit -m "chal(<category>): add <folder>"
    git push -u origin chal/<category>-<folder>
    ```
2. Open a pull request on GitHub, and wait for the repository's checks to pass. They run the validator on every challenge, build every Dockerfile, and check that each image runs as a normal user rather than `root`. They don't run your solve script, so your own test is still the only proof that the challenge can be solved.
3. Tell the infra team the challenge's name and type in the tech and infra channel.

The infra team then deploys it with the steps in [Add a challenge](../operate/change.md#add-a-challenge).

## After the challenge is deployed

Send every change through the infra team, even a small one. They apply it with [Change a challenge](../operate/change.md), which also clears the old copies, so tell them which kind of change it is:

| You changed | They run |
|---|---|
| Description, flag, hint, attached file | `ctf challenge sync` |
| Server code or Dockerfile | `make build-images` |
| The challenge's name | The rename steps, because editing `name:` alone creates a second copy |
