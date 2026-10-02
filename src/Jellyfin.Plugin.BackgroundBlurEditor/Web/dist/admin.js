"use strict";(()=>{function M(n,e){return{backdropOpacity:e.backdropOpacity??n.backdropOpacity,backdropBlur:e.backdropBlur??n.backdropBlur,panelGlassOpacity:e.panelGlassOpacity??n.panelGlassOpacity,panelGlassBlur:e.panelGlassBlur??n.panelGlassBlur}}function U(n){let e=v(n,"effective appearance");return{requestedItemId:u(e.requestedItemId,"requestedItemId"),ownerItemId:u(e.ownerItemId,"ownerItemId"),titleName:u(e.titleName,"titleName"),titleKind:q(e.titleKind),viewedKind:J(e.viewedKind),hasBackdrop:H(e.hasBackdrop,"hasBackdrop"),values:x(e.values)}}function G(n){let e=v(n,"editable appearance");return{requestedItemId:u(e.requestedItemId,"requestedItemId"),ownerItemId:u(e.ownerItemId,"ownerItemId"),titleName:u(e.titleName,"titleName"),titleKind:q(e.titleKind),viewedKind:J(e.viewedKind),hasBackdrop:H(e.hasBackdrop,"hasBackdrop"),global:x(e.global),override:z(e.override),effective:x(e.effective),revision:u(e.revision,"revision")}}function N(n){let e=v(n,"global appearance");return{values:x(e.values),revision:u(e.revision,"revision")}}function D(n){let e=v(n,"admin snapshot");if(!Array.isArray(e.titles))throw new Error("titles must be an array");return{global:N(e.global),titles:e.titles.map(re)}}function re(n){let e=v(n,"configured title"),t=e.titleKind;return{itemId:u(e.itemId,"itemId"),titleName:u(e.titleName,"titleName"),titleKind:t===null?null:q(t),isMissing:H(e.isMissing,"isMissing"),override:z(e.override),effective:x(e.effective),revision:u(e.revision,"revision")}}function x(n){let e=v(n,"appearance");return{backdropOpacity:E(e.backdropOpacity,0,100,"backdropOpacity"),backdropBlur:E(e.backdropBlur,0,50,"backdropBlur"),panelGlassOpacity:E(e.panelGlassOpacity,0,100,"panelGlassOpacity"),panelGlassBlur:E(e.panelGlassBlur,0,50,"panelGlassBlur")}}function z(n){let e=v(n,"appearance override");return{backdropOpacity:S(e.backdropOpacity,0,100,"backdropOpacity"),backdropBlur:S(e.backdropBlur,0,50,"backdropBlur"),panelGlassOpacity:S(e.panelGlassOpacity,0,100,"panelGlassOpacity"),panelGlassBlur:S(e.panelGlassBlur,0,50,"panelGlassBlur")}}function ae(n){return typeof n=="object"&&n!==null&&!Array.isArray(n)}function v(n,e){if(!ae(n))throw new Error(`${e} must be an object`);return n}function u(n,e){if(typeof n!="string"||n.length===0)throw new Error(`${e} must be a non-empty string`);return n}function H(n,e){if(typeof n!="boolean")throw new Error(`${e} must be a boolean`);return n}function E(n,e,t,a){if(typeof n!="number"||!Number.isInteger(n)||n<e||n>t)throw new Error(`${a} must be an integer from ${e} through ${t}`);return n}function S(n,e,t,a){return n===null?null:E(n,e,t,a)}function q(n){if(n!=="Movie"&&n!=="Series")throw new Error("titleKind is not supported");return n}function J(n){if(n!=="Movie"&&n!=="Series"&&n!=="Season"&&n!=="Episode")throw new Error("viewedKind is not supported");return n}var k=class extends Error{constructor(){super("The appearance changed in another editor.")}},$=class{async getSession(){let e=await this.request("GET","/BackgroundBlurEditor/v1/session");if(!_(e)||typeof e.canManage!="boolean")throw new Error("The session response is invalid.");return{canManage:e.canManage}}async getEffective(e){return U(await this.request("GET",`/BackgroundBlurEditor/v1/effective/${encodeURIComponent(e)}`))}async getEditor(e){return G(await this.request("GET",`/BackgroundBlurEditor/v1/admin/editor/${encodeURIComponent(e)}`))}async getSnapshot(e=""){let t=e.length===0?"":`?search=${encodeURIComponent(e)}`;return D(await this.request("GET",`/BackgroundBlurEditor/v1/admin/snapshot${t}`))}async saveGlobal(e,t){return N(await this.request("PUT","/BackgroundBlurEditor/v1/admin/global",{expectedRevision:t,...e}))}async saveTitle(e,t,a){return G(await this.request("PUT",`/BackgroundBlurEditor/v1/admin/titles/${encodeURIComponent(e)}`,{expectedRevision:a,...t}))}async resetTitle(e,t){let a=`?expectedRevision=${encodeURIComponent(t)}`;return G(await this.request("DELETE",`/BackgroundBlurEditor/v1/admin/titles/${encodeURIComponent(e)}${a}`))}async request(e,t,a){let r=ie(),i=a===void 0?{type:e,url:r.getUrl(t),dataType:"json"}:{type:e,url:r.getUrl(t),dataType:"json",contentType:"application/json",data:JSON.stringify(a)};try{return await r.ajax(i)}catch(s){throw oe(s)===409?new k:s}}};function ie(){let n=window.ApiClient;if(n===void 0)throw new Error("Jellyfin ApiClient is not available.");return n}function oe(n){return _(n)?typeof n.status=="number"?n.status:typeof n.statusCode=="number"?n.statusCode:null:null}function _(n){return typeof n=="object"&&n!==null&&!Array.isArray(n)}var V="bibe-styles";var le=`
.bibe-backdrop {
  opacity: calc(var(--bibe-backdrop-opacity, 100) / 100) !important;
  filter: var(--bibe-original-backdrop-filter, ) blur(calc(var(--bibe-backdrop-blur, 0) * 1px)) !important;
  transition: opacity 150ms ease, filter 150ms ease;
}
.bibe-panel {
  background-color: rgb(var(--bibe-panel-rgb, 24 24 24) / calc(var(--bibe-panel-opacity, 70) / 100)) !important;
  -webkit-backdrop-filter: blur(calc(var(--bibe-panel-blur, 0) * 1px)) !important;
  backdrop-filter: blur(calc(var(--bibe-panel-blur, 0) * 1px)) !important;
  transition: background-color 150ms ease, backdrop-filter 150ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .bibe-backdrop, .bibe-panel { transition: none !important; }
}
.bibe-dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(0 0 0 / 55%);
}
.bibe-dialog {
  width: min(38rem, 100%);
  max-height: min(48rem, 92vh);
  overflow: auto;
  color: #fff;
  background: rgb(28 28 30 / 96%);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 1rem;
  box-shadow: 0 1.5rem 5rem rgb(0 0 0 / 55%);
  padding: 1.25rem;
}
.bibe-dialog h2 { margin: 0 0 .25rem; }
.bibe-dialog-note { opacity: .72; margin: 0 0 1rem; }
.bibe-control { display: grid; grid-template-columns: 1fr 7rem; gap: .35rem 1rem; margin: 1rem 0; align-items: center; }
.bibe-control label { font-weight: 600; }
.bibe-control input[type=range] { width: 100%; }
.bibe-number { display: flex; align-items: center; gap: .35rem; }
.bibe-number input { width: 4.5rem; }
.bibe-inherit { grid-column: 1 / -1; font-size: .9rem; opacity: .85; }
.bibe-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .6rem; margin-top: 1.2rem; }
.bibe-actions button { min-width: 6rem; }
.bibe-error { color: #ffb4ab; min-height: 1.25rem; }
.bibe-admin { max-width: 72rem; margin: 0 auto; padding: 1rem; }
.bibe-admin-grid { display: grid; grid-template-columns: minmax(18rem, 1fr) minmax(18rem, 1fr); gap: 1.25rem; }
.bibe-card { padding: 1.1rem; border: 1px solid rgb(255 255 255 / 16%); border-radius: .8rem; background: rgb(255 255 255 / 5%); }
.bibe-preview { position: relative; min-height: 12rem; display: grid; place-items: center; border-radius: .8rem; overflow: hidden; }
.bibe-preview-image { position: absolute; inset: -3rem; background: linear-gradient(135deg,#8c1828,#44230c 55%,#170609); }
.bibe-preview-panel { position: relative; padding: 1rem 1.5rem; border-radius: .7rem; color: white; }
.bibe-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
.bibe-table th, .bibe-table td { padding: .7rem; text-align: left; border-bottom: 1px solid rgb(255 255 255 / 12%); }
.bibe-missing { color: #ffb4ab; }
@media (max-width: 700px) { .bibe-admin-grid { grid-template-columns: 1fr; } .bibe-control { grid-template-columns: 1fr; } }
`;function Y(){if(document.getElementById(V)!==null)return;let n=document.createElement("style");n.id=V,n.textContent=le,document.head.append(n)}function A(){return CSS.supports("backdrop-filter","blur(1px)")||CSS.supports("-webkit-backdrop-filter","blur(1px)")}var Q=[{key:"backdropOpacity",label:"Backdrop opacity",unit:"%",maximum:100},{key:"backdropBlur",label:"Backdrop blur",unit:"px",maximum:50},{key:"panelGlassOpacity",label:"Panel glass opacity",unit:"%",maximum:100},{key:"panelGlassBlur",label:"Panel glass blur",unit:"px",maximum:50}];async function X(n,e,t,a=()=>{}){let r=await n.getEditor(e);Z(n,r,t,a)}function Z(n,e,t,a){document.querySelector(".bibe-dialog-backdrop")?.remove();let r=document.createElement("div");r.className="bibe-dialog-backdrop",r.innerHTML=`
    <section class="bibe-dialog" role="dialog" aria-modal="true" aria-labelledby="bibe-editor-title">
      <h2 id="bibe-editor-title"></h2>
      <p class="bibe-dialog-note"></p>
      <form class="bibe-editor-form">
        <div class="bibe-controls"></div>
        <p class="bibe-error" role="alert"></p>
        <div class="bibe-actions">
          <button is="emby-button" type="button" class="raised bibe-reset">Reset title</button>
          <button is="emby-button" type="button" class="bibe-cancel">Cancel</button>
          <button is="emby-button" type="submit" class="raised button-submit">Save</button>
        </div>
      </form>
    </section>`;let i=h(r,"#bibe-editor-title");i.textContent=e.viewedKind==="Season"||e.viewedKind==="Episode"?`Edit series background appearance: ${e.titleName}`:`Edit background appearance: ${e.titleName}`;let s=h(r,".bibe-dialog-note"),l=[];e.hasBackdrop||l.push("This title has no backdrop image."),A()||l.push("This browser does not support panel backdrop blur."),s.textContent=l.join(" ");let o=h(r,".bibe-controls");for(let c of Q)o.insertAdjacentHTML("beforeend",se(c)),ce(o,c,e);let b=h(r,".bibe-error"),p=h(r,".bibe-editor-form"),d=h(r,".bibe-cancel"),w=h(r,".bibe-reset"),j=()=>{t(e.effective),r.remove()};for(let c of Q){let f=g(o,`${c.key}-range`),I=g(o,`${c.key}-number`),C=g(o,`${c.key}-inherit`);f.addEventListener("input",()=>{I.value=f.value,t(M(e.global,L(o,e)))}),I.addEventListener("input",()=>{f.value=I.value,t(M(e.global,L(o,e)))}),C.addEventListener("change",()=>{f.disabled=C.checked||B(c.key,e),I.disabled=C.checked||B(c.key,e),t(M(e.global,L(o,e)))})}d.addEventListener("click",j),r.addEventListener("click",c=>{c.target===r&&j()}),w.addEventListener("click",async()=>{if(window.confirm(`Reset ${e.titleName} to the global appearance?`)){P(p,!0);try{let c=await n.resetTitle(e.ownerItemId,e.revision);t(c.effective),r.remove(),a()}catch(c){await W(c,n,e,t,a,b,r)}finally{P(p,!1)}}}),p.addEventListener("submit",async c=>{c.preventDefault(),P(p,!0),b.textContent="";try{let f=await n.saveTitle(e.ownerItemId,L(o,e),e.revision);t(f.effective),r.remove(),a()}catch(f){await W(f,n,e,t,a,b,r)}finally{P(p,!1)}}),document.body.append(r),g(o,"backdropOpacity-range").focus()}async function W(n,e,t,a,r,i,s){if(n instanceof k){if(i.textContent="These settings changed in another editor.",window.confirm("Reload the current saved values?")){let l=await e.getEditor(t.ownerItemId);s.remove(),a(l.effective),Z(e,l,a,r)}return}i.textContent=n instanceof Error?n.message:"Could not save the appearance."}function se(n){return`<div class="bibe-control" data-field="${n.key}">
    <label for="${n.key}-range">${n.label}</label>
    <span class="bibe-number"><input id="${n.key}-number" type="number" min="0" max="${n.maximum}" step="1"><span>${n.unit}</span></span>
    <input id="${n.key}-range" type="range" min="0" max="${n.maximum}" step="1">
    <label class="bibe-inherit"><input id="${n.key}-inherit" type="checkbox"> Use global value</label>
  </div>`}function ce(n,e,t){let a=t.override[e.key]===null,r=t.override[e.key]??t.global[e.key],i=g(n,`${e.key}-range`),s=g(n,`${e.key}-number`),l=g(n,`${e.key}-inherit`);i.value=String(r),s.value=String(r),l.checked=a;let o=a||B(e.key,t);i.disabled=o,s.disabled=o,l.disabled=B(e.key,t)}function L(n,e){return{backdropOpacity:O(n,"backdropOpacity",e),backdropBlur:O(n,"backdropBlur",e),panelGlassOpacity:O(n,"panelGlassOpacity",e),panelGlassBlur:O(n,"panelGlassBlur",e)}}function O(n,e,t){return B(e,t)?t.override[e]:g(n,`${e}-inherit`).checked?null:Number.parseInt(g(n,`${e}-number`).value,10)}function B(n,e){return!e.hasBackdrop&&(n==="backdropOpacity"||n==="backdropBlur")}function P(n,e){for(let t of n.querySelectorAll("button"))t.disabled=e}function g(n,e){let t=n.querySelector(`#${e}`);if(t===null)throw new Error(`Missing editor input ${e}.`);return t}function h(n,e){let t=n.querySelector(e);if(t===null)throw new Error(`Missing editor element ${e}.`);return t}var F=[{key:"backdropOpacity",label:"Backdrop opacity",unit:"%",maximum:100},{key:"backdropBlur",label:"Backdrop blur",unit:"px",maximum:50},{key:"panelGlassOpacity",label:"Panel glass opacity",unit:"%",maximum:100},{key:"panelGlassBlur",label:"Panel glass blur",unit:"px",maximum:50}],te=()=>{let n=document.getElementById("BackgroundBlurEditorConfigPage");n!==null&&pe(n)};document.addEventListener("pageshow",te);te();async function pe(n){if(n.dataset.bibeInitialized==="true")return;n.dataset.bibeInitialized="true",Y();let e=new $,t=y(n,".bibe-admin-host");t.innerHTML=`
    <main class="bibe-admin">
      <h1>Background Image Blur Editor</h1>
      <p>Set the global glass treatment and manage movie or series overrides.</p>
      <div class="bibe-admin-grid">
        <form class="bibe-card bibe-global-form">
          <h2>Global appearance</h2>
          <div class="bibe-global-controls"></div>
          <p class="bibe-error" role="alert"></p>
          <button is="emby-button" type="submit" class="raised button-submit">Save global appearance</button>
        </form>
        <section class="bibe-card">
          <h2>Preview</h2>
          <div class="bibe-preview"><div class="bibe-preview-image"></div><div class="bibe-preview-panel">Text and controls stay sharp</div></div>
          <p class="bibe-dialog-note bibe-blur-support"></p>
        </section>
      </div>
      <section class="bibe-card" style="margin-top:1.25rem">
        <h2>Configured titles</h2>
        <label for="bibe-search">Search</label>
        <input is="emby-input" id="bibe-search" type="search" placeholder="Movie or series name">
        <div class="bibe-title-table"></div>
      </section>
    </main>`;let a=y(t,".bibe-global-controls");for(let p of F)a.insertAdjacentHTML("beforeend",be(p));let r=y(t,".bibe-blur-support");r.textContent=A()?"Panel backdrop blur is supported in this browser.":"Panel backdrop blur is unavailable in this browser; opacity still works.";let i;try{i=await e.getSnapshot()}catch(p){t.textContent=p instanceof Error?p.message:"Could not load plugin settings.";return}R(t,i.global.values),T(t,i.global.values);let s=async()=>{i=await e.getSnapshot(m(t,"bibe-search").value),ee(t,i,e,s)};ee(t,i,e,s);for(let p of F){let d=m(t,`${p.key}-range`),w=m(t,`${p.key}-number`);d.addEventListener("input",()=>{w.value=d.value,T(t,K(t))}),w.addEventListener("input",()=>{d.value=w.value,T(t,K(t))})}let l=y(t,".bibe-global-form"),o=y(l,".bibe-error");l.addEventListener("submit",async p=>{p.preventDefault(),ne(l,!0),o.textContent="";try{let d=await e.saveGlobal(K(t),i.global.revision);i={...i,global:d},R(t,d.values),T(t,d.values)}catch(d){d instanceof k?(o.textContent="Global settings changed in another editor. Reloading saved values.",i=await e.getSnapshot(m(t,"bibe-search").value),R(t,i.global.values),T(t,i.global.values)):o.textContent=d instanceof Error?d.message:"Could not save global settings."}finally{ne(l,!1)}});let b=0;m(t,"bibe-search").addEventListener("input",()=>{window.clearTimeout(b),b=window.setTimeout(async()=>{await s()},180)})}function ee(n,e,t,a){let r=y(n,".bibe-title-table");if(r.replaceChildren(),e.titles.length===0){r.textContent="No title overrides match this search.";return}let i=document.createElement("table");i.className="bibe-table",i.innerHTML="<thead><tr><th>Title</th><th>Backdrop</th><th>Panel glass</th><th>Actions</th></tr></thead><tbody></tbody>";let s=y(i,"tbody");for(let l of e.titles)s.append(de(l,t,a));r.append(i)}function de(n,e,t){let a=document.createElement("tr"),r=document.createElement("td");r.textContent=n.titleName,n.isMissing&&(r.className="bibe-missing",r.textContent+=" (missing)");let i=document.createElement("td");i.textContent=`${n.effective.backdropOpacity}% / ${n.effective.backdropBlur}px`;let s=document.createElement("td");s.textContent=`${n.effective.panelGlassOpacity}% / ${n.effective.panelGlassBlur}px`;let l=document.createElement("td");if(!n.isMissing){let b=document.createElement("button");b.type="button",b.textContent="Edit",b.addEventListener("click",()=>{X(e,n.itemId,()=>{},()=>{t()})}),l.append(b)}let o=document.createElement("button");return o.type="button",o.textContent=n.isMissing?"Remove":"Reset",o.addEventListener("click",async()=>{window.confirm(`${o.textContent} ${n.titleName}?`)&&(await e.resetTitle(n.itemId,n.revision),await t())}),l.append(o),a.append(r,i,s,l),a}function be(n){return`<div class="bibe-control">
    <label for="${n.key}-range">${n.label}</label>
    <span class="bibe-number"><input id="${n.key}-number" type="number" min="0" max="${n.maximum}" step="1"><span>${n.unit}</span></span>
    <input id="${n.key}-range" type="range" min="0" max="${n.maximum}" step="1">
  </div>`}function R(n,e){for(let t of F)m(n,`${t.key}-range`).value=String(e[t.key]),m(n,`${t.key}-number`).value=String(e[t.key])}function K(n){return{backdropOpacity:Number.parseInt(m(n,"backdropOpacity-number").value,10),backdropBlur:Number.parseInt(m(n,"backdropBlur-number").value,10),panelGlassOpacity:Number.parseInt(m(n,"panelGlassOpacity-number").value,10),panelGlassBlur:Number.parseInt(m(n,"panelGlassBlur-number").value,10)}}function T(n,e){let t=y(n,".bibe-preview-image"),a=y(n,".bibe-preview-panel");t.style.opacity=String(e.backdropOpacity/100),t.style.filter=`blur(${e.backdropBlur}px)`,a.style.backgroundColor=`rgb(24 24 24 / ${e.panelGlassOpacity}%)`,a.style.backdropFilter=A()?`blur(${e.panelGlassBlur}px)`:"none"}function ne(n,e){for(let t of n.querySelectorAll("button"))t.disabled=e}function m(n,e){let t=n.querySelector(`#${e}`);if(t===null)throw new Error(`Missing setting input ${e}.`);return t}function y(n,e){let t=n.querySelector(e);if(t===null)throw new Error(`Missing settings element ${e}.`);return t}})();
