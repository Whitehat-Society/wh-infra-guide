# Code and settings: overview

## The goal

By the end of this section, you'll have the club's code on your computer, set up for your event. The files in the repository describe the whole system, as [What we're building](../concepts/big-picture.md#three-ways-a-part-is-defined) explains, but they still name last year's account and domain. This section points them at yours and stores your passwords where every tool can read them.

## The order

| Page | What you'll have afterwards | Why it comes here |
|---|---|---|
| [Get the code](clone.md) | The `wh-2026` and `CTFd` folders, side by side in `~/wh/`. | There is nothing to change until the files are on your computer. |
| [Make it yours](make-it-yours.md) | Every file names your AWS account, domain, event name and region. | The settings files on the next page are copied from these files. |
| [Settings and secrets](config.md) | Three settings files with your event's details, and your passwords stored in AWS Secrets Manager. | The deploy reads both, and it fails on the first missing value. |

You're done with this section when the check at the bottom of [Settings and secrets](config.md#check-it-worked) counts every secret and confirms that git ignores the settings files. Nothing so far costs money, and section 5 is where billing starts.

**Next:** [Get the code](clone.md).
