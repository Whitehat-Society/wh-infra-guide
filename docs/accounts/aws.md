# AWS account

<span class="time">⏱ ~30 min</span>

These steps only work in a web browser. Each part has a screen recording, with the same steps written out underneath it.

You need: an email address the club controls (not your personal one; e.g. `infra@<club-domain>` or a shared Gmail), a credit or debit card, and a phone that can receive SMS.

!!! danger "The root user is the master key"
    The email and password you sign up with become the **root user**, which can do anything, including closing the account. After part 3 you won't use it for daily work. Store the password in the club's password manager, not in chat.

## Part 1 · Sign up

--8<-- "rec-pending.md"

1. Open <https://signin.aws.amazon.com/signup?request_type=register>
2. Enter the **root email** and an **account name** like `whitehacks-2027`, then click **Verify email address**
3. Type the code from the email, then set a strong root password
4. Pick the **Paid plan**. *Why:* the Free plan can block services this stack needs and closes the account after 6 months. You still get the sign-up credits, and the [budget alert](budget.md) protects you from surprise bills
5. **Contact information:** choose *Personal*, and fill in your name, phone and address
6. **Billing:** enter the card. AWS may place a ~US$1 temporary hold to check it
7. **Identity check:** choose SMS, enter the code you receive
8. **Support plan:** choose **Basic support – Free**, then **Complete sign up**

**Check it worked:** within a few minutes you get an email titled *Welcome to Amazon Web Services*. Some services can take up to 24 h to activate. If later commands say `SubscriptionRequiredException` or `OptInRequired`, wait and retry.

## Part 2 · Protect the root user with MFA

<span class="time">⏱ 5 min</span>

MFA (multi-factor authentication) means a stolen password isn't enough to get in.

--8<-- "rec-pending.md"

1. Sign in at <https://console.aws.amazon.com/> as **Root user** with the root email and password
2. Click the account name (top right) → **Security credentials**
3. Under **Multi-factor authentication (MFA)** click **Assign MFA device**
4. Name it `root-<your-name>`. Choose **Passkey or security key**, or **Authenticator app** if you'd rather use the Google/Microsoft Authenticator app on a phone
5. Follow the prompts. For an authenticator app: scan the QR code, then type two codes in a row

**Check it worked:** the MFA table shows one device. Sign out and back in: you're asked for the second factor.

## Part 3 · Create your everyday admin user

<span class="time">⏱ 10 min</span>

You'll create a separate login with **IAM Identity Center**, so the CLI never needs root keys. The CLI then gets short-lived credentials that expire on their own.

--8<-- "rec-pending.md"

1. Still signed in as root, check that the region selector (top right) says **Asia Pacific (Singapore) ap-southeast-1**
2. Search **IAM Identity Center** in the top bar and open it → **Enable**. If it asks, choose **Enable with AWS Organizations**
3. Left menu → **Users** → **Add user**. Username: your first name. Email: **your own** email. Click through to **Add user**
4. Left menu → **Permission sets** → **Create permission set** → **Predefined** → **AdministratorAccess** → set **Session duration** to **8 hours** → **Create**
5. Left menu → **AWS accounts** → tick your account → **Assign users or groups** → **Users** tab → tick your user → **Next** → tick **AdministratorAccess** → **Submit**
6. Left menu → **Settings** → copy the **AWS access portal URL** (looks like `https://d-xxxxxxxxxx.awsapps.com/start`). You need it on the next page
7. Open the invitation email sent to your own address → **Accept invitation** → set a password → set up MFA when asked

**Check it worked:** open the access portal URL and sign in as your new user. You see the account with **AdministratorAccess** under it.

!!! tip "Adding more team members later"
    Repeat steps 3 and 5 for each person. Everyone gets their own login and can be removed without changing anyone else's password.

**Next:** [Sign in from the CLI](cli-login.md).
