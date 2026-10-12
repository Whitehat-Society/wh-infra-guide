# 1. Cluster (EKS)

<span class="time">⏱ ~25 min, of which ~20 min waiting</span>

`make deploy-eks` runs Terraform in `utils/eks/`. It applies twice: first the network, the cluster and the Pulumi state bucket, then everything that runs *inside* the cluster. The split exists because Terraform can't plan Helm charts for a cluster that doesn't exist yet.

1. Download the Terraform providers:
    ```bash
    cd ~/wh/wh-2026/utils
    terraform -chdir=eks init
    ```
    Expected: `Terraform has been successfully initialized!`
2. Deploy:
    ```bash
    make deploy-eks
    ```
    The first thing it does is import the secret you created into Terraform's state (`[restore-secrets] Importing: <event>/config`). Then it builds everything without asking for confirmation. Leave it running. The longest waits are `module.eks.aws_eks_cluster.this[0]: Still creating...` (~10 min) and the node group (~3 min)
3. Point `kubectl` at the new cluster:
    ```bash
    make kubeconfig
    ```
4. Click the **Confirm subscription** link in the *AWS Notification* email sent to each address in `alarm_notification_emails`. Without the click, alarms don't email you
5. Silence the chall-manager alarm. This stack doesn't run chall-manager, so that alarm would fire non-stop:
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

Expected:

- `kubectl get nodes`: 3 nodes, all `Ready`
- The second command prints **only** its header line, which means every pod is `Running` or `Completed`
- `ingress-nginx-controller`: the `EXTERNAL-IP` column shows a hostname ending in `.elb.ap-southeast-1.amazonaws.com`
- `wildcard-challenges` shows `READY True`. It can take up to 5 minutes after the deploy ends

## If it fails

| Symptom | Fix |
|---|---|
| `context deadline exceeded` during a `helm_release` | A Helm chart was slow to start. Rerun `make deploy-eks` |
| `creating EKS Cluster ... AccessDenied` or `OptInRequired` | The account is still activating, or you aren't on the admin profile. Check `aws sts get-caller-identity`, wait an hour, rerun |
| `BucketAlreadyExists` | Someone in the world already owns that bucket name. Pick a new `event_name`, then redo [Make it yours](../code/make-it-yours.md) and [Config](../code/config.md) |
| `ResourceExistsException` for the secret | The import didn't happen. Run `terraform -chdir=eks init`, then `make deploy-eks` again |
| Nodes stay `NotReady` | `kubectl describe node <name>` and read `Conditions`. Usually it's still starting; wait 3 min |
| Certificate stuck `False` | `kubectl describe certificate -A`. Usually DNS for your domain isn't pointing at Route 53 yet; see [Domain name](../accounts/domain.md#check-it-worked) |

More in [Troubleshooting](../reference/troubleshooting.md).

**Next:** [2. Scoreboard (CTFd)](ctfd.md).
