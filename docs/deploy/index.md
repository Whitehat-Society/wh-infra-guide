# Deploy: overview

<span class="time">⏱ ~1.5 h total, mostly waiting</span>

!!! warning "Billing starts on the next page"
    From `make deploy-eks` on, AWS charges ~US$0.45/hour until you [tear down](../teardown.md). Check that the [budget alert](../accounts/budget.md) exists before you start.

Five pages, run in order. Every command runs in `~/wh/wh-2026/utils`.

<div class="wh">
<div class="card">
<ol class="steps">
  <li><div><span class="cmd">make deploy-eks</span><span>Terraform builds the network, the EKS cluster and its add-ons: load balancer controller, ExternalDNS, NGINX, cert-manager, Cluster Autoscaler, alarms, backup bucket. <a href="eks/">Page 1</a> · ~25 min</span></div></li>
  <li><div><span class="cmd">make deploy-ctfd</span><span>Builds the CTFd image, pushes it to ECR, and runs Pulumi to start CTFd, MariaDB and Redis. Then you finish the setup wizard in the browser. <a href="ctfd/">Page 2</a> · ~15 min</span></div></li>
  <li><div><span class="cmd">make build-images</span><span><code>builder.py</code> builds every challenge image, deploys the web and pwn challenges with Pulumi, and loads all challenges into CTFd. <a href="challenges/">Page 3</a> · ~20 min</span></div></li>
  <li><div><span class="cmd">make deploy-ctfd-backup-cronjob · deploy-healthcheck-cronjob</span><span>Hourly database backups to S3, and a 5-minute check that posts failures to Discord. <a href="day2/">Page 4</a> · ~10 min</span></div></li>
  <li><div><span class="cmd">make smoke-test</span><span>Checks every endpoint answers, plus a browser checklist. <a href="verify/">Page 5</a> · ~10 min</span></div></li>
</ol>
</div>
</div>

## Two terminal habits for these pages

1. **Keep one terminal open for the whole deploy.** Some pages set variables (like `EVENT`) that later commands use. If you open a new terminal, rerun the first block of the page you're on
2. **If your AWS session expires mid-deploy** (`ExpiredToken`, `SSO session ... expired`), run `aws sso login` and rerun the same `make` command. Terraform and Pulumi pick up where they stopped

## What gets created where

Click the **Deploy** tab in the [Architecture explorer](../reference/architecture.md) to see which tool creates which part.
