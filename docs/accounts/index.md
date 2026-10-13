# Accounts: overview

## The goal

By the end of this section, the club has everything that has to exist before any code can run. That is part 1 of the chain described in [The AWS account and the domain](../concepts/account.md):

1. An AWS account with its master login locked away, and an everyday login that your terminal can use.
2. An email that warns you before spending gets out of hand.
3. A domain name whose DNS records are kept in Route 53.
4. Two Discord webhooks for announcements and alerts, and access to the club's code on GitHub.

Signing up, protecting the root user, creating your everyday login and creating the webhooks all happen in a web browser, because AWS and Discord offer no other way. Each of those steps has a screen recording, and the rest of the section uses the terminal.

## The order

| Page | What you'll have afterwards | Why it comes here |
|---|---|---|
| [AWS account](aws.md) | The account, MFA on the root user, and your everyday login. | Everything else is created inside this account. |
| [Prepare the account](prepare.md) | A Paid-plan account that can use Singapore. You only need this page for a Free-plan account. | The deploy fails on a Free-plan account. |
| [Sign in from the terminal](cli-login.md) | `aws` commands that act as your everyday login. | The remaining pages use the terminal. |
| [Budget alert](budget.md) | An email when spending passes half your monthly limit. | It has to exist before anything starts costing money. |
| [Domain name](domain.md) | A Route 53 hosted zone that answers for your domain. | Section 4 needs the hosted zone's ID, and DNS changes take hours to spread, so start early. |
| [Discord and GitHub](discord-github.md) | Two webhook addresses, and access to the `wh-2026` repository. | Section 4 stores the webhooks as secrets and downloads the code. |

You're done with this section when `aws sts get-caller-identity` prints your account and `dig +short NS <your-domain>` prints four Route 53 name servers.

**Next:** [AWS account](aws.md).
