# Deploy: overview

<span class="time">Time: about 1.5 hours, mostly waiting</span>

To **deploy** means to create the system in AWS and start every program. You'll do it in five stages, one page each, and check that each stage works before starting the next. Every command runs in `~/wh/wh-2026/utils`.

!!! warning "Billing starts on the next page"
    From the first command on the next page, AWS charges about US$0.45 an hour until you [delete everything](../teardown.md). Check that your [budget alert](../accounts/budget.md) exists before you start.

<div class="wh">
<div class="card">
<ol class="steps">
  <li><div><span class="cmd">make deploy-eks</span><span>Terraform builds the private network, the Kubernetes cluster and its helper programs, the alarms and the backup bucket. <a href="eks/">Page 1</a>, about 25 minutes</span></div></li>
  <li><div><span class="cmd">make deploy-ctfd</span><span>Builds the CTFd container image, uploads it, and starts CTFd, its database and its cache. Then you finish CTFd's setup in a browser. <a href="ctfd/">Page 2</a>, about 15 minutes</span></div></li>
  <li><div><span class="cmd">make build-images</span><span>Builds every challenge's image, starts the web and pwn challenges, and loads all challenges into CTFd. <a href="challenges/">Page 3</a>, about 20 minutes</span></div></li>
  <li><div><span class="cmd">make deploy-ctfd-backup-cronjob and deploy-healthcheck-cronjob</span><span>Schedules an hourly database backup and a check every 5 minutes that each challenge still answers. <a href="day2/">Page 4</a>, about 10 minutes</span></div></li>
  <li><div><span class="cmd">make smoke-test</span><span>Checks every challenge answers, then a short checklist in the browser. <a href="verify/">Page 5</a>, about 10 minutes</span></div></li>
</ol>
</div>
</div>

## Two habits that save time

1. **Use one terminal window for the whole deploy.** Some pages set a variable, such as `EVENT`, that later commands on the same page use. If you open a new window, rerun the first command block of the page you're on.
2. **If your AWS login expires halfway**, a command fails with `ExpiredToken` or `SSO session ... expired`. Run `aws sso login`, then rerun the same `make` command. Terraform and Pulumi both carry on from where they stopped.

To see which tool creates which part, open the **Deploy** view in the [Architecture explorer](../reference/architecture.md).

**Next:** [1. The cluster](eks.md).
