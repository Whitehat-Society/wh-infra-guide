# Delete everything

## The goal

When you finish this page, the only charges left are for the few things that stay on purpose, mainly the domain and its hosted zone, which cost about US$0.50 a month plus the domain's yearly fee. [What stays, on purpose](#what-stays-on-purpose) lists them. AWS keeps billing for the system until it no longer exists, so delete it the day after the event, or whenever it will sit unused for more than a day. The domain and its hosted zone stay, so rebuilding the system later with [Deploy](deploy/index.md) takes about 1.5 hours.

!!! danger "This can't be undone"
    Deleting the system deletes the database, every uploaded file and every challenge image, so make sure you keep the final backup in step 2.

## Why the order matters

<figure class="diagram">
--8<-- "diagrams/teardown.svg"
<figcaption>The helper programs in the cluster created the challenges' load balancers, DNS records and disks, so Terraform doesn't know about them. Deleting the Pulumi stacks first makes the helpers clean those up while they are still running.</figcaption>
</figure>

## Steps

1. **Sign in again**, even if you're still signed in, so that your login lasts for the whole teardown. [Signing in again](accounts/cli-login.md#signing-in-again) shows how.
2. **Keep the final backup** by following [Keep a copy after the event](operate/backups.md#keep-a-copy-after-the-event).
3. **Collect anything you need from the logs**, as described in [Collect the results](operate/results.md), because the next step deletes them.
4. **Delete everything.** The command asks you to type the event's name before it starts, and it takes about 25 minutes.
    ```bash
    cd ~/wh/wh-2027/utils
    make destroy
    ```
    It runs the three steps in the diagram above. First it deletes the challenges and CTFd with Pulumi, deletes any DNS records the cluster made that are still there, so that they can't block next year's event, and waits for the load balancers to go. Then Terraform deletes the cluster, the network, the buckets and both image registries, and lines like `module.vpc.aws_vpc.this[0]: Still destroying...` can continue for 10 minutes, so don't interrupt them. Last, it deletes the event's own log groups and prints one `deleted` line for each. It ends with `Done.`

    If Pulumi can't delete a stack, the command stops before Terraform runs, because Terraform would delete the bucket that holds Pulumi's records, and nothing could then track what is left. The *If it fails* table below covers the messages.

    The log groups named `/aws/service-events/…` and `/aws/application-signals/…` stay, because every cluster in the region writes to the same ones. If this was the only cluster in the account, delete them by hand with `aws logs delete-log-group --log-group-name <name>`.

## Check the bill has stopped

Run the whole box below. Each line checks for one kind of resource that costs money, and each should print `[]` or nothing at all.

```bash
R=$(aws configure get region)
aws eks list-clusters --region $R --query clusters
aws ec2 describe-instances --region $R --filters Name=instance-state-name,Values=running,pending --query 'Reservations[].Instances[].InstanceId'
aws ec2 describe-nat-gateways --region $R --filter Name=state,Values=available,pending --query 'NatGateways[].NatGatewayId'
aws elbv2 describe-load-balancers --region $R --query 'LoadBalancers[].LoadBalancerName'
aws ec2 describe-volumes --region $R --query 'Volumes[].VolumeId'
aws ec2 describe-addresses --region $R --query 'Addresses[].PublicIp'
aws ecr describe-repositories --region $R --query 'repositories[].repositoryName'
aws s3 ls
aws logs describe-log-groups --query 'logGroups[].logGroupName'
```

In order, the lines check for clusters, rented computers, NAT gateways, load balancers, disks, fixed public addresses, image registries, storage buckets and log groups.

The next day, check the actual charges for the last three days:

```bash
aws ce get-cost-and-usage --time-period Start=$(date -d '-3 days' +%F),End=$(date +%F) \
  --granularity DAILY --metrics UnblendedCost --query 'ResultsByTime[].[TimePeriod.Start,Total.UnblendedCost.Amount]' --output text
```

On macOS, replace `date -d '-3 days' +%F` with `date -v-3d +%F`. After teardown each day should cost less than US$0.10, and anything more means a resource was left behind.

## What stays, on purpose

| What | Why | Cost |
|---|---|---|
| The domain and its hosted zone | Next year's event reuses them. | About US$15 a year, plus US$0.50 a month |
| The secret `<event>/config` | AWS keeps a deleted secret for 7 days in case you need it back, and `make deploy-eks` restores it if you deploy again within that time. | US$0.40 a month until it's gone |
| The budget alert | It costs nothing. | None |

## If it fails

| Message | Fix |
|---|---|
| `DependencyViolation` while deleting the network | A load balancer made by the cluster still exists. List them with `aws elbv2 describe-load-balancers --query 'LoadBalancers[].[LoadBalancerName,LoadBalancerArn]' --output text`, delete each leftover with `aws elbv2 delete-load-balancer --load-balancer-arn <arn>`, and then run `make destroy` again. |
| `module.vpc.aws_vpc.this[0]: Still destroying...` for more than 12 minutes | A security group the load balancer controller made, named `k8s-traffic-…`, is still in the network. In a second terminal, list the network's groups with `aws ec2 describe-security-groups --filters Name=vpc-id,Values=<the vpc-… id from the line> --query 'SecurityGroups[].[GroupId,GroupName]' --output text`, and delete each one except `default` with `aws ec2 delete-security-group --group-id <sg-…>`. The deletion then finishes within a minute. |
| `pulumi destroy failed for <stack>` | Pulumi couldn't delete something, and nothing after it ran. Read Pulumi's error above the line, fix it, and run `make destroy` again. |
| `Pulumi can't read its records for <stack>` | Pulumi couldn't reach its bucket, usually because your login expired or the passphrase is wrong. Sign in again, check `python3 secrets.py get pulumi_passphrase` works, and run `make destroy` again. |
| `No <stack> stack, but the <namespace> namespace exists` | Pulumi's records for that stack are gone, but its programs still run. Ask the infra lead before you go on, because whatever that stack made, such as disks and load balancers, has to be deleted by hand. |
| `ExpiredTokenException` or `Your session has expired` | Your login has ended. Sign in again and run `make destroy` again, and Terraform and Pulumi will continue with whatever is left. |
| The deletion was interrupted, and the cluster still exists | Run `make destroy` again. Terraform keeps its records in `utils/eks/terraform.tfstate` on the computer that deployed, so run it on that computer. |
| All checks are empty, but charges continue | In the AWS console, open **Billing and Cost Management → Bills**, which lists each charge by service and region. |

## Check your understanding

These questions also use what you learned in the earlier sections. Work out your answer before you open the hidden one.

!!! question "1. The laptop that deployed is gone"
    The day after the event, the laptop you deployed from stops working, and a teammate has to delete everything from theirs. They have the settings file and their own login. What can they do, and what can't they?

    ??? success "Answer"
        The Pulumi steps work, because Pulumi keeps its records in an S3 bucket, so the challenges and CTFd can be deleted from any computer. Terraform's records, `utils/eks/terraform.tfstate`, were only on your laptop. Without them Terraform doesn't know what it built, so `make destroy` can't delete the cluster, the network or the NAT gateway, and those keep billing until someone deletes them by hand in the console. That is why you copy the state file to the club's shared drive after every deploy.

!!! question "2. Skipping straight to Terraform"
    To save time, someone runs `terraform -chdir=eks destroy -var-file=terraform.tfvars.json` instead of `make destroy`. Terraform finishes without an error. What is left behind, and who notices?

    ??? success "Answer"
        Terraform only deletes what it built itself. The DNS records that ExternalDNS made for the scoreboard and the web challenges stay in Route 53, still owned by `<event>-eks`, and next year's deploy prints a `[dns] WARNING` until someone runs `make dns-clean OWNER=<event>-eks`. CTFd's disks stay behind as unattached disks that still cost money, and the log groups stay too. The checks in [Check the bill has stopped](#check-the-bill-has-stopped) show the disks and the log groups, and the bill shows the rest a few days later.

!!! question "3. A rerun three days later"
    You deleted everything on Monday after downloading the final backup. On Thursday the club decides to reopen the CTF for a weekend, using the same event name and the same scores. What comes back by itself, and what do you have to do?

    ??? success "Answer"
        The secret comes back by itself with its old values, because a deleted secret is kept for 7 days, so every password stays the same. The scores don't, because the backup bucket was deleted with the system. Deploy as usual, upload your saved file into the new backup bucket with `aws s3 cp`, and then run `make restore-ctfd FILE=<that file>`, followed by the `redis-cli FLUSHALL` from [Restore a backup](operate/backups.md#restore-a-backup). Because the restore brings back CTFd's settings too, it replaces whatever you entered on the setup page. Finally, run `make deploy-healthcheck-cronjob`, because the pwn challenges have new addresses.
