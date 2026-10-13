# Architecture explorer

This interactive map shows every part of the system and how the parts connect, using the technical names explained in [How the system works](../concepts/big-picture.md).

The buttons at the top switch between **views**, which show the system from different angles: how players' traffic flows, how the network is laid out, which tool builds what, and how monitoring works. Click any box to read what it is, along with its key facts, below the map. The buttons under the map highlight one **flow**, which is a single journey such as a player submitting a flag, and **Next** steps through it.

The map describes WH-2026 as it ran on event day, so a few numbers differ from a fresh deploy. WH-2026 ran two copies of each web challenge, for example, whereas a fresh deploy runs one.

<div class="wh">
<div class="tabs" id="tabs" role="tablist"></div>
<div class="explorer">
  <div class="figure" style="min-width:0">
    <div><h3 id="vtitle"></h3><p class="tag" id="vdesc"></p></div>
    <div class="scroll"><svg id="map" role="img" aria-label="Interactive architecture diagram"></svg></div>
    <div class="legend" id="legend"></div>
    <div class="flows" id="flows"></div>
    <div id="walk" aria-live="polite"></div>
  </div>
  <aside class="card" id="inspect" aria-live="polite"></aside>
</div>
</div>

## Which tool builds which part

| Part | Tool and folder | What it creates |
|---|---|---|
| Network | Terraform, `utils/eks/vpc.tf` | The private network, with three public and three private subnets across three availability zones, and one NAT gateway |
| Cluster | Terraform, `utils/eks/main.tf` | The Kubernetes cluster and one group of rented `t3.medium` computers in each availability zone, 3 to 6 in all, plus the disk type the database uses |
| Helper programs | Terraform, `utils/eks/helm.tf` and `cert-manager.tf` | The load balancer controller, ExternalDNS, NGINX with 2 copies, cert-manager with a fallback certificate for every challenge name, and the Cluster Autoscaler |
| Other AWS parts | Terraform, `utils/eks/main.tf` and `observability.tf` | The registry for the CTFd image, the buckets for Pulumi's records and for backups, the secret, the alarms and dashboard, and the small program that reposts alarms to Discord |
| Scoreboard | Pulumi, `utils/ctfd/` | CTFd, MariaDB and Redis, one copy of each, with their disks and the Ingress for `ctf.<your-domain>` |
| Web challenges | Pulumi, `utils/challenges/` | A Deployment, a Service and an Ingress with request limits for each challenge, at `<name>.challenges.<your-domain>` |
| Pwn challenges | Pulumi, `utils/challenges/` | A Deployment for each challenge, and a Service that gets its own load balancer |
| Text challenges | ctfcli | Only the challenge's description, files and flag inside CTFd |
