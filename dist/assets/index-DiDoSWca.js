(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const r of t.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function i(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function o(e){if(e.ep)return;e.ep=!0;const t=i(e);fetch(e.href,t)}})();const g=[{id:"01 — refactorer",title:"Code Refactorer",status:"running",description:"Rewriting OrderService.java: javax.servlet → jakarta, XML bean config → annotations.",progressLabel:"files",progressDone:142,progressTotal:220,progressUnit:"files"},{id:"02 — parity tests",title:"Parity Test Generator",status:"verifying",description:"Replaying 1,204 production requests against legacy and modern endpoints, diffing responses byte for byte.",progressLabel:"matched",progressDone:975,progressTotal:1204,progressUnit:"matched"},{id:"03 — deployer",title:"CI/CD Deployer",status:"queued",description:"Waiting on parity sign-off before generating Dockerfile, Helm chart, and pipeline manifests.",progressLabel:"manifests",progressDone:2,progressTotal:24,progressUnit:"manifests"}],n={label:"OrderService.calculateTotal()",legacy:`<span class="kw">public</span> <span class="ty">BigDecimal</span> <span class="fn">calculateTotal</span>(
    <span class="ty">List</span>&lt;<span class="ty">Item</span>&gt; items) {
  <span class="ty">BigDecimal</span> t = <span class="ty">BigDecimal</span>.ZERO;
  <span class="kw">for</span> (<span class="ty">Item</span> i : items) {
    t = t.add(i.getPrice()
      .multiply(<span class="kw">new</span> <span class="ty">BigDecimal</span>(
        i.getQty())));
  }
  <span class="kw">return</span> t;
}`,modern:`<span class="kw">public</span> <span class="ty">BigDecimal</span> <span class="fn">calculateTotal</span>(
    <span class="ty">List</span>&lt;<span class="ty">Item</span>&gt; items) {
  <span class="kw">return</span> items.stream()
    .map(i -&gt; i.price()
      .multiply(<span class="ty">BigDecimal</span>
        .valueOf(i.qty())))
    .reduce(<span class="ty">BigDecimal</span>.ZERO,
      <span class="ty">BigDecimal</span>::add);
}`,parityLine:"↳ 1,204 / 1,204 replayed requests — output parity 100%"},y=[{value:"312",label:"files refactored"},{value:"100%",label:"parity on shipped services"},{value:"18",label:"k8s manifests generated"},{value:"6",label:"services in flight"}],l=document.querySelector("#subagent-cards");l&&(l.innerHTML=g.map(s=>{const a=Math.round(s.progressDone/s.progressTotal*100),i=s.status==="running"?"":s.status==="verifying"?"amber":"muted";return`
        <div class="subagent-card">
          <div class="sa-header">
            <span class="sa-id">${s.id}</span>
            <span class="sa-status ${s.status}">${s.status}</span>
          </div>
          <div class="sa-title">${s.title}</div>
          <div class="sa-desc">${s.description}</div>
          <div class="sa-progress-wrap">
            <div class="sa-progress-meta">
              <span>${s.progressDone.toLocaleString()} / ${s.progressTotal.toLocaleString()} ${s.progressUnit}</span>
              <span class="sa-progress-pct">${a}%</span>
            </div>
            <div class="sa-progress-track">
              <div class="sa-progress-fill ${i}" style="width:${a}%"></div>
            </div>
          </div>
        </div>
      `}).join(""));const c=document.querySelector("#diff-label");c&&(c.textContent=n.label);const p=document.querySelector("#diff-legacy");p&&(p.innerHTML=n.legacy);const d=document.querySelector("#diff-modern");d&&(d.innerHTML=n.modern);const u=document.querySelector("#diff-parity");u&&(u.textContent=n.parityLine);const f=document.querySelector("#stats-footer");f&&(f.innerHTML=y.map(s=>`
        <div class="stat-block">
          <span class="stat-num">${s.value}</span>
          <span class="stat-desc">${s.label}</span>
        </div>
      `).join(""));
