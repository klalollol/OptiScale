(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function i(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(a){if(a.ep)return;a.ep=!0;const r=i(a);fetch(a.href,r)}})();const M=[{id:"01 — refactorer",title:"Code Refactorer",status:"running",description:"Rewriting OrderService.java: javax.servlet → jakarta, XML bean config → annotations.",progressLabel:"files",progressDone:142,progressTotal:220,progressUnit:"files"},{id:"02 — parity tests",title:"Parity Test Generator",status:"verifying",description:"Replaying 1,204 production requests against legacy and modern endpoints, diffing responses byte for byte.",progressLabel:"matched",progressDone:975,progressTotal:1204,progressUnit:"matched"},{id:"03 — deployer",title:"CI/CD Deployer",status:"queued",description:"Waiting on parity sign-off before generating Dockerfile, Helm chart, and pipeline manifests.",progressLabel:"manifests",progressDone:2,progressTotal:24,progressUnit:"manifests"}],o={label:"OrderService.calculateTotal()",legacy:`<span class="kw">public</span> <span class="ty">BigDecimal</span> <span class="fn">calculateTotal</span>(
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
}`,parityLine:"↳ 1,204 / 1,204 replayed requests — output parity 100%"},T=[{value:"312",label:"files refactored"},{value:"100%",label:"parity on shipped services"},{value:"18",label:"k8s manifests generated"},{value:"6",label:"services in flight"}],l={score:71,tier:"measured",checks:[{id:"build-tool",label:"Build tool detected",severity:"info",status:"pass",detail:"Detected maven."},{id:"java-sources",label:"Java sources present",severity:"info",status:"pass",detail:"312 files, 42,100 LOC."},{id:"zip-slip",label:"Archive path safety",severity:"info",status:"pass",detail:"No traversal or absolute paths."},{id:"existing-tests",label:"Existing test sources",severity:"warning",status:"fail",detail:"No src/test directory.",remediation:"Parity fixtures will be recorded from live traffic instead of existing tests."},{id:"java-version",label:"Source level declared",severity:"info",status:"pass",detail:"Java 8 declared in build file."},{id:"dockerfile",label:"Dockerfile present",severity:"warning",status:"fail",detail:"No Dockerfile found.",remediation:"Subagent 3 will generate one; baseline timing may differ from prod."},{id:"docs",label:"Documentation folder",severity:"info",status:"skip",detail:"No docs/ folder. Architecture intent inferred from code only."},{id:"n-plus-one",label:"N+1 query risk",severity:"info",status:"pass",detail:"No eager collection mappings detected."},{id:"multi-module",label:"Module topology",severity:"info",status:"pass",detail:"Single module."}]},S=[{name:"p95 latency (ms)",tool:"k6",legacyValue:342,modernValue:187,unit:"ms",deltaPercent:-45.32,source:"measured"},{name:"p99 latency (ms)",tool:"k6",legacyValue:890,modernValue:410,unit:"ms",deltaPercent:-53.93,source:"measured"},{name:"throughput (req/s)",tool:"k6",legacyValue:210,modernValue:480,unit:"req/s",deltaPercent:128.57,source:"measured"},{name:"avg method time (ns)",tool:"jmh",legacyValue:1240,modernValue:830,unit:"ns",deltaPercent:-33.06,source:"measured"},{name:"SQL statements",tool:"sql",legacyValue:0,modernValue:0,unit:"statements",deltaPercent:0,source:"estimated"}],k={compositeBoostMin:35,compositeBoostMax:75,rows:[{id:"n-plus-one-eager",label:"N+1 query — eager collection fetch",severity:"critical",category:"performance",description:"FetchType.EAGER on a collection causes Hibernate to issue one SELECT per parent row, exploding query counts under load.",hitCount:3,exampleFile:"src/main/java/com/example/domain/Order.java",beforeCode:`@OneToMany(fetch = FetchType.EAGER)
private List<OrderItem> items;`,afterCode:`@OneToMany(fetch = FetchType.LAZY)
private List<OrderItem> items;

// In repository:
@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")
Optional<Order> findWithItems(@Param("id") Long id);`,fixSteps:["Change FetchType.EAGER → FetchType.LAZY on the @OneToMany/@ManyToMany.","Add a @Query with JOIN FETCH in the repository method that needs the collection.","Run ParityIT to verify response parity after the change."],boostMin:20,boostMax:55,boostMetric:"p95 latency"},{id:"blocking-http",label:"Blocking HTTP on request thread",severity:"critical",category:"performance",description:"RestTemplate.getForObject() blocks the servlet thread during remote calls. Under concurrency this starves the thread pool.",hitCount:2,exampleFile:"src/main/java/com/example/service/PaymentService.java",beforeCode:`RestTemplate rest = new RestTemplate();
String result = rest.getForObject(url, String.class);`,afterCode:`WebClient client = WebClient.create();
String result = client.get()
  .uri(url)
  .retrieve()
  .bodyToMono(String.class)
  .block();`,fixSteps:["Add spring-boot-starter-webflux to pom.xml.","Replace RestTemplate bean with WebClient.Builder.","Convert call sites to return Mono<T> or use .block() as a bridge."],boostMin:30,boostMax:70,boostMetric:"throughput"},{id:"javax-imports",label:"javax.* imports (Spring Boot 2 → 3 blocker)",severity:"critical",category:"modernization",description:"Spring Boot 3 renamed all javax.* packages to jakarta.*. Any remaining javax.persistence / javax.servlet import will fail to compile.",hitCount:47,exampleFile:"src/main/java/com/example/domain/Product.java",beforeCode:`import javax.persistence.Entity;
import javax.servlet.http.HttpServletRequest;`,afterCode:`import jakarta.persistence.Entity;
import jakarta.servlet.http.HttpServletRequest;`,fixSteps:['Run: find src -name "*.java" | xargs sed -i "s/javax\\.persistence/jakarta.persistence/g"',"Repeat for javax.servlet → jakarta.servlet and javax.validation → jakarta.validation.","Update pom.xml to Spring Boot 3.x parent."],boostMin:100,boostMax:100,boostMetric:"build success"},{id:"raw-thread-creation",label:"Raw Thread instantiation",severity:"major",category:"performance",description:"new Thread() bypasses thread-pool management and risks unbounded resource consumption. Use @Async or an ExecutorService.",hitCount:1,exampleFile:"src/main/java/com/example/service/NotificationService.java",beforeCode:"new Thread(() -> sendEmail(user)).start();",afterCode:`@Async
public CompletableFuture<Void> sendEmail(User user) { ... }`,fixSteps:["Add @EnableAsync to a @Configuration class.","Annotate the async method with @Async.","Return CompletableFuture<Void> so Spring can manage completion."],boostMin:10,boostMax:30,boostMetric:"throughput"},{id:"missing-transactional",label:"Multi-step DB write without @Transactional",severity:"major",category:"correctness",description:"Methods with multiple repository.save() calls without @Transactional leave the database partially updated on failure.",hitCount:2,exampleFile:"src/main/java/com/example/service/OrderService.java",beforeCode:`public void placeOrder(Order order) {
  orderRepo.save(order);
  inventoryRepo.deduct(order);
}`,afterCode:`@Transactional
public void placeOrder(Order order) {
  orderRepo.save(order);
  inventoryRepo.deduct(order);
}`,fixSteps:["Add @Transactional to service methods that perform multiple writes.","Ensure the method is called through the Spring proxy (not this.method()).","Add @Transactional(readOnly = true) to read-only methods for performance."],boostMin:0,boostMax:0,boostMetric:"reliability"}]},c=document.querySelector("#subagent-cards");c&&(c.innerHTML=M.map(e=>{const t=Math.round(e.progressDone/e.progressTotal*100),i=e.status==="running"?"":e.status==="verifying"?"amber":"muted";return`
        <div class="subagent-card">
          <div class="sa-header">
            <span class="sa-id">${e.id}</span>
            <span class="sa-status ${e.status}">${e.status}</span>
          </div>
          <div class="sa-title">${e.title}</div>
          <div class="sa-desc">${e.description}</div>
          <div class="sa-progress-wrap">
            <div class="sa-progress-meta">
              <span>${e.progressDone.toLocaleString()} / ${e.progressTotal.toLocaleString()} ${e.progressUnit}</span>
              <span class="sa-progress-pct">${t}%</span>
            </div>
            <div class="sa-progress-track">
              <div class="sa-progress-fill ${i}" style="width:${t}%"></div>
            </div>
          </div>
        </div>
      `}).join(""));const d=document.querySelector("#diff-label");d&&(d.textContent=o.label);const p=document.querySelector("#diff-legacy");p&&(p.innerHTML=o.legacy);const u=document.querySelector("#diff-modern");u&&(u.innerHTML=o.modern);const m=document.querySelector("#diff-parity");m&&(m.textContent=o.parityLine);const f=document.querySelector("#stats-footer");f&&(f.innerHTML=T.map(e=>`
        <div class="stat-block">
          <span class="stat-num">${e.value}</span>
          <span class="stat-desc">${e.label}</span>
        </div>
      `).join(""));function j(e){return e.status==="pass"?"✓":e.status==="skip"?"–":e.severity==="blocker"?"✕":"⚠"}function C(e){return e.status==="pass"?"pass":e.status==="skip"?"skip":e.severity==="blocker"?"blocker":"warning"}function x(e){const t=e.checks.some(s=>s.severity==="blocker"&&s.status==="fail"),i=e.tier==="measured"?"tier-measured":e.tier==="estimated"?"tier-estimated":"tier-unavailable";return`
    <div class="preflight-header">
      <span class="preflight-score">score <span class="preflight-score-num">${e.score}%</span></span>
      <span class="preflight-tier ${i}">${e.tier}</span>
    </div>
    <div class="preflight-list">
      ${e.checks.map(s=>{const a=C(s),r=j(s),n=s.remediation?`<span class="pf-remediation">→ ${s.remediation}</span>`:"";return`
          <div class="preflight-check ${a}">
            <span class="pf-icon">${r}</span>
            <div class="pf-body">
              <span class="pf-label">${s.label}</span>
              <span class="pf-detail">${s.detail}</span>
              ${n}
            </div>
          </div>`}).join("")}
    </div>
    ${t?'<p class="preflight-blocked">⛔ review disabled — resolve all blockers to continue</p>':""}
  `}const g=document.querySelector("#preflight-checks");g&&(g.innerHTML=x(l));const v=document.querySelector("#review-btn");if(v){const e=l.checks.some(t=>t.severity==="blocker"&&t.status==="fail");v.disabled=e}function L(e){return x(e)}function O(e,t){const a=(t==="ms"||t==="ns"?e<0:e>0)?"delta-good":e===0?"delta-neutral":"delta-bad",r=e>0?"+":"";return`<span class="perf-delta ${a}">${r}${e.toFixed(2)}%</span>`}function R(e){return e==="measured"?'<span class="badge-measured">measured</span>':'<span class="badge-estimated">estimated</span>'}function q(e){return`
    <table class="perf-table">
      <thead>
        <tr>
          <th>metric</th>
          <th>tool</th>
          <th>legacy</th>
          <th>modern</th>
          <th>delta</th>
          <th>source</th>
        </tr>
      </thead>
      <tbody>
        ${e.map(t=>`
          <tr>
            <td class="perf-name">${t.name}</td>
            <td class="perf-tool">${t.tool}</td>
            <td class="perf-val">${t.legacyValue.toLocaleString()} <span class="perf-unit">${t.unit}</span></td>
            <td class="perf-val">${t.modernValue.toLocaleString()} <span class="perf-unit">${t.unit}</span></td>
            <td>${O(t.deltaPercent,t.unit)}</td>
            <td>${R(t.source)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
  `}const y=document.querySelector("#requirements-panel");y&&(y.innerHTML=L(l));const b=document.querySelector("#perf-table");b&&(b.innerHTML=q(S));function B(e){return`<span class="sug-severity ${e==="critical"?"sug-critical":e==="major"?"sug-major":"sug-minor"}">${e}</span>`}function P(e){return`<span class="sug-category">${e}</span>`}function E(e){return e.boostMin===0&&e.boostMax===0?'<span class="sug-boost sug-boost-reliability">reliability fix</span>':`<span class="sug-boost">↑ ${e.boostMin}–${e.boostMax}% ${e.boostMetric}</span>`}function h(e){return e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function w(e){const t=e.compositeBoostMin>0?`<div class="sug-composite">
           projected composite improvement:
           <span class="sug-composite-num">${e.compositeBoostMin}–${e.compositeBoostMax}%</span>
           p95 latency if all performance patterns are fixed
         </div>`:"",i=e.rows.map(s=>{const a=s.fixSteps.map((r,n)=>`<li><span class="sug-step-num">${n+1}.</span> ${r}</li>`).join("");return`
      <div class="sug-card">
        <div class="sug-card-header">
          <div class="sug-card-meta">
            ${B(s.severity)}
            ${P(s.category)}
          </div>
          <div class="sug-card-right">
            ${E(s)}
            <span class="sug-hits">${s.hitCount} file${s.hitCount!==1?"s":""}</span>
          </div>
        </div>
        <div class="sug-label">${s.label}</div>
        <div class="sug-desc">${s.description}</div>
        <div class="sug-file">⌂ ${s.exampleFile}</div>
        <div class="sug-diff">
          <div class="sug-diff-col">
            <div class="sug-diff-header legacy-header">before</div>
            <pre class="sug-code">${h(s.beforeCode)}</pre>
          </div>
          <div class="sug-diff-col">
            <div class="sug-diff-header modern-header">after</div>
            <pre class="sug-code">${h(s.afterCode)}</pre>
          </div>
        </div>
        <ol class="sug-steps">${a}</ol>
      </div>`}).join("");return t+`<div class="sug-list">${i}</div>`}const $=document.querySelector("#suggestions-panel");$&&($.innerHTML=w(k));
