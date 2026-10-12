# Sign in from the terminal

The AWS CLI needs to know who you are before it will change anything. This page connects it to the everyday login you just created. AWS calls a saved set of login details a **profile**; you'll create one named `wh`.

<figure class="diagram">
--8<-- "diagrams/sso-login.svg"
<figcaption>Signing in happens in the browser. The terminal receives keys that last 8 hours, and every <code>aws</code>, <code>terraform</code> and <code>pulumi</code> command uses them.</figcaption>
</figure>

1. Start the setup:
    ```bash
    aws configure sso --profile wh
    ```
2. Answer the questions:

    | Question | Answer |
    |---|---|
    | SSO session name | `wh` |
    | SSO start URL | the access portal URL from [Part 3 on the previous page](aws.md#part-3-create-your-everyday-login) |
    | SSO region | the region where you enabled Identity Center: `ap-southeast-1` (Singapore), or your account's only region |
    | SSO registration scopes | press Enter to accept the default |

    "SSO" (single sign-on) is AWS's name for this kind of login.
3. A browser tab opens. Sign in with your everyday login and click **Allow**. If no tab opens, which is common on Windows, the terminal prints a web address and a code. Open the address in any browser and enter the code.
4. Back in the terminal, choose the club account and **AdministratorAccess**. Then answer:

    | Question | Answer |
    |---|---|
    | Default client Region | the same region |
    | CLI default output format | `json` |

5. Make every new terminal use this profile:
    ```bash
    echo 'export AWS_PROFILE=wh' >> ~/.bashrc
    export AWS_PROFILE=wh
    ```
    On macOS, use `~/.zshrc` instead of `~/.bashrc`.

## Check it worked

```bash
aws sts get-caller-identity
```

The output shows three fields. `Account` is a 12-digit number: the club's **account ID**. `Arn` contains `AWSReservedSSO_AdministratorAccess`. Note the account ID; [Make it yours](../code/make-it-yours.md) uses it.

## Signing in again

The login lasts 8 hours. When a command says `Token has expired` or `The SSO session associated with this profile has expired`, sign in again and rerun the command:

```bash
aws sso login
```

## If it fails

| Message | Fix |
|---|---|
| `Unable to locate credentials` | This terminal doesn't know the profile. Run `export AWS_PROFILE=wh` |
| `ForbiddenException: No access` | Your user isn't assigned to the account yet. Redo step 5 of [Part 3](aws.md#part-3-create-your-everyday-login) |
| The browser says the code is invalid | Codes expire after about 10 minutes. Run `aws sso login` for a new one |

**Next:** [Budget alert](budget.md).
