
const KAKAO_LINK = "https://pf.kakao.com/_YOUR_CHANNEL"; // ← 본인 카카오톡 채널 주소로 변경

const state = { filter: "전체", category: "전체", keyword: "", sort: "latest" };

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

["#floatingKakao","#bottomKakao","#drawerKakao"].forEach(id => $(id).href = KAKAO_LINK);

function miniCard(p){
  return `<article class="mini-card">
    <button onclick="openProduct(${p.id})">
      <img src="${p.images[0]}" alt="${p.name}">
      <div class="card-body">
        <h3>${p.name}</h3>
        <p>${p.size}</p>
      </div>
    </button>
  </article>`;
}

function productCard(p){
  return `<article class="product-card">
    <button onclick="openProduct(${p.id})">
      <img src="${p.images[0]}" alt="${p.name}">
      <div class="card-body">
        <span class="badge">${p.status}</span>
        <h3>${p.name}</h3>
        <p>${p.size} · ${p.color}</p>
      </div>
    </button>
  </article>`;
}

function renderHomeRows(){
  $("#newProducts").innerHTML = PRODUCTS.filter(p=>p.featured).map(miniCard).join("");
  $("#popularProducts").innerHTML = PRODUCTS.filter(p=>p.popular).map(miniCard).join("");
}

function filteredProducts(){
  let list = [...PRODUCTS];
  if(state.category !== "전체") list = list.filter(p=>p.category === state.category);
  if(state.filter === "신상품") list = list.filter(p=>p.featured);
  if(state.filter === "인기") list = list.filter(p=>p.popular);
  if(state.keyword){
    const q = state.keyword.toLowerCase();
    list = list.filter(p => [p.name,p.code,p.size,p.color,p.category].join(" ").toLowerCase().includes(q));
  }
  if(state.sort === "name") list.sort((a,b)=>a.name.localeCompare(b.name,"ko"));
  else list.sort((a,b)=>b.id-a.id);
  return list;
}

function renderGrid(){
  const list = filteredProducts();
  $("#productGrid").innerHTML = list.map(productCard).join("");
  $("#emptyState").style.display = list.length ? "none" : "block";
}

window.openProduct = function(id){
  const p = PRODUCTS.find(x=>x.id===id);
  $("#detailName").textContent = p.name;
  $("#detailCode").textContent = p.code;
  $("#detailSize").textContent = p.size;
  $("#detailColor").textContent = p.color;
  $("#detailDescription").textContent = p.description;
  $("#detailStatus").textContent = p.status;
  $("#detailMainImage").src = p.images[0];
  $("#detailMainImage").alt = p.name;
  $("#detailKakao").href = `${KAKAO_LINK}?product=${encodeURIComponent(p.name)}`;
  $("#detailThumbs").innerHTML = p.images.map((src,i)=>`
    <button class="${i===0?"active":""}" data-src="${src}">
      <img src="${src}" alt="${p.name} ${i+1}">
    </button>`).join("");
  $$("#detailThumbs button").forEach(btn=>btn.onclick=()=>{
    $("#detailMainImage").src=btn.dataset.src;
    $$("#detailThumbs button").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
  });
  $("#detailShare").onclick = ()=>shareText(`${p.name} - ${location.href}#product-${p.id}`);
  $("#productDialog").showModal();
}

function shareText(text){
  if(navigator.share) navigator.share({title:"BELLYSHOP",text,url:location.href});
  else navigator.clipboard.writeText(text).then(()=>alert("링크가 복사되었습니다."));
}

$("#menuBtn").onclick=()=>{$("#drawer").classList.add("open");$("#overlay").classList.add("open")}
$("#closeDrawer").onclick=$("#overlay").onclick=()=>{$("#drawer").classList.remove("open");$("#overlay").classList.remove("open")}
$("#searchBtn").onclick=()=>{$("#searchPanel").classList.toggle("open");$("#searchInput").focus()}
$("#searchInput").oninput=e=>{state.keyword=e.target.value.trim();renderGrid()}
$("#sortSelect").onchange=e=>{state.sort=e.target.value;renderGrid()}
$("#heroBrowse").onclick=()=>$("#catalog").scrollIntoView({behavior:"smooth"})
$("#shareSite").onclick=()=>shareText(location.href)
$("#dialogClose").onclick=()=>$("#productDialog").close()

$$(".tab").forEach(btn=>btn.onclick=()=>{
  $$(".tab").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  state.filter=btn.dataset.filter;
  renderGrid();
});

$$(".drawer-link[data-category]").forEach(btn=>btn.onclick=()=>{
  state.category=btn.dataset.category;
  $("#drawer").classList.remove("open");$("#overlay").classList.remove("open");
  $("#catalog").scrollIntoView({behavior:"smooth"});
  renderGrid();
});

$$("[data-show]").forEach(btn=>btn.onclick=()=>{
  const type=btn.dataset.show;
  state.filter=type==="new"?"신상품":"인기";
  $$(".tab").forEach(x=>x.classList.toggle("active",x.dataset.filter===state.filter));
  $("#catalog").scrollIntoView({behavior:"smooth"});
  renderGrid();
});

renderHomeRows();
renderGrid();
