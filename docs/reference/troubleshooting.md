# Troubleshooting

**First action:** run the three commands below and read the first line that looks wrong. Most problems show up here.

```bash
kubectl get pods -A | grep -v -e Running -e Completed      # broken pods
kubectl get events -A --sort-by=.lastTimestamp | tail -20  # what Kubernetes tried last
aws sts get-caller-identity                                # still signed in?
```

## By symptom

| Symptom | Likely cause | Fix |
|---|---|---|
| `ExpiredToken`, `SSO session ... expired` | 8-hour sign-in ended | `aws sso login`, then rerun the command |
| `Unable to connect to the server` from `kubectl` | kubeconfig missing or cluster gone | `cd ~/wh/wh-2026/utils && make kubeconfig` |
| Pod `Pending` | No node has room, or a disk can't attach | `kubectl describe pod <pod> -n <ns>` → read `Events`. "Insufficient cpu/memory": wait ~5 min for the autoscaler, or [add nodes](../operate/scaling.md) |
| Pod `ImagePullBackOff` | Image not in ECR, or a typo in the account ID | `kubectl describe pod` shows the image URL. Check it matches `aws ecr describe-images --repository-name <repo>` |
| Pod `CrashLoopBackOff` | The app itself exits | `kubectl logs <pod> -n <ns> --previous` |
| Pod `OOMKilled` | Over its memory limit (512Mi for challenges) | Raise the limit in `utils/web-shared/main.go` or `utils/shared-tcp/main.go`, then `make build-images` |
| Service `EXTERNAL-IP <pending>` | Load balancer controller can't create the NLB | `kubectl logs -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller --tail=50`. An IAM error means `make deploy-eks` didn't finish; rerun it |
| Hostname doesn't resolve | ExternalDNS hasn't written the record, or the domain isn't on Route 53 | `kubectl logs -n external-dns -l app.kubernetes.io/name=external-dns --tail=30`, and `dig +short NS <domain>` |
| Browser certificate warning | cert-manager hasn't issued yet, or hit Let's Encrypt's limit (5 identical certs per week) | `kubectl describe certificate -A`, then `kubectl logs -n cert-manager deploy/cert-manager --tail=50` |
| Web challenge returns 503 | Rate limit (20 req/s per address) | See [Rate limits](../operate/risks.md#rate-limits) |
| Pulumi: `the stack is currently locked` | A previous run was interrupted | `pulumi -C <dir> cancel --yes` (with the [Pulumi variables](#pulumi-variables) set) |
| Pulumi: `incorrect passphrase` | Wrong `pulumi_passphrase`, or an old `Pulumi.<stack>.yaml` from WH-2026 | Delete that file if it's from the old event; never change the passphrase of a live stack |
| Terraform: `Error acquiring the state lock` | Another Terraform is running, or one crashed | Make sure nobody else is deploying, then `terraform -chdir=eks force-unlock <LOCK_ID>` |
| Terraform: `secret ... scheduled for deletion` | Teardown less than 7 days ago | `make restore-secrets`, then rerun `make deploy-eks` |

## Pulumi variables

Any manual `pulumi` command needs these first:

--8<-- "pulumi-env.md"

## Getting help

Post in the tech & infra channel with:

1. The page and step number you're on
2. The exact command
3. The first error line (not a screenshot of the whole terminal)
4. The output of `kubectl get pods -A | grep -v Running` if the cluster is involved

The original, more detailed runbooks are in the wh-2026 repo under `docs/ops/`.
