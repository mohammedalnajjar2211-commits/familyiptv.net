const state={all:[],group:"__all__",query:""};
const icons=["★","⚽","🎬","📺","🧒","📰","🌍","🎵","🔥","▶"];

const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
function norm(s){return String(s||"").toLowerCase().replace(/[ًٌٍَُِّْـ]/g,"").replace(/[أإآ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").trim()}
function groups(){const m=new Map();state.all.forEach(c=>m.set(c.group,(m.get(c.group)||0)+1));return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0],"ar"))}
function renderCategories(){
 const list=$("#categoryList"), gs=groups();
 list.innerHTML=`<button class="category ${state.group==="__all"?"active":""}" data-group="__all"><span class="icon">▦</span><span class="name">جميع القنوات</span><span class="count">${state.all.length}</span></button>`+
 gs.map(([g,n],i)=>`<button class="category ${state.group===g?"active":""}" data-group="${esc(g)}"><span class="icon">${icons[i%icons.length]}</span><span class="name">${esc(g)}</span><span class="count">${n}</span></button>`).join("");
 list.querySelectorAll(".category").forEach(b=>b.onclick=()=>{state.group=b.dataset.group;renderCategories();renderChannels();closeMenu()});
 $("#totalChannels").textContent=state.all.length.toLocaleString("ar");
 $("#totalGroups").textContent=gs.length.toLocaleString("ar");
}
function filtered(){
 const q=norm(state.query);
 return state.all.filter(c=>(state.group==="__all"||c.group===state.group)&&(!q||norm(c.name).includes(q)||norm(c.group).includes(q)));
}
function renderChannels(){
 const data=filtered(), grid=$("#channelsGrid"), groupName=state.group==="__all"?"جميع القنوات":state.group;
 $("#sectionTitle").textContent=state.query?`نتائج البحث: ${state.query}`:groupName;
 $("#sectionInfo").textContent=`${data.length.toLocaleString("ar")} قناة`;
 $("#resultLabel").textContent=state.query?`${data.length} نتيجة`:`${groupName}`;
 grid.innerHTML=data.map(c=>`<article class="channel" title="${esc(c.name)}">
 <img src="${esc(c.logo||"")}" alt="${esc(c.name)}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'fallback',textContent:'TV'}))">
 <h3>${esc(c.name)}</h3></article>`).join("");
 $("#emptyState").classList.toggle("hidden",data.length!==0);
}
async function init(){
 try{
  const r=await fetch("channels.json",{cache:"no-store"});
  if(!r.ok)throw new Error();
  const data=await r.json();
  state.all=Array.isArray(data)?data:[];
 }catch(e){
  state.all=[];
  $("#sectionInfo").textContent="تعذر تحميل ملف القنوات";
 }
 renderCategories();renderChannels();
}
$("#searchInput").addEventListener("input",e=>{state.query=e.target.value;renderChannels()});
$("#clearSearch").onclick=()=>{$("#searchInput").value="";state.query="";renderChannels();$("#searchInput").focus()};
const sidebar=$("#sidebar"),overlay=$("#overlay");
function closeMenu(){sidebar.classList.remove("open");overlay.classList.remove("show")}
$("#menuBtn").onclick=()=>{sidebar.classList.add("open");overlay.classList.add("show")};
$("#closeMenu").onclick=closeMenu;overlay.onclick=closeMenu;
document.addEventListener("contextmenu",e=>{if(e.target.closest(".channel"))e.preventDefault()});
init();
