# Architecture explorer

Pick a view, click any box for details, or pick a flow to step through it. The **Deploy** view shows which tool creates which part.

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

## What each layer owns

Terraform builds the AWS foundation and the cluster add-ons. Three small Pulumi Go programs, with their state in S3, put workloads on the cluster.

<div class="wh">
--8<-- "components.html"
</div>
