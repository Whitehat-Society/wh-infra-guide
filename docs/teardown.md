# Delete everything

<span class="time">Time: about 30 minutes, mostly waiting</span>

AWS bills for the system until it no longer exists. Delete it the day after the event, or whenever it will sit unused for more than a day. This page deletes everything except the domain and its DNS records. Rebuilding later takes about 1.5 hours with [Deploy](deploy/index.md).

!!! danger "This can't be undone"
    Deleting the system deletes the database, every uploaded file and every challenge image. Do step 1 first.

## Why the order matters

Some AWS resources were created by the helper programs inside the cluster rather than by Terraform: the challenges' load balancers, their DNS records and the database disk. Terraform doesn't know about them, so it can't delete them. Instead, you delete the Pulumi stacks first. Kubernetes then tells the helper programs, which delete the resources they made. Only after that do you delete the cluster with Terraform.

1. **Keep the final backup.** Follow [Keep a copy after the event](operate/backups.md#keep-a-copy-after-the-event).
2. **Set the variables Pulumi needs:**
    --8<-- "pulumi-env.md"
3. **Delete the challenges and CTFd.** Each stack takes about 5 minutes:
    ```bash
    for s in shared-tcp web-shared ctfd; do
      pulumi -C "$s" stack select "$EVENT" && pulumi -C "$s" destroy --yes
    done
    ```
    Each one ends with `Resources:` and a count of deleted resources.
4. **Wait for the challenges' load balancers to go.** About 2 minutes:
    ```bash
    aws elbv2 describe-load-balancers --query 'LoadBalancers[].LoadBalancerName' --output text
    ```
    Repeat until only two names are left: `<event>-tcp` and one starting with `k8s-ingressn`. Terraform deletes those two in the next step.
5. **Delete the cluster and everything else Terraform made.** About 20 minutes:
    ```bash
    terraform -chdir=eks apply -var-file=terraform.tfvars.json -auto-approve
    terraform -chdir=eks destroy -var-file=terraform.tfvars.json
    ```
    The first command makes Terraform's records match the current code, in case the code changed since the deploy. The second asks for confirmation: type `yes`. Lines like `module.vpc.aws_vpc.this[0]: Still destroying...` can continue for 10 minutes. Don't interrupt them.
6. **Delete the challenge image registry:**
    ```bash
    terraform -chdir=ecr destroy -var-file=terraform.tfvars
    ```
    Type `yes` when asked.

## Check the bill has stopped

Run the whole block. Each line checks for one kind of resource that costs money, and each should print `[]` or nothing:

```bash
R=ap-southeast-1
aws eks list-clusters --region $R --query clusters
aws ec2 describe-instances --region $R --filters Name=instance-state-name,Values=running,pending --query 'Reservations[].Instances[].InstanceId'
aws ec2 describe-nat-gateways --region $R --filter Name=state,Values=available,pending --query 'NatGateways[].NatGatewayId'
aws elbv2 describe-load-balancers --region $R --query 'LoadBalancers[].LoadBalancerName'
aws ec2 describe-volumes --region $R --query 'Volumes[].VolumeId'
aws ec2 describe-addresses --region $R --query 'Addresses[].PublicIp'
aws ecr describe-repositories --region $R --query 'repositories[].repositoryName'
aws s3 ls
```

The lines check, in order: clusters, rented computers, NAT gateways, load balancers, disks, fixed public addresses, image registries and storage buckets.

The next day, check the actual charges for the last three days:

```bash
aws ce get-cost-and-usage --time-period Start=$(date -d '-3 days' +%F),End=$(date +%F) \
  --granularity DAILY --metrics UnblendedCost --query 'ResultsByTime[].[TimePeriod.Start,Total.UnblendedCost.Amount]' --output text
```

On macOS, replace `date -d '-3 days' +%F` with `date -v-3d +%F`. After teardown, each day should cost less than US$0.10. Anything more is a leftover resource.

## What stays, on purpose

| What | Why | Cost |
|---|---|---|
| The domain and its hosted zone | Next year's event reuses them | about US$15 a year, plus US$0.50 a month |
| The secret `<event>/config` | AWS keeps a deleted secret for 7 days in case you need it back. `make deploy-eks` restores it if you deploy again within that time | US$0.40 a month until it's gone |
| The budget alert | It costs nothing | none |

## If it fails

| Message | Fix |
|---|---|
| Pulumi mentions the `passphrase` | This terminal doesn't have the Pulumi variables. Redo step 2 |
| `DependencyViolation` while deleting the network | A load balancer made by the cluster still exists. Rerun the check in step 4, delete leftovers with `aws elbv2 delete-load-balancer --load-balancer-arn <arn>`, then rerun step 5 |
| The deletion was interrupted, and the cluster still exists | Follow *Recovery: EKS cluster orphaned from Terraform state* in `docs/ops/deploy-live-infra.md` in the wh-2026 repository |
| All checks are empty, but charges continue | In the AWS console, open **Billing and Cost Management → Bills**. It lists each charge by service and region |
