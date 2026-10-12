# Sign in from the terminal

The AWS CLI needs to know who you are before it will change anything, so this page connects it to the everyday login you just created. AWS calls a saved set of login details a **profile**, and you'll create one named `wh`.

<figure class="diagram">
--8<-- "diagrams/sso-login.svg"
<figcaption>Signing in happens in the browser. The terminal receives keys that last 8 hours, and every <code>aws</code>, <code>terraform</code> and <code>pulumi</code> command uses them.</figcaption>
</figure>

1. Start the setup:
    ```bash
    aws configure sso --profile wh
    ```
2. Answer the questions it asks as follows:

    | Question | Answer |
    |---|---|
    | SSO session name | `wh` |
    | SSO start URL | The access portal URL from [Part 3 on the previous page](aws.md#part-3-create-your-everyday-login) |
    | SSO region | The region where you enabled Identity Center, which is `ap-southeast-1` (Singapore) or your account's only region |
    | SSO registration scopes | Press Enter to accept the default |

    "SSO" (single sign-on) is AWS's name for this kind of login.
3. A browser tab opens, where you sign in with your everyday login and click **Allow**. If no tab opens, which is common on Windows, the terminal prints a web address and a code instead. Open the address in any browser and enter the code there.
4. Back in the terminal, choose the club account and **AdministratorAccess**, and then answer the last two questions:

    | Question | Answer |
    |---|---|
    | Default client Region | The same region as above |
    | CLI default output format | `json` |

5. Make every new terminal window use this profile:
    ```bash
    echo 'export AWS_PROFILE=wh' >> ~/.bashrc
    export AWS_PROFILE=wh
    ```
    On macOS, use `~/.zshrc` instead of `~/.bashrc`.

## Accounts prepared through AWS Settings

If you followed [Prepare the account](prepare.md), you already sign in to AWS with an **AWS Builder ID**, so you can skip the steps above and use `aws login` instead. It opens the browser, you pick your project there, and the terminal receives its keys.

1. Sign in under a profile named `wh-login`:
    ```bash
    aws login --profile wh-login --region ap-southeast-1
    ```
    In the browser, choose your project under **Add session** or **Active sessions**.
2. Terraform and the club's Python scripts can't read the keys from `aws login` directly, so add a second profile named `wh` that hands the keys over to them:
    ```bash
    cat >> ~/.aws/config <<'EOF'

    [profile wh]
    region = ap-southeast-1
    credential_process = aws configure export-credentials --profile wh-login --format process
    EOF
    echo 'export AWS_PROFILE=wh' >> ~/.bashrc
    export AWS_PROFILE=wh
    ```
3. When a command later says that the session has expired, run step 1 again. The keys only last as long as your browser session for that project, so a session you signed in to 11 hours ago will expire within the hour. Before a long job such as a deploy or a teardown, sign out of the project in the browser, sign in again, and then run step 1.

!!! tip "If the browser page stops after you pick the project"
    `aws login` hands the keys back through an address on your own computer (`127.0.0.1`), which Chrome may block or ask you about. In that case, use the copy-and-paste version instead:
    ```bash
    aws login --profile wh-login --region ap-southeast-1 --remote
    ```
    It prints an address. Open the address, pick your project, click **Copy verification code**, and paste the code into the terminal.

## Check it worked

```bash
aws sts get-caller-identity
```

The output shows three fields. `Account` is a 12-digit number, which is the club's **account ID**, and `Arn` contains `AWSReservedSSO_AdministratorAccess`, or `AccountFullAccessRole` if you used `aws login`. Write down the account ID, because [Make it yours](../code/make-it-yours.md) needs it.

## Signing in again

The login lasts 8 hours. When a command says `Token has expired` or `The SSO session associated with this profile has expired`, sign in again with the command below, and then run the failed command again:

```bash
aws sso login
```

## If it fails

| Message | Fix |
|---|---|
| `Unable to locate credentials` | This terminal doesn't know about the profile. Run `export AWS_PROFILE=wh`. |
| `ForbiddenException: No access` | Your user isn't assigned to the account yet. Redo step 5 of [Part 3](aws.md#part-3-create-your-everyday-login). |
| The browser says the code is invalid | Codes expire after about 10 minutes, so run `aws sso login` to get a new one. |

**Next:** [Budget alert](budget.md).
