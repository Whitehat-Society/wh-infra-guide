# Destroy & check the bill

<span class="time">⏱ ~30 min, mostly waiting</span>

Do this the day after the event, or any time the stack sits idle for more than a day. It deletes everything except the domain and its DNS zone. You can rebuild it all by rerunning [Deploy](deploy/index.md).

!!! danger "This can't be undone"
    The database, every uploaded file and every pushed image are deleted. Do step 1 first.

## The order matters

The cluster's controllers created some AWS resources (load balancers, DNS records, disks) themselves, so Terraform doesn't know about them. Delete the Pulumi stacks **first**, while the controllers are still running to clean up after themselves. Then destroy the cluster.

1. **Keep the final database backup.** Follow [Keep a copy after the event](operate/backups.md#keep-a-copy-after-the-event)
2. **Set up Pulumi:**
    --8<-- "pulumi-env.md"
3. **Delete the challenges and CTFd** (~5 min each):
    ```bash
    for s in shared-tcp web-shared ctfd; do
      pulumi -C "$s" stack select "$EVENT" && pulumi -C "$s" destroy --yes
    done
    ```
    Expected: each ends with `Resources: N deleted`
4. **Wait for the load balancers to disappear** (~2 min):
    ```bash
    aws elbv2 describe-load-balancers --query 'LoadBalancers[].LoadBalancerName' --output text
    ```
    Repeat until only `<event>-tcp` and the `k8s-ingressn-…` one are left. Terraform deletes those two itself
5. **Destroy the cluster and everything Terraform made** (~20 min):
    ```bash
    terraform -chdir=eks apply -var-file=terraform.tfvars.json -auto-approve   # sync state first if code changed
    terraform -chdir=eks destroy -var-file=terraform.tfvars.json
    ```
    Type `yes` when asked. `module.vpc.aws_vpc.this[0]: Still destroying...` can last 10 minutes. **Don't interrupt it**
6. **Delete the challenge image repository:**
    ```bash
    terraform -chdir=ecr destroy -var-file=terraform.tfvars
    ```

## Check the bill has stopped

Run the whole block. Every line should print nothing, `[]`, or `None`:

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

Then check the bill itself the next day: anything above ~US$0.10/day after teardown is a leftover.

```bash
aws ce get-cost-and-usage --time-period Start=$(date -d '-3 days' +%F),End=$(date +%F) \
  --granularity DAILY --metrics UnblendedCost --query 'ResultsByTime[].[TimePeriod.Start,Total.UnblendedCost.Amount]' --output text
```

(macOS: replace `date -d '-3 days' +%F` with `date -v-3d +%F`.)

## What stays (on purpose)

| Kept | Why | Cost |
|---|---|---|
| Domain + Route 53 hosted zone | Next year reuses them | ~US$15/year + US$0.50/month |
| Secret `<event>/config` | Terraform schedules it for deletion with a 7-day recovery window. `make deploy-eks` restores it if you redeploy within 7 days | US$0.40/month until deleted |
| Budget alert | Free | — |

## If it fails

| Symptom | Fix |
|---|---|
| Pulumi: `error: ... passphrase` | `PULUMI_CONFIG_PASSPHRASE` isn't set in this terminal. Redo step 2 |
| `DependencyViolation` deleting the VPC or a subnet | Something the controllers made is still there. Rerun step 4's check, delete leftover load balancers with `aws elbv2 delete-load-balancer --load-balancer-arn <arn>`, then rerun step 5 |
| Destroy was interrupted and the cluster still exists | Follow *Recovery: EKS cluster orphaned from Terraform state* in `docs/ops/deploy-live-infra.md` in the wh-2026 repo |
| Something is still billing after all checks are empty | Open **Billing → Bills** in the console. It lists charges by service and region |
