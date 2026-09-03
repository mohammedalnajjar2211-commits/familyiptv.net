const CONFIG = {
  API_BASE: "https://family-bouquet-manager.mohammedalnajjar2211.workers.dev"
};

const $ = s => document.querySelector(s);
let groups = [];
let defaults = [];
let creds = null;

function msg(el, text, ok=false){
  el.textContent = text || "";
  el.classList.toggle("ok", !!ok);
}
async function api(path, body){
  const r = await fetch(CONFIG.API_BASE + path, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  const data = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.error || "حدث خطأ في الاتصال");
  return data;
}
function updateStats(){
  $("#allCount").textContent = groups.length;
  const hidden = groups.filter(g=>g.hidden).length;
  $("#hiddenCount").textContent = hidden;
  $("#visibleCount").textContent = groups.length-hidden;
}
function render(){
  const q = $("#searchInput").value.trim().toLowerCase();
  const list = $("#groupsList");
  list.innerHTML = "";
  groups.forEach((g, idx)=>{
    if(q && !g.name.toLowerCase().includes(q)) return;
    const el = document.createElement("div");
    el.className = "group";
    el.draggable = true;
    el.dataset.id = g.id;
    el.innerHTML = `
      <span class="handle" title="اسحب لتغيير الترتيب">☰</span>
      <div class="group-name">${escapeHtml(g.name)}<span class="group-id">ID: ${escapeHtml(g.id)}</span></div>
      <label class="switch" title="${g.hidden?'مخفي':'ظاهر'}">
        <input type="checkbox" ${g.hidden?'':'checked'}>
        <span class="slider"></span>
      </label>`;
    el.querySelector("input").addEventListener("change", e=>{
      g.hidden = !e.target.checked;
      updateStats();
    });
    el.addEventListener("dragstart", ()=>el.classList.add("dragging"));
    el.addEventListener("dragend", ()=>{
      el.classList.remove("dragging");
      syncOrderFromDom();
    });
    list.appendChild(el);
  });
  updateStats();
}
function syncOrderFromDom(){
  const ids = [...document.querySelectorAll(".group")].map(x=>x.dataset.id);
  if(ids.length !== groups.length) return;
  groups.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));
}
$("#groupsList").addEventListener("dragover", e=>{
  e.preventDefault();
  const container = $("#groupsList");
  const dragging = $(".dragging");
  if(!dragging) return;
  const after = [...container.querySelectorAll(".group:not(.dragging)")].find(el=>{
    const box = el.getBoundingClientRect();
    return e.clientY < box.top + box.height/2;
  });
  if(after) container.insertBefore(dragging, after); else container.appendChild(dragging);
});

$("#loginForm").addEventListener("submit", async e=>{
  e.preventDefault();
  msg($("#loginMsg"), "جارٍ التحقق...");
  const username = $("#username").value.trim();
  const password = $("#password").value;
  try{
    await api("/api/login",{username,password});
    creds={username,password};
    sessionStorage.setItem("family_creds", JSON.stringify(creds));
    await loadGroups();
  }catch(err){ msg($("#loginMsg"), err.message); }
});
async function loadGroups(){
  try{
    const data=await api("/api/groups",creds);
    groups=data.groups;
    defaults=data.default_groups.map(x=>({...x}));
    $("#loginView").classList.add("hidden");
    $("#managerView").classList.remove("hidden");
    $("#logoutBtn").classList.remove("hidden");
    $("#proxyHint").textContent = CONFIG.API_BASE.replace(/\/$/,"") + "/get.php?username=USERNAME&password=PASSWORD&type=m3u_plus&output=ts";
    render();
  }catch(err){
    sessionStorage.removeItem("family_creds");
    creds=null;
    msg($("#loginMsg"),err.message);
  }
}
$("#saveBtn").addEventListener("click",async()=>{
  msg($("#saveMsg"),"جارٍ الحفظ...");
  try{
    await api("/api/preferences/save",{
      ...creds,
      hidden_ids:groups.filter(g=>g.hidden).map(g=>g.id),
      category_order:groups.map(g=>g.id)
    });
    msg($("#saveMsg"),"تم حفظ التغييرات بنجاح ✓",true);
  }catch(err){msg($("#saveMsg"),err.message)}
});
$("#showAllBtn").addEventListener("click",()=>{groups.forEach(g=>g.hidden=false);render()});
$("#resetBtn").addEventListener("click",()=>{groups=defaults.map(g=>({...g,hidden:false}));render()});
$("#searchInput").addEventListener("input",render);
$("#logoutBtn").addEventListener("click",()=>{
  sessionStorage.removeItem("family_creds"); location.reload();
});
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

try{
  const saved=JSON.parse(sessionStorage.getItem("family_creds")||"null");
  if(saved?.username && saved?.password){creds=saved;loadGroups();}
}catch{}