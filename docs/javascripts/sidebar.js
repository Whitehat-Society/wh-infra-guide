// Adds a button to the header that hides or shows the left sidebar on wide screens,
// and remembers the choice for this browser.
(function () {
  var KEY = "wh-nav-hidden";
  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  if (saved === "1") document.body.classList.add("wh-nav-hidden");

  var header = document.querySelector(".md-header__inner");
  if (!header) return;
  var btn = document.createElement("button");
  btn.className = "wh-navtoggle";
  btn.type = "button";
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h13M3 12h7M3 19h13"/><path d="M21 4l-8 8 8 8"/></svg>';
  function label() {
    var hidden = document.body.classList.contains("wh-nav-hidden");
    btn.title = hidden ? "Show the sidebar" : "Hide the sidebar";
    btn.setAttribute("aria-label", btn.title);
    btn.setAttribute("aria-pressed", hidden ? "true" : "false");
  }
  btn.addEventListener("click", function () {
    var hidden = document.body.classList.toggle("wh-nav-hidden");
    try { localStorage.setItem(KEY, hidden ? "1" : "0"); } catch (e) {}
    label();
  });
  label();
  var title = header.querySelector(".md-header__title");
  header.insertBefore(btn, title);
})();
