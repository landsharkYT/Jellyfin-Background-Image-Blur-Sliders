"use strict";(()=>{function D(t,e){return{backdropOpacity:e.backdropOpacity??t.backdropOpacity,backdropBlur:e.backdropBlur??t.backdropBlur,panelGlassOpacity:e.panelGlassOpacity??t.panelGlassOpacity,panelGlassBlur:e.panelGlassBlur??t.panelGlassBlur}}function U(t){let e=v(t,"effective appearance");return{requestedItemId:p(e.requestedItemId,"requestedItemId"),ownerItemId:p(e.ownerItemId,"ownerItemId"),titleName:p(e.titleName,"titleName"),titleKind:$(e.titleKind),viewedKind:_(e.viewedKind),hasBackdrop:S(e.hasBackdrop,"hasBackdrop"),backdropBlurInherited:S(e.backdropBlurInherited,"backdropBlurInherited"),values:E(e.values)}}function L(t){let e=v(t,"editable appearance");return{requestedItemId:p(e.requestedItemId,"requestedItemId"),ownerItemId:p(e.ownerItemId,"ownerItemId"),titleName:p(e.titleName,"titleName"),titleKind:$(e.titleKind),viewedKind:_(e.viewedKind),hasBackdrop:S(e.hasBackdrop,"hasBackdrop"),global:E(e.global),override:j(e.override),effective:E(e.effective),revision:p(e.revision,"revision")}}function G(t){let e=v(t,"global appearance");return{values:E(e.values),revision:p(e.revision,"revision")}}function F(t){let e=v(t,"admin snapshot");if(!Array.isArray(e.titles))throw new Error("titles must be an array");return{global:G(e.global),titles:e.titles.map(oe)}}function oe(t){let e=v(t,"configured title"),n=e.titleKind;return{itemId:p(e.itemId,"itemId"),titleName:p(e.titleName,"titleName"),titleKind:n===null?null:$(n),isMissing:S(e.isMissing,"isMissing"),override:j(e.override),effective:E(e.effective),revision:p(e.revision,"revision")}}function E(t){let e=v(t,"appearance");return{backdropOpacity:h(e.backdropOpacity,0,100,"backdropOpacity"),backdropBlur:h(e.backdropBlur,0,50,"backdropBlur"),panelGlassOpacity:h(e.panelGlassOpacity,0,100,"panelGlassOpacity"),panelGlassBlur:h(e.panelGlassBlur,0,50,"panelGlassBlur")}}function j(t){let e=v(t,"appearance override");return{backdropOpacity:T(e.backdropOpacity,0,100,"backdropOpacity"),backdropBlur:T(e.backdropBlur,0,50,"backdropBlur"),panelGlassOpacity:T(e.panelGlassOpacity,0,100,"panelGlassOpacity"),panelGlassBlur:T(e.panelGlassBlur,0,50,"panelGlassBlur")}}function ae(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)}function v(t,e){if(!ae(t))throw new Error(`${e} must be an object`);return t}function p(t,e){if(typeof t!="string"||t.length===0)throw new Error(`${e} must be a non-empty string`);return t}function S(t,e){if(typeof t!="boolean")throw new Error(`${e} must be a boolean`);return t}function h(t,e,n,i){if(typeof t!="number"||!Number.isInteger(t)||t<e||t>n)throw new Error(`${i} must be an integer from ${e} through ${n}`);return t}function T(t,e,n,i){return t==null?null:h(t,e,n,i)}function $(t){if(t!=="Movie"&&t!=="Series")throw new Error("titleKind is not supported");return t}function _(t){if(t!=="Movie"&&t!=="Series"&&t!=="Season"&&t!=="Episode")throw new Error("viewedKind is not supported");return t}var I=class extends Error{constructor(){super("The appearance changed in another editor.")}},M=class{async getSession(){let e=await this.request("GET","/BackgroundBlurEditor/v1/session");if(!z(e)||typeof e.canManage!="boolean")throw new Error("The session response is invalid.");return{canManage:e.canManage}}async getEffective(e){return U(await this.request("GET",`/BackgroundBlurEditor/v1/effective/${encodeURIComponent(e)}`))}async getEditor(e){return L(await this.request("GET",`/BackgroundBlurEditor/v1/admin/editor/${encodeURIComponent(e)}`))}async getSnapshot(e=""){let n=e.length===0?"":`?search=${encodeURIComponent(e)}`;return F(await this.request("GET",`/BackgroundBlurEditor/v1/admin/snapshot${n}`))}async saveGlobal(e,n){return G(await this.request("PUT","/BackgroundBlurEditor/v1/admin/global",{expectedRevision:n,...e}))}async saveTitle(e,n,i){return L(await this.request("PUT",`/BackgroundBlurEditor/v1/admin/titles/${encodeURIComponent(e)}`,{expectedRevision:i,...n}))}async resetTitle(e,n){let i=`?expectedRevision=${encodeURIComponent(n)}`;return L(await this.request("DELETE",`/BackgroundBlurEditor/v1/admin/titles/${encodeURIComponent(e)}${i}`))}async request(e,n,i){let r=le(),o=i===void 0?{type:e,url:r.getUrl(n),dataType:"json"}:{type:e,url:r.getUrl(n),dataType:"json",contentType:"application/json",data:JSON.stringify(i)};try{return await r.ajax(o)}catch(c){throw se(c)===409?new I:c}}};function le(){let t=window.ApiClient;if(t===void 0)throw new Error("Jellyfin ApiClient is not available.");return t}function se(t){return z(t)?typeof t.status=="number"?t.status:typeof t.statusCode=="number"?t.statusCode:null:null}function z(t){return typeof t=="object"&&t!==null&&!Array.isArray(t)}var J="bibe-styles",ce=[".detailRibbon",".detailPageSecondaryContainer"],de=`
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
`;function V(){if(document.getElementById(J)!==null)return;let t=document.createElement("style");t.id=J,t.textContent=de,document.head.append(t)}function O(t,e){A();let n=ue();if(n===null)return;let i=new Set([...document.querySelectorAll(".backdropContainer .backdropImage"),...n.querySelectorAll("#itemBackdrop, .backdropImage")]);for(let r of i){let o=window.getComputedStyle(r).filter;r.style.setProperty("--bibe-base-backdrop-filter",e?Y(o):pe(o)),r.classList.add("bibe-backdrop"),r.style.setProperty("--bibe-backdrop-opacity",String(t.backdropOpacity)),r.style.setProperty("--bibe-backdrop-blur",String(t.backdropBlur))}for(let r of ce)for(let o of n.querySelectorAll(r))N(o,t)}function N(t,e){t.classList.add("bibe-panel"),t.style.setProperty("--bibe-panel-rgb",be()),t.style.setProperty("--bibe-panel-opacity",String(e.panelGlassOpacity)),t.style.setProperty("--bibe-panel-blur",H()?String(e.panelGlassBlur):"0")}function A(){for(let t of document.querySelectorAll(".bibe-backdrop, .bibe-panel")){t.classList.remove("bibe-backdrop","bibe-panel");for(let e of["--bibe-backdrop-opacity","--bibe-backdrop-blur","--bibe-base-backdrop-filter","--bibe-panel-rgb","--bibe-panel-opacity","--bibe-panel-blur"])t.style.removeProperty(e)}}function pe(t){return Y(t.replace(/\bblur\([^)]*\)/giu,""))}function Y(t){return t==="none"?"":t.replace(/\s+/gu," ").trim()}function H(){return CSS.supports("backdrop-filter","blur(1px)")||CSS.supports("-webkit-backdrop-filter","blur(1px)")}function ue(){let t=document.querySelectorAll("#itemDetailPage");for(let e of t)if(!e.classList.contains("hide")&&e.getClientRects().length>0)return e;return t.item(t.length-1)}function be(){let t=window.getComputedStyle(document.body).backgroundColor,e=/^rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i.exec(t);return e?.[1]!==void 0&&e[2]!==void 0&&e[3]!==void 0?`${e[1]} ${e[2]} ${e[3]}`:"24 24 24"}function Q(t,e){return!(t.target instanceof Element)||t.target.closest("[data-bibe-edit-action]")===null?!1:(t.preventDefault(),window.setTimeout(e,0),!0)}function R(t){let e=document.querySelectorAll("dialog.actionSheet, .actionSheet"),n=e.item(e.length-1);if(n===null)return!1;if(n.querySelector("[data-bibe-edit-action]")!==null)return!0;let i=n.querySelector(".actionSheetScroller");if(i===null)return!1;N(n,t.values);let r=document.createElement("button");r.type="button",r.className="listItem listItem-button actionSheetMenuItem emby-button",r.dataset.bibeEditAction="true",r.innerHTML='<span class="actionsheetMenuItemIcon listItemIcon listItemIcon-transparent material-icons blur_on" aria-hidden="true"></span><div class="listItemBody actionsheetListItemBody"><div class="listItemBodyText actionSheetItemText"></div></div>';let o=r.querySelector(".actionSheetItemText");return o!==null&&(o.textContent=t.viewedKind==="Season"||t.viewedKind==="Episode"?"Edit series background appearance":"Edit background appearance"),i.append(r),!0}var W=[{key:"backdropOpacity",label:"Backdrop opacity",unit:"%",maximum:100},{key:"backdropBlur",label:"Backdrop blur",unit:"px",maximum:50},{key:"panelGlassOpacity",label:"Panel glass opacity",unit:"%",maximum:100},{key:"panelGlassBlur",label:"Panel glass blur",unit:"px",maximum:50}];async function Z(t,e,n,i=()=>{}){document.querySelector(".bibe-dialog-backdrop")?.remove();let r=document.createElement("div");r.className="bibe-dialog-backdrop",r.innerHTML=`
    <section class="bibe-dialog" role="dialog" aria-modal="true" aria-labelledby="bibe-editor-title">
      <h2 id="bibe-editor-title">Background appearance</h2>
      <p class="bibe-dialog-note">Loading settings...</p>
      <p class="bibe-error" role="alert"></p>
      <div class="bibe-actions">
        <button is="emby-button" type="button" class="emby-button raised button-cancel block formDialogFooterItem bibe-load-close" hidden>Close</button>
      </div>
    </section>`;let o=b(r,".bibe-dialog-note"),c=b(r,".bibe-error"),s=b(r,".bibe-load-close");s.addEventListener("click",()=>r.remove()),document.body.append(r);try{let a=await t.getEditor(e);r.remove(),ee(t,a,n,i)}catch(a){o.textContent="Could not load background appearance.",c.textContent=a instanceof Error?a.message:"The server request failed.",s.hidden=!1,s.focus()}}function ee(t,e,n,i){document.querySelector(".bibe-dialog-backdrop")?.remove();let r=document.createElement("div");r.className="bibe-dialog-backdrop",r.innerHTML=`
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
    </section>`;let o=b(r,"#bibe-editor-title");o.textContent=e.viewedKind==="Season"||e.viewedKind==="Episode"?`Edit series background appearance: ${e.titleName}`:`Edit background appearance: ${e.titleName}`;let c=b(r,".bibe-dialog-note"),s=[];e.hasBackdrop||s.push("This title has no backdrop image."),H()||s.push("This browser does not support panel backdrop blur."),c.textContent=s.join(" ");let a=b(r,".bibe-controls");for(let l of W)a.insertAdjacentHTML("beforeend",me(l)),fe(a,l,e);let d=b(r,".bibe-error"),y=b(r,".bibe-editor-form"),u=b(r,".bibe-cancel"),k=b(r,".bibe-reset"),m=()=>{n(e.effective,e.override.backdropBlur===null),r.remove()};for(let l of W){let f=g(a,`${l.key}-range`),x=g(a,`${l.key}-number`),C=g(a,`${l.key}-inherit`);f.addEventListener("input",()=>{x.value=f.value,K(a,e,n)}),x.addEventListener("input",()=>{f.value=x.value,K(a,e,n)}),C.addEventListener("change",()=>{f.disabled=C.checked||B(l.key,e),x.disabled=C.checked||B(l.key,e),K(a,e,n)})}u.addEventListener("click",m),r.addEventListener("click",l=>{l.target===r&&m()}),k.addEventListener("click",async()=>{if(window.confirm(`Reset ${e.titleName} to the global appearance?`)){q(y,!0);try{let l=await t.resetTitle(e.ownerItemId,e.revision);n(l.effective,l.override.backdropBlur===null),r.remove(),i()}catch(l){await X(l,t,e,n,i,d,r)}finally{q(y,!1)}}}),y.addEventListener("submit",async l=>{l.preventDefault(),q(y,!0),d.textContent="";try{let f=await t.saveTitle(e.ownerItemId,te(a,e),e.revision);n(f.effective,f.override.backdropBlur===null),r.remove(),i()}catch(f){await X(f,t,e,n,i,d,r)}finally{q(y,!1)}}),document.body.append(r),g(a,"backdropOpacity-range").focus()}async function X(t,e,n,i,r,o,c){if(t instanceof I){if(o.textContent="These settings changed in another editor.",window.confirm("Reload the current saved values?")){let s=await e.getEditor(n.ownerItemId);c.remove(),i(s.effective,s.override.backdropBlur===null),ee(e,s,i,r)}return}o.textContent=t instanceof Error?t.message:"Could not save the appearance."}function K(t,e,n){let i=te(t,e);n(D(e.global,i),i.backdropBlur===null)}function me(t){return`<div class="bibe-control" data-field="${t.key}">
    <label for="${t.key}-range">${t.label}</label>
    <span class="bibe-number"><input id="${t.key}-number" type="number" min="0" max="${t.maximum}" step="1"><span>${t.unit}</span></span>
    <input id="${t.key}-range" type="range" min="0" max="${t.maximum}" step="1">
    <label class="bibe-inherit"><input id="${t.key}-inherit" type="checkbox"> Use global value</label>
  </div>`}function fe(t,e,n){let i=n.override[e.key]===null,r=n.override[e.key]??n.global[e.key],o=g(t,`${e.key}-range`),c=g(t,`${e.key}-number`),s=g(t,`${e.key}-inherit`);o.value=String(r),c.value=String(r),s.checked=i;let a=i||B(e.key,n);o.disabled=a,c.disabled=a,s.disabled=B(e.key,n)}function te(t,e){return{backdropOpacity:P(t,"backdropOpacity",e),backdropBlur:P(t,"backdropBlur",e),panelGlassOpacity:P(t,"panelGlassOpacity",e),panelGlassBlur:P(t,"panelGlassBlur",e)}}function P(t,e,n){return B(e,n)?n.override[e]:g(t,`${e}-inherit`).checked?null:Number.parseInt(g(t,`${e}-number`).value,10)}function B(t,e){return!e.hasBackdrop&&(t==="backdropOpacity"||t==="backdropBlur")}function q(t,e){for(let n of t.querySelectorAll("button"))n.disabled=e}function g(t,e){let n=t.querySelector(`#${e}`);if(n===null)throw new Error(`Missing editor input ${e}.`);return n}function b(t,e){let n=t.querySelector(e);if(n===null)throw new Error(`Missing editor element ${e}.`);return n}window.__backgroundBlurEditorDispose?.();var w=window.setInterval(()=>{window.ApiClient?.getCurrentUserId()&&(window.clearInterval(w),w=0,ie())},500);window.ApiClient?.getCurrentUserId()&&(window.clearInterval(w),w=0,ie());window.__backgroundBlurEditorDispose=()=>{w!==0&&window.clearInterval(w)};async function ie(){V();let t=new M,e=await t.getSession(),n=null,i=0,r=0,o=!1,c=async()=>{let u=ne();if(u===null){i+=1,n=null,A(),re();return}if(n?.requestedItemId===u){O(n.values,n.backdropBlurInherited);return}let k=++i;try{let m=await t.getEffective(u);if(i!==k||ne()!==u)return;n=m,O(m.values,m.backdropBlurInherited)}catch{i===k&&(n=null,A())}},s=()=>{r===0&&(r=window.setTimeout(()=>{r=0,c()},40))},a=new MutationObserver(()=>{s(),e.canManage&&n!==null&&o&&(o=!R(n))});a.observe(document.body,{childList:!0,subtree:!0});let d=()=>s();window.addEventListener("hashchange",d),window.addEventListener("popstate",d),document.addEventListener("viewshow",d,!0),document.addEventListener("viewbeforehide",d,!0);let y=u=>{if(!e.canManage||n===null||!(u.target instanceof Element))return;let k=n.requestedItemId;Q(u,()=>{Z(t,k,(m,l)=>{O(m,l),n!==null&&(n={...n,values:m,backdropBlurInherited:l})})})||u.target.closest(".btnMoreCommands")!==null&&(o=!0,window.setTimeout(()=>{n!==null&&(o=!R(n))},20),window.setTimeout(()=>{o=!1},1e3))};document.addEventListener("click",y,!0),window.__backgroundBlurEditorDispose=()=>{i+=1,a.disconnect(),window.removeEventListener("hashchange",d),window.removeEventListener("popstate",d),document.removeEventListener("viewshow",d,!0),document.removeEventListener("viewbeforehide",d,!0),document.removeEventListener("click",y,!0),r!==0&&window.clearTimeout(r),A(),re(),document.querySelector(".bibe-dialog-backdrop")?.remove(),document.getElementById("bibe-styles")?.remove()},await c()}function ne(){let t=window.location.hash,e=t.indexOf("?");if(e<0)return null;let n=new URLSearchParams(t.slice(e+1)).get("id");return n!==null&&/^[0-9a-f-]{32,36}$/i.test(n)?n:null}function re(){for(let t of document.querySelectorAll("[data-bibe-edit-action]"))t.remove()}})();
