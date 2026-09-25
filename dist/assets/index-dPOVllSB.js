(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const a of e)if(a.type==="childList")for(const r of a.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function c(e){const a={};return e.integrity&&(a.integrity=e.integrity),e.referrerPolicy&&(a.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?a.credentials="include":e.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function s(e){if(e.ep)return;e.ep=!0;const a=c(e);fetch(e.href,a)}})();const d=[{label:"Refactor Speed",value:"70%",detail:"faster legacy modernization cycle"},{label:"Parity Confidence",value:"100%",detail:"business logic preserved in validation"},{label:"Release Readiness",value:"3x",detail:"faster deployment with containers and K8s"}],u=[{id:"01",title:"Document Understanding",accent:"cyan",summary:"Read legacy system docs, architecture blueprints, and business rules to build a modernization map.",deliverables:["Legacy system analysis","Target architecture mapping","Risk & dependency scan"]},{id:"02",title:"Code Refactorer",accent:"violet",summary:"Convert legacy Java 8 and outdated frameworks to Java 17 and Spring Boot 3 using guided transformations.",deliverables:["Syntax modernization","Framework migration","Cloud-ready code structure"]},{id:"03",title:"Parity Test Generator",accent:"green",summary:"Generate input/output equivalence tests to confirm business behavior remains identical across versions.",deliverables:["Regression suite","Golden test data","Behavior parity reports"]},{id:"04",title:"CI/CD Deployer",accent:"amber",summary:"Create Dockerfiles, Kubernetes manifests, and release pipelines for repeatable production deployments.",deliverables:["Containerization","Kubernetes manifests","Deployment automation"]}],p=[{title:"Manual effort reduction",value:"−70%",description:"Less time spent rewriting legacy code by hand and more focus on validation and governance."},{title:"Regression protection",value:"100%",description:"Parity checks ensure business logic is preserved before release to production."},{title:"Cloud readiness",value:"24/7",description:"Automated containers and release workflows keep the target platform continuously deployable."}],n=document.querySelector("#stats"),o=document.querySelector("#pipeline"),l=document.querySelector("#impact-cards");n&&(n.innerHTML=d.map(t=>`
        <div class="stat-card">
          <span class="stat-value">${t.value}</span>
          <span class="stat-label">${t.label}</span>
          <small>${t.detail}</small>
        </div>
      `).join(""));o&&(o.innerHTML=u.map(t=>`
        <article class="pipeline-card ${t.accent}">
          <div class="step-tag">${t.id}</div>
          <h4>${t.title}</h4>
          <p>${t.summary}</p>
          <ul>
            ${t.deliverables.map(i=>`<li>${i}</li>`).join("")}
          </ul>
        </article>
      `).join(""));l&&(l.innerHTML=p.map(t=>`
        <article class="impact-card">
          <p class="impact-value">${t.value}</p>
          <h4>${t.title}</h4>
          <p>${t.description}</p>
        </article>
      `).join(""));
