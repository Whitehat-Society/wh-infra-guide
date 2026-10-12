# Prepare the account

If your account is a normal Paid-plan account, you can skip this page, and [Which kind of account you have](aws.md#which-kind-of-account-you-have) shows how to tell. A **Free-plan project**, on the other hand, can't run this system until you change three things in the browser.

| Change | Why the deploy needs it |
|---|---|
| 1. Upgrade to the Paid plan | The Free plan only starts small "Free Tier" computers, and it can't buy domains. |
| 2. Activate advanced features | Until you do, AWS's own rules block other regions, and they also block the permission setup the cluster uses, which is called an *OIDC provider*. |
| 3. Allow Singapore in the region rule | Even after activation, the rule still lists only the account's first region. |

After step 2, your account sits inside an **AWS organization**, which is a group of accounts with one account in charge of the others.

<figure class="diagram">
--8<-- "diagrams/org.svg"
<figcaption>Activation creates the management and identity accounts. The project account is the one you already had, and the CTF runs in it. A <b>service control policy (SCP)</b> is a rule that the management account sets on the other accounts.</figcaption>
</figure>

!!! danger "Step 2 can't be undone"
    Activation hands you full control of the organization and removes the Free plan's spend limits. From then on, only your [budget alert](budget.md) warns you about the bill, so set it up on the same day.

## 1. Upgrade to the Paid plan

1. Sign in to the [AWS console](https://console.aws.amazon.com/).
2. On **Console Home**, click **Upgrade plan**, which is box 2 in the [screenshot on the previous page](aws.md#which-kind-of-account-you-have).
3. Read the summary and confirm. From now on AWS charges the card you entered at sign-up, and you keep your sign-up credits.

**Check it worked:** AWS emails *Your AWS account plan has been upgraded*, and **Manage projects** shows **Current charges** and **Available credits** instead of *Days remaining in free plan*.

If you need to add or change the card later, open **Billing and Cost Management → Payment preferences** in the management account:

<figure class="shot" markdown>
![Payment preferences page with the Add payment method button](../assets/shots/accounts/payment-methods.webp)
<figcaption>(1) Add payment method. The blurred areas hold the card, billing address and phone number.</figcaption>
</figure>

## 2. Activate advanced features

1. Click **Manage projects** on Console Home, which opens AWS Settings.
2. Scroll down to **Activate advanced features** and click **Continue to activation**.
3. Fill in the form as shown below.

    <figure class="shot" markdown>
    ![The activation form](../assets/shots/accounts/activate-form.webp)
    <figcaption>(1) A team name, such as <code>whitehats-infra</code>, which teammates see when they sign in. (2) Keep <b>Use my AWS Builder ID email</b>, and click <b>Send verification code</b>. (3) The six-digit code from the email titled <i>Verify the new email address for the AWS account root user</i>. (4) Review and complete activation.</figcaption>
    </figure>

4. Type `Confirm activation` and click **Activate**.

    <figure class="shot" markdown>
    ![The confirmation dialog](../assets/shots/accounts/activate-confirm.webp){ width="452" }
    <figcaption>(5) Type the two words exactly. (6) Activate.</figcaption>
    </figure>

5. Keep the page open while activation runs. It takes up to 5 minutes, and then a green banner appears.

    <figure class="shot" markdown>
    ![Activation complete, listing the new accounts](../assets/shots/accounts/activate-done.webp)
    <figcaption>The project list now shows your project and a new <i>Identity Delegated Admin</i> account, with the management account listed below them. (7) Manage this organization leads to the next step.</figcaption>
    </figure>

## 3. Allow Singapore

1. Click **Manage this organization** and then **AWS Organizations**, which opens the console of the management account.
2. In the left menu, click **Policies** and then **Service control policies**.

    <figure class="shot" markdown>
    ![List of service control policies](../assets/shots/accounts/scp-list.webp)
    <figcaption>(1) The region rule. Leave the other policies alone, because <code>ManagedAccountSecurityControlPolicy</code> only protects AWS's own management roles, and the <code>BudgetsSpendLimit…</code> policies only act when a spend limit is set.</figcaption>
    </figure>

3. Open **AdvancedModeRegionRestrictionSecurityControlPolicy** and click **Edit policy**.
4. Scroll to the end of the text and find the list after `"aws:RequestedRegion"` in the statement `"RegionFloor"`. Add `"ap-southeast-1",` as the first entry in that list.

    <figure class="shot" markdown>
    ![The end of the region policy, with ap-southeast-1 added](../assets/shots/accounts/scp-region-list.webp){ width="560" }
    <figcaption>(3) The added line. Every region in this list is allowed. The editor reports one error about <code>builderid:*</code>, but it comes from AWS's own text and saving still works.</figcaption>
    </figure>

5. Click **Save changes**, and a green banner says *Successfully updated the policy*.

## Check it worked

Once you have [signed in from the terminal](cli-login.md), run:

```bash
aws ec2 describe-availability-zones --region ap-southeast-1 --query 'AvailabilityZones[].ZoneName' --output text
```

It should print three zone names such as `ap-southeast-1a`. If it prints an `explicit deny in a service control policy` error instead, step 3 didn't save.

## If it fails

| Problem | Fix |
|---|---|
| The activation page says *You must upgrade your account before you can activate advanced features* | Do step 1 first. |
| The verification email doesn't arrive | Wait 5 minutes and check your spam folder, then click **Resend code**. |
| Commands still get `explicit deny in a service control policy` after step 3 | Read the policy name in the error. If it isn't the region rule, open that policy and ask the infra lead before you change it. |

**Next:** [Sign in from the terminal](cli-login.md).
