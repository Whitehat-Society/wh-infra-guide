# Code and settings: overview

## The goal

By the end of this section, you'll have your own copy of `wh-base` on your computer, set up for your event. The files in it describe the whole system, as [What we're building](../concepts/big-picture.md#three-ways-a-part-is-defined) explains, and they name no particular event. Everything that makes the deploy yours, such as the event's name and domain, lives in one settings file, and the passwords live in AWS Secrets Manager.

## The order

| Page | What you'll have afterwards | Why it comes here |
|---|---|---|
| [Get the code](clone.md) | A folder such as `~/wh/wh-2027`, copied from `wh-base`, and the event's own repository on GitHub. | There is nothing to fill in until the files are on your computer. |
| [Your settings](make-it-yours.md) | `utils/eks/terraform.tfvars.json` filled in, and git told to keep it on your computer. | Every later command works out its names from this file. |
| [Secrets](config.md) | The event's passwords stored in AWS Secrets Manager. | The deploy reads them, and it stops at the first missing one. |

You're done with this section when the check at the bottom of [Secrets](config.md#check-it-worked) lists all nine secrets. Apart from the secret itself, at US$0.40 a month, nothing so far costs money, and section 5 is where billing starts.

**Next:** [Get the code](clone.md).
