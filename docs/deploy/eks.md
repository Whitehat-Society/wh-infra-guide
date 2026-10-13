# 1. The cluster

This stage builds the foundation that everything else runs on. That means the private network, the three rented computers, the Kubernetes cluster that manages them, and the helper programs described in [Kubernetes and its helpers](../concepts/kubernetes.md#the-helpers). It also creates the backup bucket, the alarms, the bucket where Pulumi keeps its records, and the two image registries in ECR, one for CTFd and one for the challenges.

`make deploy-eks` runs Terraform on the files in `utils/eks/` in two rounds. The first round creates the network and the cluster, and the second installs the programs that run inside the cluster, because Terraform can only plan those once the cluster exists.

1. Build everything:
    ```bash
    cd ~/wh/wh-2027/utils
    make deploy-eks
    ```
    It first lets Terraform download its **providers**, which are the plug-ins it uses to talk to AWS, Kubernetes and Helm. Then it creates about 140 resources without asking for confirmation, and prints lines like `Still creating... [5m0s elapsed]` while it waits. The cluster takes about 10 minutes and the computers about 3 more, so let it run until the prompt comes back. Between the two rounds, it prints `Import successful!`, which means Terraform has taken over the secret you created with `make secrets`. Terraform's part ends with `Apply complete!`, and the very last line should be `[dns] No DNS records left over from another cluster.`
2. Tell `kubectl` how to reach the new cluster. This command saves the cluster's address and login method in a file that `kubectl` reads:
    ```bash
    make kubeconfig
    ```
3. Each address in `alarm_notification_emails` receives an email titled *AWS Notification - Subscription Confirmation*. Click **Confirm subscription** in each one, because alarms don't reach an address until you do.

## Check it worked

```bash
kubectl get nodes
kubectl get pods -A | grep -v -e Running -e Completed
kubectl get svc -n ingress-nginx ingress-nginx-controller
kubectl get certificate -A
```

The first command lists the nodes, and it should print three lines with `STATUS` `Ready`, one for each rented computer.

The second command lists the pods that aren't running, and it should print only the header line. The `-A` option lists pods in every namespace, and `grep -v` hides the healthy ones, so an empty list means everything is up.

The third command shows the NGINX service. Under `EXTERNAL-IP` it should show a long name ending in `.elb.<region>.amazonaws.com`, which is the web load balancer's address.

The last command lists the certificates, and `wildcard-challenges` should show `READY` `True`. Let's Encrypt can take up to 5 minutes after the deploy ends, so repeat the command until it says `True`.

## If it fails

| Message | Fix |
|---|---|
| `context deadline exceeded` next to `helm_release` | One helper program was slow to start. Run `make deploy-eks` again. |
| `[dns] WARNING: … still belong to <old-event>-eks` | An earlier event's cluster left DNS records behind, and this cluster can't take those names over. The warning lists them, and if that cluster no longer exists, remove them with the `make dns-clean OWNER=<old-event>-eks` command it prints. |
| `fill in … first (they still say CHANGE-ME)` | The settings file isn't finished, so go back to [Your settings](../code/make-it-yours.md). |
| `AccessDenied` or `OptInRequired` while creating the cluster | Either the new account is still being switched on, or you aren't signed in with your admin login. Check with `aws sts get-caller-identity`, wait an hour, and run the command again. |
| `BucketAlreadyExists` | Another AWS customer owns that bucket name. Choose a new event name in [Your settings](../code/make-it-yours.md), run `make secrets` again for the new name, and then run `make deploy-eks` again. |
| `ResourceExistsException` for the secret | Terraform didn't take over the secret, so run `make deploy-eks` again, which retries the handover. |
| The command waits more than 10 minutes on `aws_eks_node_group ... Still creating` | AWS can't start the computers, and `aws autoscaling describe-scaling-activities --max-items 1 --query 'Activities[].StatusMessage'` tells you why. `not eligible for Free Tier` means you have a Free-plan account, so change `node_instance_type` as described in [Which kind of account you have](../accounts/aws.md#which-kind-of-account-you-have), wait for the command to fail, and run it again. |
| A node stays `NotReady` | Wait 3 minutes. If it still isn't ready, run `kubectl describe node <name>` and read the `Conditions` section. |
| A certificate stays `False` | Your domain's DNS doesn't point at Route 53 yet, so redo the checks on [Domain name](../accounts/domain.md#check-it-worked). `kubectl describe certificate -A` shows the exact reason. |

[Troubleshooting](../reference/troubleshooting.md) covers more errors than this table.

**Next:** [2. The scoreboard](ctfd.md).
