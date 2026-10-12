# Sign in from the CLI

<span class="time">⏱ 5 min</span>

From here on, almost everything happens in the terminal.

1. Run:
    ```bash
    aws configure sso --profile wh
    ```
2. Answer the prompts:

    | Prompt | Answer |
    |---|---|
    | SSO session name | `wh` |
    | SSO start URL | the access portal URL from the [previous page](aws.md#part-3-create-your-everyday-admin-user) |
    | SSO region | `ap-southeast-1` |
    | SSO registration scopes | press Enter (default) |

3. A browser tab opens. Sign in as your Identity Center user and click **Allow**. If no browser opens (common in WSL), copy the URL and code that the terminal prints into any browser
4. Back in the terminal, choose the account and **AdministratorAccess**. Then answer:

    | Prompt | Answer |
    |---|---|
    | Default client Region | `ap-southeast-1` |
    | CLI default output format | `json` |

5. Make `wh` the profile for every new terminal:
    ```bash
    echo 'export AWS_PROFILE=wh' >> ~/.bashrc     # macOS: ~/.zshrc
    export AWS_PROFILE=wh
    ```

## Check it worked

```bash
aws sts get-caller-identity
```

Expected: JSON with your 12-digit `"Account"` and an `"Arn"` containing `AWSReservedSSO_AdministratorAccess`. Write the account ID down; you need it in [Make it yours](../code/make-it-yours.md).

## Every day after this

Sessions expire after 8 hours. When a command says `Token has expired` or `The SSO session associated with this profile has expired`, run:

```bash
aws sso login
```

## If it fails

| Symptom | Fix |
|---|---|
| `Unable to locate credentials` | `AWS_PROFILE` isn't set in this terminal. Run `export AWS_PROFILE=wh` |
| `ForbiddenException: No access` after signing in | The permission set isn't assigned to your user yet. Redo step 5 of [Part 3](aws.md#part-3-create-your-everyday-admin-user) |
| Browser says the code is invalid | Codes expire after about 10 minutes. Rerun `aws sso login` |

**Next:** [Set a budget alert](budget.md).
