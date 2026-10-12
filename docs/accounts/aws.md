# AWS account

This page creates the club's AWS account, locks down its master login, and gives you an everyday login. All three parts happen in a web browser, so each has a screen recording followed by the same steps in writing.

You need:

- **An email address the club controls**, such as `infra@<club-domain>` or a shared Gmail. Don't use a personal address: the account must outlive your time on the committee.
- **A credit or debit card.** AWS bills it monthly.
- **A phone that can receive text messages**, for identity checks.

!!! danger "The root user can do anything"
    The email and password you sign up with become the account's **root user**. It can spend money, delete everything and close the account. After part 3 you won't use it day to day. Keep its password in the club's password manager, never in chat.

## Part 1: Sign up

--8<-- "rec-pending.md"

1. Open <https://signin.aws.amazon.com/signup?request_type=register>.
2. Enter the club email and an account name, such as `whitehacks-2027`. Click **Verify email address**.
3. Enter the code AWS emails you, then choose a strong password.
4. Choose the **Paid plan**. The Free plan can block services this system needs, and it closes the account after six months. You still receive the sign-up credits.
5. Under **Contact information**, choose **Personal** and fill in your name, phone number and address.
6. Enter the card. AWS may place a temporary hold of about US$1 to check it.
7. Choose **Text message (SMS)** and enter the code you receive.
8. Choose **Basic support – Free**, then **Complete sign up**.

**Check it worked:** within a few minutes you receive an email titled *Welcome to Amazon Web Services*. Some services take up to a day to switch on. If a later command fails with `SubscriptionRequiredException` or `OptInRequired`, wait an hour and retry.

## Which kind of account you have

AWS now creates some new accounts as a **Free-plan project**: an account that AWS manages for you inside its own small organisation. This guide was tested on one. It works, with four limits:

| Limit | Effect on this guide | What to do |
|---|---|---|
| **One region only**, chosen by AWS | Commands in any other region fail with `explicit deny in a service control policy` | Use that region everywhere. [Make it yours](../code/make-it-yours.md) has a step for it |
| **Only "Free Tier eligible" computer sizes** | The cluster's computers never start: `The specified instance type is not eligible for Free Tier` | In [Settings and secrets](../code/config.md), set `node_instance_type` to `c7i-flex.large`, which has the same 2 cores and 4 GB as `t3.medium` |
| **No domain purchases** in Route 53 | [Domain name](domain.md) Option A fails | Use Option B, with a domain from another registrar |
| **Ends after six months**, or when the credits run out | The account stops working | Fine for a test. For the real event, upgrade to the Paid plan |

To check, open the console. A Free-plan project shows **Manage projects** and **Upgrade plan**:

<figure class="shot" markdown>
![AWS console home of a Free-plan project](../assets/shots/accounts/free-plan-console.webp)
<figcaption>(1) Manage projects opens AWS Settings. (2) Upgrade plan switches to the Paid plan. The box shows the credits left.</figcaption>
</figure>

**Manage projects** shows the account's region:

<figure class="shot" markdown>
![AWS Settings projects page showing the free plan, credits and the single region](../assets/shots/accounts/free-plan-projects.webp)
<figcaption>(1) Days and credits left on the Free plan. (2) The only region this account may use. (3) Activating advanced features lifts the region limit, but it can't be undone and requires the Paid plan first.</figcaption>
</figure>

Find your region from the terminal too, once you have [signed in](cli-login.md): `aws configure get region`.

## Part 2: Protect the root user with a second factor

A second factor means a stolen password alone can't open the account. You'll use a phone app or a security key alongside the password.

--8<-- "rec-pending.md"

1. Sign in at <https://console.aws.amazon.com/>. Choose **Root user** and enter the club email and password.
2. Click the account name at the top right, then **Security credentials**.
3. Under **Multi-factor authentication (MFA)**, click **Assign MFA device**.
4. Name the device, e.g. `root-alex`. Choose **Authenticator app** to use an app such as Google Authenticator or Microsoft Authenticator, or **Passkey or security key** if you have one.
5. For an app: scan the QR code with it, then type two codes from the app in a row.

**Check it worked:** the MFA table lists one device. Sign out and sign in again: AWS now asks for a code after the password.

## Part 3: Create your everyday login

You'll create a personal login through **IAM Identity Center**, the AWS service that manages people's logins. It gives the terminal temporary passwords that expire after a few hours, so a leaked one stops working by itself.

--8<-- "rec-pending.md"

1. Still signed in as root, check the region name at the top right. It must say **Asia Pacific (Singapore)**, or on a Free-plan project, the region shown in AWS Settings. If not, click it and choose that region.
2. Type **IAM Identity Center** in the search bar at the top, open it, and click **Enable**. If asked, choose **Enable with AWS Organizations**.
3. In the left menu, click **Users**, then **Add user**. Use your first name as the username and your own email address. Click through to **Add user**.
4. In the left menu, click **Permission sets**, then **Create permission set**. Choose **Predefined permission set → AdministratorAccess**. Set **Session duration** to **8 hours** and click **Create**. A *permission set* is a named list of things a user may do. AdministratorAccess allows everything except closing the account.
5. In the left menu, click **AWS accounts**. Tick the club account, click **Assign users or groups**, open the **Users** tab, tick your user and click **Next**. Tick **AdministratorAccess** and click **Submit**.
6. In the left menu, click **Settings** and copy the **AWS access portal URL**. It looks like `https://d-xxxxxxxxxx.awsapps.com/start`. You need it on the next page.
7. Open the invitation email in your own inbox, click **Accept invitation**, choose a password, and set up a second factor when asked.

**Check it worked:** open the access portal URL and sign in with your new login. The page lists the club account with **AdministratorAccess** under it.

!!! tip "Adding teammates"
    Repeat steps 3 and 5 for each person. Everyone gets their own login, and removing one person doesn't affect anyone else.

**Next:** [Sign in from the terminal](cli-login.md).
