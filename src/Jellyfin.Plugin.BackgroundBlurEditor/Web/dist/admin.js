"use strict";(()=>{function S(t,e){return{backdropOpacity:e.backdropOpacity??t.backdropOpacity,backdropBlur:e.backdropBlur??t.backdropBlur,panelGlassOpacity:e.panelGlassOpacity??t.panelGlassOpacity,panelGlassBlur:e.panelGlassBlur??t.panelGlassBlur}}function U(t){let e=k(t,"effective appearance");return{requestedItemId:u(e.requestedItemId,"requestedItemId"),ownerItemId:u(e.ownerItemId,"ownerItemId"),titleName:u(e.titleName,"titleName"),titleKind:q(e.titleKind),viewedKind:J(e.viewedKind),hasBackdrop:H(e.hasBackdrop,"hasBackdrop"),values:x(e.values)}}function L(t){let e=k(t,"editable appearance");return{requestedItemId:u(e.requestedItemId,"requestedItemId"),ownerItemId:u(e.ownerItemId,"ownerItemId"),titleName:u(e.titleName,"titleName"),titleKind:q(e.titleKind),viewedKind:J(e.viewedKind),hasBackdrop:H(e.hasBackdrop,"hasBackdrop"),global:x(e.global),override:z(e.override),effective:x(e.effective),revision:u(e.revision,"revision")}}function N(t){let e=k(t,"global appearance");return{values:x(e.values),revision:u(e.revision,"revision")}}function D(t){let e=k(t,"admin snapshot");if(!Array.isArray(e.titles))throw new Error("titles must be an array");return{global:N(e.global),titles:e.titles.map(re)}}function re(t){let e=k(t,"configured title"),n=e.titleKind;return{itemId:u(e.itemId,"itemId"),titleName:u(e.titleName,"titleName"),titleKind:n===null?null:q(n),isMissing:H(e.isMissing,"isMissing"),override:z(e.override),effective:x(e.effective),revision:u(e.revision,"revision")}}function x(t){let e=k(t,"appearance");return{backdropOpacity:w(e.backdropOpacity,0,100,"backdropOpacity"),backdropBlur:w(e.backdropBlur,0,50,"backdropBlur"),panelGlassOpacity:w(e.panelGlassOpacity,0,100,"panelGlassOpacity"),panelGlassBlur:w(e.panelGlassBlur,0,50,"panelGlassBlur")}}function z(t){let e=k(t,"appearance override");return{backdropOpacity:M(e.backdropOpacity,0,100,"backdropOpacity"),backdropBlur:M(e.backdropBlur,0,50,"backdropBlur"),panelGlassOpacity:M(e.panelGlassOpacity,0,100,"panelGlassOpacity"),panelGlassBlur:M(e.panelGlassBlur,0,50,"panelGlassBlur")}}function ae(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)}function k(t,e){if(!ae(t))throw new Error(`${e} must be an object`);return t}function u(t,e){if(typeof t!="string"||t.length===0)throw new Error(`${e} must be a non-empty string`);return t}function H(t,e){if(typeof t!="boolean")throw new Error(`${e} must be a boolean`);return t}function w(t,e,n,a){if(typeof t!="number"||!Number.isInteger(t)||t<e||t>n)throw new Error(`${a} must be an integer from ${e} through ${n}`);return t}function M(t,e,n,a){return t==null?null:w(t,e,n,a)}function q(t){if(t!=="Movie"&&t!=="Series")throw new Error("titleKind is not supported");return t}function J(t){if(t!=="Movie"&&t!=="Series"&&t!=="Season"&&t!=="Episode")throw new Error("viewedKind is not supported");return t}var h=class extends Error{constructor(){super("The appearance changed in another editor.")}},G=class{async getSession(){let e=await this.request("GET","/BackgroundBlurEditor/v1/session");if(!_(e)||typeof e.canManage!="boolean")throw new Error("The session response is invalid.");return{canManage:e.canManage}}async getEffective(e){return U(await this.request("GET",`/BackgroundBlurEditor/v1/effective/${encodeURIComponent(e)}`))}async getEditor(e){return L(await this.request("GET",`/BackgroundBlurEditor/v1/admin/editor/${encodeURIComponent(e)}`))}async getSnapshot(e=""){let n=e.length===0?"":`?search=${encodeURIComponent(e)}`;return D(await this.request("GET",`/BackgroundBlurEditor/v1/admin/snapshot${n}`))}async saveGlobal(e,n){return N(await this.request("PUT","/BackgroundBlurEditor/v1/admin/global",{expectedRevision:n,...e}))}async saveTitle(e,n,a){return L(await this.request("PUT",`/BackgroundBlurEditor/v1/admin/titles/${encodeURIComponent(e)}`,{expectedRevision:a,...n}))}async resetTitle(e,n){let a=`?expectedRevision=${encodeURIComponent(n)}`;return L(await this.request("DELETE",`/BackgroundBlurEditor/v1/admin/titles/${encodeURIComponent(e)}${a}`))}async request(e,n,a){let r=ie(),i=a===void 0?{type:e,url:r.getUrl(n),dataType:"json"}:{type:e,url:r.getUrl(n),dataType:"json",contentType:"application/json",data:JSON.stringify(a)};try{return await r.ajax(i)}catch(s){throw oe(s)===409?new h:s}}};function ie(){let t=window.ApiClient;if(t===void 0)throw new Error("Jellyfin ApiClient is not available.");return t}function oe(t){return _(t)?typeof t.status=="number"?t.status:typeof t.statusCode=="number"?t.statusCode:null:null}function _(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)}var V="bibe-styles";var le=`
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
`;function Y(){if(document.getElementById(V)!==null)return;let t=document.createElement("style");t.id=V,t.textContent=le,document.head.append(t)}function A(){return CSS.supports("backdrop-filter","blur(1px)")||CSS.supports("-webkit-backdrop-filter","blur(1px)")}var Q=[{key:"backdropOpacity",label:"Backdrop opacity",unit:"%",maximum:100},{key:"backdropBlur",label:"Backdrop blur",unit:"px",maximum:50},{key:"panelGlassOpacity",label:"Panel glass opacity",unit:"%",maximum:100},{key:"panelGlassBlur",label:"Panel glass blur",unit:"px",maximum:50}];async function X(t,e,n,a=()=>{}){document.querySelector(".bibe-dialog-backdrop")?.remove();let r=document.createElement("div");r.className="bibe-dialog-backdrop",r.innerHTML=`
    <section class="bibe-dialog" role="dialog" aria-modal="true" aria-labelledby="bibe-editor-title">
      <h2 id="bibe-editor-title">Background appearance</h2>
      <p class="bibe-dialog-note">Loading settings...</p>
      <p class="bibe-error" role="alert"></p>
      <div class="bibe-actions">
        <button is="emby-button" type="button" class="bibe-load-close" hidden>Close</button>
      </div>
    </section>`;let i=g(r,".bibe-dialog-note"),s=g(r,".bibe-error"),l=g(r,".bibe-load-close");l.addEventListener("click",()=>r.remove()),document.body.append(r);try{let o=await t.getEditor(e);r.remove(),Z(t,o,n,a)}catch(o){i.textContent="Could not load background appearance.",s.textContent=o instanceof Error?o.message:"The server request failed.",l.hidden=!1,l.focus()}}function Z(t,e,n,a){document.querySelector(".bibe-dialog-backdrop")?.remove();let r=document.createElement("div");r.className="bibe-dialog-backdrop",r.innerHTML=`
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
    </section>`;let i=g(r,"#bibe-editor-title");i.textContent=e.viewedKind==="Season"||e.viewedKind==="Episode"?`Edit series background appearance: ${e.titleName}`:`Edit background appearance: ${e.titleName}`;let s=g(r,".bibe-dialog-note"),l=[];e.hasBackdrop||l.push("This title has no backdrop image."),A()||l.push("This browser does not support panel backdrop blur."),s.textContent=l.join(" ");let o=g(r,".bibe-controls");for(let c of Q)o.insertAdjacentHTML("beforeend",se(c)),ce(o,c,e);let b=g(r,".bibe-error"),p=g(r,".bibe-editor-form"),d=g(r,".bibe-cancel"),E=g(r,".bibe-reset"),j=()=>{n(e.effective),r.remove()};for(let c of Q){let v=y(o,`${c.key}-range`),I=y(o,`${c.key}-number`),P=y(o,`${c.key}-inherit`);v.addEventListener("input",()=>{I.value=v.value,n(S(e.global,$(o,e)))}),I.addEventListener("input",()=>{v.value=I.value,n(S(e.global,$(o,e)))}),P.addEventListener("change",()=>{v.disabled=P.checked||T(c.key,e),I.disabled=P.checked||T(c.key,e),n(S(e.global,$(o,e)))})}d.addEventListener("click",j),r.addEventListener("click",c=>{c.target===r&&j()}),E.addEventListener("click",async()=>{if(window.confirm(`Reset ${e.titleName} to the global appearance?`)){O(p,!0);try{let c=await t.resetTitle(e.ownerItemId,e.revision);n(c.effective),r.remove(),a()}catch(c){await W(c,t,e,n,a,b,r)}finally{O(p,!1)}}}),p.addEventListener("submit",async c=>{c.preventDefault(),O(p,!0),b.textContent="";try{let v=await t.saveTitle(e.ownerItemId,$(o,e),e.revision);n(v.effective),r.remove(),a()}catch(v){await W(v,t,e,n,a,b,r)}finally{O(p,!1)}}),document.body.append(r),y(o,"backdropOpacity-range").focus()}async function W(t,e,n,a,r,i,s){if(t instanceof h){if(i.textContent="These settings changed in another editor.",window.confirm("Reload the current saved values?")){let l=await e.getEditor(n.ownerItemId);s.remove(),a(l.effective),Z(e,l,a,r)}return}i.textContent=t instanceof Error?t.message:"Could not save the appearance."}function se(t){return`<div class="bibe-control" data-field="${t.key}">
    <label for="${t.key}-range">${t.label}</label>
    <span class="bibe-number"><input id="${t.key}-number" type="number" min="0" max="${t.maximum}" step="1"><span>${t.unit}</span></span>
    <input id="${t.key}-range" type="range" min="0" max="${t.maximum}" step="1">
    <label class="bibe-inherit"><input id="${t.key}-inherit" type="checkbox"> Use global value</label>
  </div>`}function ce(t,e,n){let a=n.override[e.key]===null,r=n.override[e.key]??n.global[e.key],i=y(t,`${e.key}-range`),s=y(t,`${e.key}-number`),l=y(t,`${e.key}-inherit`);i.value=String(r),s.value=String(r),l.checked=a;let o=a||T(e.key,n);i.disabled=o,s.disabled=o,l.disabled=T(e.key,n)}function $(t,e){return{backdropOpacity:C(t,"backdropOpacity",e),backdropBlur:C(t,"backdropBlur",e),panelGlassOpacity:C(t,"panelGlassOpacity",e),panelGlassBlur:C(t,"panelGlassBlur",e)}}function C(t,e,n){return T(e,n)?n.override[e]:y(t,`${e}-inherit`).checked?null:Number.parseInt(y(t,`${e}-number`).value,10)}function T(t,e){return!e.hasBackdrop&&(t==="backdropOpacity"||t==="backdropBlur")}function O(t,e){for(let n of t.querySelectorAll("button"))n.disabled=e}function y(t,e){let n=t.querySelector(`#${e}`);if(n===null)throw new Error(`Missing editor input ${e}.`);return n}function g(t,e){let n=t.querySelector(e);if(n===null)throw new Error(`Missing editor element ${e}.`);return n}var F=[{key:"backdropOpacity",label:"Backdrop opacity",unit:"%",maximum:100},{key:"backdropBlur",label:"Backdrop blur",unit:"px",maximum:50},{key:"panelGlassOpacity",label:"Panel glass opacity",unit:"%",maximum:100},{key:"panelGlassBlur",label:"Panel glass blur",unit:"px",maximum:50}],ne=()=>{let t=document.getElementById("BackgroundBlurEditorConfigPage");t!==null&&pe(t)};document.addEventListener("pageshow",ne);ne();async function pe(t){if(t.dataset.bibeInitialized==="true")return;t.dataset.bibeInitialized="true",Y();let e=new G,n=f(t,".bibe-admin-host");n.innerHTML=`
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
    </main>`;let a=f(n,".bibe-global-controls");for(let p of F)a.insertAdjacentHTML("beforeend",be(p));let r=f(n,".bibe-blur-support");r.textContent=A()?"Panel backdrop blur is supported in this browser.":"Panel backdrop blur is unavailable in this browser; opacity still works.";let i;try{i=await e.getSnapshot()}catch(p){n.textContent=p instanceof Error?p.message:"Could not load plugin settings.";return}R(n,i.global.values),B(n,i.global.values);let s=async()=>{i=await e.getSnapshot(m(n,"bibe-search").value),ee(n,i,e,s)};ee(n,i,e,s);for(let p of F){let d=m(n,`${p.key}-range`),E=m(n,`${p.key}-number`);d.addEventListener("input",()=>{E.value=d.value,B(n,K(n))}),E.addEventListener("input",()=>{d.value=E.value,B(n,K(n))})}let l=f(n,".bibe-global-form"),o=f(l,".bibe-error");l.addEventListener("submit",async p=>{p.preventDefault(),te(l,!0),o.textContent="";try{let d=await e.saveGlobal(K(n),i.global.revision);i={...i,global:d},R(n,d.values),B(n,d.values)}catch(d){d instanceof h?(o.textContent="Global settings changed in another editor. Reloading saved values.",i=await e.getSnapshot(m(n,"bibe-search").value),R(n,i.global.values),B(n,i.global.values)):o.textContent=d instanceof Error?d.message:"Could not save global settings."}finally{te(l,!1)}});let b=0;m(n,"bibe-search").addEventListener("input",()=>{window.clearTimeout(b),b=window.setTimeout(async()=>{await s()},180)})}function ee(t,e,n,a){let r=f(t,".bibe-title-table");if(r.replaceChildren(),e.titles.length===0){r.textContent="No title overrides match this search.";return}let i=document.createElement("table");i.className="bibe-table",i.innerHTML="<thead><tr><th>Title</th><th>Backdrop</th><th>Panel glass</th><th>Actions</th></tr></thead><tbody></tbody>";let s=f(i,"tbody");for(let l of e.titles)s.append(de(l,n,a));r.append(i)}function de(t,e,n){let a=document.createElement("tr"),r=document.createElement("td");r.textContent=t.titleName,t.isMissing&&(r.className="bibe-missing",r.textContent+=" (missing)");let i=document.createElement("td");i.textContent=`${t.effective.backdropOpacity}% / ${t.effective.backdropBlur}px`;let s=document.createElement("td");s.textContent=`${t.effective.panelGlassOpacity}% / ${t.effective.panelGlassBlur}px`;let l=document.createElement("td");if(!t.isMissing){let b=document.createElement("button");b.type="button",b.textContent="Edit",b.addEventListener("click",()=>{X(e,t.itemId,()=>{},()=>{n()})}),l.append(b)}let o=document.createElement("button");return o.type="button",o.textContent=t.isMissing?"Remove":"Reset",o.addEventListener("click",async()=>{window.confirm(`${o.textContent} ${t.titleName}?`)&&(await e.resetTitle(t.itemId,t.revision),await n())}),l.append(o),a.append(r,i,s,l),a}function be(t){return`<div class="bibe-control">
    <label for="${t.key}-range">${t.label}</label>
    <span class="bibe-number"><input id="${t.key}-number" type="number" min="0" max="${t.maximum}" step="1"><span>${t.unit}</span></span>
    <input id="${t.key}-range" type="range" min="0" max="${t.maximum}" step="1">
  </div>`}function R(t,e){for(let n of F)m(t,`${n.key}-range`).value=String(e[n.key]),m(t,`${n.key}-number`).value=String(e[n.key])}function K(t){return{backdropOpacity:Number.parseInt(m(t,"backdropOpacity-number").value,10),backdropBlur:Number.parseInt(m(t,"backdropBlur-number").value,10),panelGlassOpacity:Number.parseInt(m(t,"panelGlassOpacity-number").value,10),panelGlassBlur:Number.parseInt(m(t,"panelGlassBlur-number").value,10)}}function B(t,e){let n=f(t,".bibe-preview-image"),a=f(t,".bibe-preview-panel");n.style.opacity=String(e.backdropOpacity/100),n.style.filter=`blur(${e.backdropBlur}px)`,a.style.backgroundColor=`rgb(24 24 24 / ${e.panelGlassOpacity}%)`,a.style.backdropFilter=A()?`blur(${e.panelGlassBlur}px)`:"none"}function te(t,e){for(let n of t.querySelectorAll("button"))n.disabled=e}function m(t,e){let n=t.querySelector(`#${e}`);if(n===null)throw new Error(`Missing setting input ${e}.`);return n}function f(t,e){let n=t.querySelector(e);if(n===null)throw new Error(`Missing settings element ${e}.`);return n}})();
