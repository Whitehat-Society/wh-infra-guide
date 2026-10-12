# Architecture explorer

This interactive map shows every part of the system and how the parts connect. It uses the technical names explained in [How the system works](../concepts/big-picture.md).

- **Views** (the buttons at the top) show the system from different angles: how players' traffic flows, how the network is laid out, which tool builds what, and how monitoring works.
- **Click any box** to read what it is, with its key facts, below the map.
- **Flows** (the buttons under the map) highlight one journey, such as a player submitting a flag. Use **Next** to step through it.

The map describes WH-2026 as it ran on event day. A few numbers differ from a fresh deploy: for example, WH-2026 ran two copies of each web challenge, and a fresh deploy runs one.

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
| Network | Terraform, `utils/eks/vpc.tf` | The private network, three public and three private subnets across three availability zones, and one NAT gateway |
| Cluster | Terraform, `utils/eks/main.tf` | The Kubernetes cluster and its group of rented computers (`t3.medium`, between 2 and 6), plus the disk type the database uses |
| Helper programs | Terraform, `utils/eks/helm.tf` and `cert-manager.tf` | The load balancer controller, ExternalDNS, NGINX (2 copies), cert-manager with a certificate for every name under your domain, and the Cluster Autoscaler |
| Other AWS parts | Terraform, `utils/eks/main.tf`, `secrets.tf`, `observability.tf`, `lambda.tf` | The registry for the CTFd image, buckets for Pulumi's records and for backups, the secret, the alarms and dashboard, and the small program that reposts alarms to Discord |
| Scoreboard | Pulumi, `utils/ctfd/` | CTFd, MariaDB and Redis, one copy each, with their disks and the Ingress for `ctf.<your-domain>` |
| Web challenges | Pulumi, `utils/web-shared/` | For each challenge: a Deployment, a Service, and an Ingress for `<name>.challenges.<your-domain>` with request limits |
| Pwn challenges | Pulumi, `utils/shared-tcp/` | For each challenge: a Deployment, and a Service that gets its own load balancer |
| Text challenges | ctfcli | The challenge's description, files and flag inside CTFd. Nothing else |
