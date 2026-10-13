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
    It runs the three steps in the diagram above. First it deletes the challenges and CTFd with Pulumi, deletes any DNS records the cluster made that are still there, so that they can't block next year's event, and waits for the load balancers to go. Then Terraform deletes the cluster, the network, the buckets and both image registries, and lines like `module.vpc.aws_vpc.this[0]: Still destroying...` can continue for 10 minutes, so don't interrupt them. Last, it deletes the log groups and prints one `deleted` line for each, usually 6 to 11 in all. It ends with `Done.`

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
| `ExpiredTokenException` or `Your session has expired` | Your login has ended. Sign in again and run `make destroy` again, and Terraform and Pulumi will continue with whatever is left. |
| The deletion was interrupted, and the cluster still exists | Run `make destroy` again. Terraform keeps its records in `utils/eks/terraform.tfstate` on the computer that deployed, so run it on that computer. |
| All checks are empty, but charges continue | In the AWS console, open **Billing and Cost Management → Bills**, which lists each charge by service and region. |
