"use strict";(()=>{function S(t,e){return{backdropOpacity:e.backdropOpacity??t.backdropOpacity,backdropBlur:e.backdropBlur??t.backdropBlur,panelGlassOpacity:e.panelGlassOpacity??t.panelGlassOpacity,panelGlassBlur:e.panelGlassBlur??t.panelGlassBlur}}function U(t){let e=v(t,"effective appearance");return{requestedItemId:p(e.requestedItemId,"requestedItemId"),ownerItemId:p(e.ownerItemId,"ownerItemId"),titleName:p(e.titleName,"titleName"),titleKind:H(e.titleKind),viewedKind:_(e.viewedKind),hasBackdrop:N(e.hasBackdrop,"hasBackdrop"),values:E(e.values)}}function L(t){let e=v(t,"editable appearance");return{requestedItemId:p(e.requestedItemId,"requestedItemId"),ownerItemId:p(e.ownerItemId,"ownerItemId"),titleName:p(e.titleName,"titleName"),titleKind:H(e.titleKind),viewedKind:_(e.viewedKind),hasBackdrop:N(e.hasBackdrop,"hasBackdrop"),global:E(e.global),override:j(e.override),effective:E(e.effective),revision:p(e.revision,"revision")}}function $(t){let e=v(t,"global appearance");return{values:E(e.values),revision:p(e.revision,"revision")}}function F(t){let e=v(t,"admin snapshot");if(!Array.isArray(e.titles))throw new Error("titles must be an array");return{global:$(e.global),titles:e.titles.map(re)}}function re(t){let e=v(t,"configured title"),n=e.titleKind;return{itemId:p(e.itemId,"itemId"),titleName:p(e.titleName,"titleName"),titleKind:n===null?null:H(n),isMissing:N(e.isMissing,"isMissing"),override:j(e.override),effective:E(e.effective),revision:p(e.revision,"revision")}}function E(t){let e=v(t,"appearance");return{backdropOpacity:h(e.backdropOpacity,0,100,"backdropOpacity"),backdropBlur:h(e.backdropBlur,0,50,"backdropBlur"),panelGlassOpacity:h(e.panelGlassOpacity,0,100,"panelGlassOpacity"),panelGlassBlur:h(e.panelGlassBlur,0,50,"panelGlassBlur")}}function j(t){let e=v(t,"appearance override");return{backdropOpacity:T(e.backdropOpacity,0,100,"backdropOpacity"),backdropBlur:T(e.backdropBlur,0,50,"backdropBlur"),panelGlassOpacity:T(e.panelGlassOpacity,0,100,"panelGlassOpacity"),panelGlassBlur:T(e.panelGlassBlur,0,50,"panelGlassBlur")}}function ie(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)}function v(t,e){if(!ie(t))throw new Error(`${e} must be an object`);return t}function p(t,e){if(typeof t!="string"||t.length===0)throw new Error(`${e} must be a non-empty string`);return t}function N(t,e){if(typeof t!="boolean")throw new Error(`${e} must be a boolean`);return t}function h(t,e,n,i){if(typeof t!="number"||!Number.isInteger(t)||t<e||t>n)throw new Error(`${i} must be an integer from ${e} through ${n}`);return t}function T(t,e,n,i){return t==null?null:h(t,e,n,i)}function H(t){if(t!=="Movie"&&t!=="Series")throw new Error("titleKind is not supported");return t}function _(t){if(t!=="Movie"&&t!=="Series"&&t!=="Season"&&t!=="Episode")throw new Error("viewedKind is not supported");return t}var A=class extends Error{constructor(){super("The appearance changed in another editor.")}},M=class{async getSession(){let e=await this.request("GET","/BackgroundBlurEditor/v1/session");if(!J(e)||typeof e.canManage!="boolean")throw new Error("The session response is invalid.");return{canManage:e.canManage}}async getEffective(e){return U(await this.request("GET",`/BackgroundBlurEditor/v1/effective/${encodeURIComponent(e)}`))}async getEditor(e){return L(await this.request("GET",`/BackgroundBlurEditor/v1/admin/editor/${encodeURIComponent(e)}`))}async getSnapshot(e=""){let n=e.length===0?"":`?search=${encodeURIComponent(e)}`;return F(await this.request("GET",`/BackgroundBlurEditor/v1/admin/snapshot${n}`))}async saveGlobal(e,n){return $(await this.request("PUT","/BackgroundBlurEditor/v1/admin/global",{expectedRevision:n,...e}))}async saveTitle(e,n,i){return L(await this.request("PUT",`/BackgroundBlurEditor/v1/admin/titles/${encodeURIComponent(e)}`,{expectedRevision:i,...n}))}async resetTitle(e,n){let i=`?expectedRevision=${encodeURIComponent(n)}`;return L(await this.request("DELETE",`/BackgroundBlurEditor/v1/admin/titles/${encodeURIComponent(e)}${i}`))}async request(e,n,i){let r=oe(),a=i===void 0?{type:e,url:r.getUrl(n),dataType:"json"}:{type:e,url:r.getUrl(n),dataType:"json",contentType:"application/json",data:JSON.stringify(i)};try{return await r.ajax(a)}catch(c){throw ae(c)===409?new A:c}}};function oe(){let t=window.ApiClient;if(t===void 0)throw new Error("Jellyfin ApiClient is not available.");return t}function ae(t){return J(t)?typeof t.status=="number"?t.status:typeof t.statusCode=="number"?t.statusCode:null:null}function J(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)}var z="bibe-styles",le=[".detailRibbon",".detailPageSecondaryContainer"],se=`
.bibe-backdrop,
html .backdropContainer .bibe-backdrop,
#itemDetailPage #itemBackdrop.bibe-backdrop {
  opacity: calc(var(--bibe-backdrop-opacity, 100) / 100) !important;
  filter: var(--bibe-base-backdrop-filter, ) blur(calc(var(--bibe-backdrop-blur, 0) * 1px)) !important;
  transition: opacity 150ms ease, filter 150ms ease;
}
.bibe-panel,
#itemDetailPage .detailRibbon.bibe-panel,
#itemDetailPage .detailPageSecondaryContainer.bibe-panel,
html .actionSheet.bibe-panel {
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
.bibe-actions .formDialogFooterItem {
  flex: 1 1 0;
  width: auto;
  min-width: 8rem;
  max-width: none;
  margin: 0 !important;
}
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
`;function V(){if(document.getElementById(z)!==null)return;let t=document.createElement("style");t.id=z,t.textContent=se,document.head.append(t)}function O(t){I();let e=de();if(e===null)return;let n=new Set([...document.querySelectorAll(".backdropContainer .backdropImage"),...e.querySelectorAll("#itemBackdrop, .backdropImage")]);for(let i of n){let r=window.getComputedStyle(i).filter;i.style.setProperty("--bibe-base-backdrop-filter",ce(r)),i.classList.add("bibe-backdrop"),i.style.setProperty("--bibe-backdrop-opacity",String(t.backdropOpacity)),i.style.setProperty("--bibe-backdrop-blur",String(t.backdropBlur))}for(let i of le)for(let r of e.querySelectorAll(i))R(r,t)}function R(t,e){t.classList.add("bibe-panel"),t.style.setProperty("--bibe-panel-rgb",pe()),t.style.setProperty("--bibe-panel-opacity",String(e.panelGlassOpacity)),t.style.setProperty("--bibe-panel-blur",K()?String(e.panelGlassBlur):"0")}function I(){for(let t of document.querySelectorAll(".bibe-backdrop, .bibe-panel")){t.classList.remove("bibe-backdrop","bibe-panel");for(let e of["--bibe-backdrop-opacity","--bibe-backdrop-blur","--bibe-base-backdrop-filter","--bibe-panel-rgb","--bibe-panel-opacity","--bibe-panel-blur"])t.style.removeProperty(e)}}function ce(t){return t==="none"?"":t.replace(/\bblur\([^)]*\)/giu,"").replace(/\s+/gu," ").trim()}function K(){return CSS.supports("backdrop-filter","blur(1px)")||CSS.supports("-webkit-backdrop-filter","blur(1px)")}function de(){let t=document.querySelectorAll("#itemDetailPage");for(let e of t)if(!e.classList.contains("hide")&&e.getClientRects().length>0)return e;return t.item(t.length-1)}function pe(){let t=window.getComputedStyle(document.body).backgroundColor,e=/^rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i.exec(t);return e?.[1]!==void 0&&e[2]!==void 0&&e[3]!==void 0?`${e[1]} ${e[2]} ${e[3]}`:"24 24 24"}function Y(t,e){return!(t.target instanceof Element)||t.target.closest("[data-bibe-edit-action]")===null?!1:(t.preventDefault(),window.setTimeout(e,0),!0)}function D(t){let e=document.querySelectorAll("dialog.actionSheet, .actionSheet"),n=e.item(e.length-1);if(n===null)return!1;if(n.querySelector("[data-bibe-edit-action]")!==null)return!0;let i=n.querySelector(".actionSheetScroller");if(i===null)return!1;R(n,t.values);let r=document.createElement("button");r.type="button",r.className="listItem listItem-button actionSheetMenuItem emby-button",r.dataset.bibeEditAction="true",r.innerHTML='<span class="actionsheetMenuItemIcon listItemIcon listItemIcon-transparent material-icons blur_on" aria-hidden="true"></span><div class="listItemBody actionsheetListItemBody"><div class="listItemBodyText actionSheetItemText"></div></div>';let a=r.querySelector(".actionSheetItemText");return a!==null&&(a.textContent=t.viewedKind==="Season"||t.viewedKind==="Episode"?"Edit series background appearance":"Edit background appearance"),i.append(r),!0}var Q=[{key:"backdropOpacity",label:"Backdrop opacity",unit:"%",maximum:100},{key:"backdropBlur",label:"Backdrop blur",unit:"px",maximum:50},{key:"panelGlassOpacity",label:"Panel glass opacity",unit:"%",maximum:100},{key:"panelGlassBlur",label:"Panel glass blur",unit:"px",maximum:50}];async function X(t,e,n,i=()=>{}){document.querySelector(".bibe-dialog-backdrop")?.remove();let r=document.createElement("div");r.className="bibe-dialog-backdrop",r.innerHTML=`
    <section class="bibe-dialog" role="dialog" aria-modal="true" aria-labelledby="bibe-editor-title">
      <h2 id="bibe-editor-title">Background appearance</h2>
      <p class="bibe-dialog-note">Loading settings...</p>
      <p class="bibe-error" role="alert"></p>
      <div class="bibe-actions">
        <button is="emby-button" type="button" class="emby-button raised button-cancel block formDialogFooterItem bibe-load-close" hidden>Close</button>
      </div>
    </section>`;let a=b(r,".bibe-dialog-note"),c=b(r,".bibe-error"),l=b(r,".bibe-load-close");l.addEventListener("click",()=>r.remove()),document.body.append(r);try{let o=await t.getEditor(e);r.remove(),Z(t,o,n,i)}catch(o){a.textContent="Could not load background appearance.",c.textContent=o instanceof Error?o.message:"The server request failed.",l.hidden=!1,l.focus()}}function Z(t,e,n,i){document.querySelector(".bibe-dialog-backdrop")?.remove();let r=document.createElement("div");r.className="bibe-dialog-backdrop",r.innerHTML=`
    <section class="bibe-dialog" role="dialog" aria-modal="true" aria-labelledby="bibe-editor-title">
      <h2 id="bibe-editor-title"></h2>
      <p class="bibe-dialog-note"></p>
      <form class="bibe-editor-form">
        <div class="bibe-controls"></div>
        <p class="bibe-error" role="alert"></p>
        <div class="bibe-actions">
          <button is="emby-button" type="button" class="emby-button raised button-cancel block formDialogFooterItem bibe-reset">Reset title</button>
          <button is="emby-button" type="button" class="emby-button raised button-cancel block formDialogFooterItem bibe-cancel">Cancel</button>
          <button is="emby-button" type="submit" class="emby-button raised button-submit block formDialogFooterItem">Save</button>
        </div>
      </form>
    </section>`;let a=b(r,"#bibe-editor-title");a.textContent=e.viewedKind==="Season"||e.viewedKind==="Episode"?`Edit series background appearance: ${e.titleName}`:`Edit background appearance: ${e.titleName}`;let c=b(r,".bibe-dialog-note"),l=[];e.hasBackdrop||l.push("This title has no backdrop image."),K()||l.push("This browser does not support panel backdrop blur."),c.textContent=l.join(" ");let o=b(r,".bibe-controls");for(let s of Q)o.insertAdjacentHTML("beforeend",ue(s)),be(o,s,e);let d=b(r,".bibe-error"),f=b(r,".bibe-editor-form"),u=b(r,".bibe-cancel"),k=b(r,".bibe-reset"),g=()=>{n(e.effective),r.remove()};for(let s of Q){let y=m(o,`${s.key}-range`),B=m(o,`${s.key}-number`),C=m(o,`${s.key}-inherit`);y.addEventListener("input",()=>{B.value=y.value,n(S(e.global,P(o,e)))}),B.addEventListener("input",()=>{y.value=B.value,n(S(e.global,P(o,e)))}),C.addEventListener("change",()=>{y.disabled=C.checked||x(s.key,e),B.disabled=C.checked||x(s.key,e),n(S(e.global,P(o,e)))})}u.addEventListener("click",g),r.addEventListener("click",s=>{s.target===r&&g()}),k.addEventListener("click",async()=>{if(window.confirm(`Reset ${e.titleName} to the global appearance?`)){G(f,!0);try{let s=await t.resetTitle(e.ownerItemId,e.revision);n(s.effective),r.remove(),i()}catch(s){await W(s,t,e,n,i,d,r)}finally{G(f,!1)}}}),f.addEventListener("submit",async s=>{s.preventDefault(),G(f,!0),d.textContent="";try{let y=await t.saveTitle(e.ownerItemId,P(o,e),e.revision);n(y.effective),r.remove(),i()}catch(y){await W(y,t,e,n,i,d,r)}finally{G(f,!1)}}),document.body.append(r),m(o,"backdropOpacity-range").focus()}async function W(t,e,n,i,r,a,c){if(t instanceof A){if(a.textContent="These settings changed in another editor.",window.confirm("Reload the current saved values?")){let l=await e.getEditor(n.ownerItemId);c.remove(),i(l.effective),Z(e,l,i,r)}return}a.textContent=t instanceof Error?t.message:"Could not save the appearance."}function ue(t){return`<div class="bibe-control" data-field="${t.key}">
    <label for="${t.key}-range">${t.label}</label>
    <span class="bibe-number"><input id="${t.key}-number" type="number" min="0" max="${t.maximum}" step="1"><span>${t.unit}</span></span>
    <input id="${t.key}-range" type="range" min="0" max="${t.maximum}" step="1">
    <label class="bibe-inherit"><input id="${t.key}-inherit" type="checkbox"> Use global value</label>
  </div>`}function be(t,e,n){let i=n.override[e.key]===null,r=n.override[e.key]??n.global[e.key],a=m(t,`${e.key}-range`),c=m(t,`${e.key}-number`),l=m(t,`${e.key}-inherit`);a.value=String(r),c.value=String(r),l.checked=i;let o=i||x(e.key,n);a.disabled=o,c.disabled=o,l.disabled=x(e.key,n)}function P(t,e){return{backdropOpacity:q(t,"backdropOpacity",e),backdropBlur:q(t,"backdropBlur",e),panelGlassOpacity:q(t,"panelGlassOpacity",e),panelGlassBlur:q(t,"panelGlassBlur",e)}}function q(t,e,n){return x(e,n)?n.override[e]:m(t,`${e}-inherit`).checked?null:Number.parseInt(m(t,`${e}-number`).value,10)}function x(t,e){return!e.hasBackdrop&&(t==="backdropOpacity"||t==="backdropBlur")}function G(t,e){for(let n of t.querySelectorAll("button"))n.disabled=e}function m(t,e){let n=t.querySelector(`#${e}`);if(n===null)throw new Error(`Missing editor input ${e}.`);return n}function b(t,e){let n=t.querySelector(e);if(n===null)throw new Error(`Missing editor element ${e}.`);return n}window.__backgroundBlurEditorDispose?.();var w=window.setInterval(()=>{window.ApiClient?.getCurrentUserId()&&(window.clearInterval(w),w=0,ne())},500);window.ApiClient?.getCurrentUserId()&&(window.clearInterval(w),w=0,ne());window.__backgroundBlurEditorDispose=()=>{w!==0&&window.clearInterval(w)};async function ne(){V();let t=new M,e=await t.getSession(),n=null,i=0,r=0,a=!1,c=async()=>{let u=ee();if(u===null){i+=1,n=null,I(),te();return}if(n?.requestedItemId===u){O(n.values);return}let k=++i;try{let g=await t.getEffective(u);if(i!==k||ee()!==u)return;n=g,O(g.values)}catch{i===k&&(n=null,I())}},l=()=>{r===0&&(r=window.setTimeout(()=>{r=0,c()},40))},o=new MutationObserver(()=>{l(),e.canManage&&n!==null&&a&&(a=!D(n))});o.observe(document.body,{childList:!0,subtree:!0});let d=()=>l();window.addEventListener("hashchange",d),window.addEventListener("popstate",d),document.addEventListener("viewshow",d,!0),document.addEventListener("viewbeforehide",d,!0);let f=u=>{if(!e.canManage||n===null||!(u.target instanceof Element))return;let k=n.requestedItemId;Y(u,()=>{X(t,k,g=>{O(g),n!==null&&(n={...n,values:g})})})||u.target.closest(".btnMoreCommands")!==null&&(a=!0,window.setTimeout(()=>{n!==null&&(a=!D(n))},20),window.setTimeout(()=>{a=!1},1e3))};document.addEventListener("click",f,!0),window.__backgroundBlurEditorDispose=()=>{i+=1,o.disconnect(),window.removeEventListener("hashchange",d),window.removeEventListener("popstate",d),document.removeEventListener("viewshow",d,!0),document.removeEventListener("viewbeforehide",d,!0),document.removeEventListener("click",f,!0),r!==0&&window.clearTimeout(r),I(),te(),document.querySelector(".bibe-dialog-backdrop")?.remove(),document.getElementById("bibe-styles")?.remove()},await c()}function ee(){let t=window.location.hash,e=t.indexOf("?");if(e<0)return null;let n=new URLSearchParams(t.slice(e+1)).get("id");return n!==null&&/^[0-9a-f-]{32,36}$/i.test(n)?n:null}function te(){for(let t of document.querySelectorAll("[data-bibe-edit-action]"))t.remove()}})();
