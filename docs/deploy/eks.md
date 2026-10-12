# 1. The cluster

This stage builds the foundation everything else runs on: the private network, the three rented computers, the Kubernetes cluster that manages them, and the helper programs listed in [Containers and Kubernetes](../concepts/containers-and-kubernetes.md#helper-programs-inside-the-cluster). It also creates the backup bucket, the alarms, and the bucket where Pulumi keeps its records.

`make deploy-eks` runs Terraform on the files in `utils/eks/` in two rounds. The first round creates the network and the cluster. The second installs the programs that run inside the cluster, which Terraform can only plan once the cluster exists.

1. Let Terraform download its **providers**, the plug-ins it uses to talk to AWS, Kubernetes and Helm:
    ```bash
    cd ~/wh/wh-2026/utils
    terraform -chdir=eks init
    ```
    The last line is `Terraform has been successfully initialized!`
2. Build everything:
    ```bash
    make deploy-eks
    ```
    The command first hands the secret you created over to Terraform (`[restore-secrets] Importing: <event>/config`). Then it creates about 70 resources without asking for confirmation. It prints lines like `Still creating... [5m0s elapsed]` while it waits. The cluster takes about 10 minutes and the computers about 3. Let it run until the prompt returns.
3. Tell `kubectl` how to reach the new cluster. The command saves the cluster's address and login method in a file `kubectl` reads:
    ```bash
    make kubeconfig
    ```
4. Each address in `alarm_notification_emails` receives an email titled *AWS Notification - Subscription Confirmation*. Click **Confirm subscription** in each one. Until you do, alarms don't reach that address.
5. Switch off one alarm that doesn't apply. It watches chall-manager, an optional part this deploy leaves out, so it would report a problem constantly:
    ```bash
    EVENT=$(jq -r .event_name eks/terraform.tfvars.json)
    aws cloudwatch disable-alarm-actions --alarm-names "$EVENT-chall-manager-pod-down"
    ```

## Check it worked

```bash
kubectl get nodes
kubectl get pods -A | grep -v -e Running -e Completed
kubectl get svc -n ingress-nginx ingress-nginx-controller
kubectl get certificate -A
```

What each command should show:

1. **Nodes:** three lines, each with `STATUS` `Ready`. These are the three rented computers.
2. **Pods that aren't running:** only the header line. `-A` lists pods in every namespace, and `grep -v` hides the healthy ones, so an empty list means everything is up.
3. **The NGINX service:** under `EXTERNAL-IP`, a long name ending in `.elb.<region>.amazonaws.com`. That is the web load balancer's address.
4. **Certificates:** `wildcard-challenges` with `READY` `True`. Let's Encrypt can take up to 5 minutes after the deploy ends; rerun the command until it shows `True`.

## If it fails

| Message | Fix |
|---|---|
| `context deadline exceeded` next to `helm_release` | One helper program was slow to start. Rerun `make deploy-eks` |
| `AccessDenied` or `OptInRequired` while creating the cluster | Either the new account is still being switched on, or you aren't signed in as your admin login. Check `aws sts get-caller-identity`, wait an hour, and rerun |
| `BucketAlreadyExists` | Another AWS customer owns that bucket name. Choose a new event name, then redo [Make it yours](../code/make-it-yours.md) and [Settings and secrets](../code/config.md) |
| `ResourceExistsException` for the secret | Terraform didn't take over the secret. Run `terraform -chdir=eks init`, then `make deploy-eks` again |
| The command waits more than 10 minutes on `aws_eks_node_group ... Still creating` | AWS can't start the computers. `aws autoscaling describe-scaling-activities --max-items 1 --query 'Activities[].StatusMessage'` gives the reason. `not eligible for Free Tier` means a Free-plan account: change `node_instance_type` (see [Which kind of account you have](../accounts/aws.md#which-kind-of-account-you-have)), wait for the command to fail, then rerun it |
| A node stays `NotReady` | Wait 3 minutes. If it's still not ready, `kubectl describe node <name>` and read the `Conditions` section |
| Certificate stays `False` | Your domain's DNS doesn't point at Route 53 yet. Redo the checks on [Domain name](../accounts/domain.md#check-it-worked). `kubectl describe certificate -A` shows the exact reason |

[Troubleshooting](../reference/troubleshooting.md) covers more errors.

**Next:** [2. The scoreboard](ctfd.md).
