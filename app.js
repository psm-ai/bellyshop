import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {getAuth,signInWithEmailAndPassword,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {getFirestore,collection,addDoc,updateDoc,deleteDoc,doc,onSnapshot,serverTimestamp,setDoc,getDoc} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig={apiKey:"AIzaSyAF72PJmHG1G2bzA9sXVNv7Jdw7nywy_h0",authDomain:"belly-276eb.firebaseapp.com",projectId:"belly-276eb",storageBucket:"belly-276eb.firebasestorage.app",messagingSenderId:"99628863972",appId:"1:99628863972:web:d22adec9a7ed782bc237f1"};
const ADMIN_EMAIL="mjh380801@naver.com";
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getFirestore(app);
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const money=n=>`${Number(n||0).toLocaleString("ko-KR")}원`;
const esc=(v="")=>String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
let products=[],banners=[],categories=[],settings={},cart=JSON.parse(localStorage.getItem("bellyshop_cart")||"[]"),user=null,view="all",heroIndex=0,heroTimer;

function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2200)}
function saveCart(){localStorage.setItem("bellyshop_cart",JSON.stringify(cart));$("#cartCount").textContent=cart.length}
function productCard(p){return `<article class="product-card" data-id="${p.id}">${p.soldout?'<div class="soldout">품절</div>':""}${p.isNew?'<span class="badge">신상품</span>':""}${p.popular?'<span class="badge popular">인기</span>':""}<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.src='https://placehold.co/800x800?text=BELLYSHOP'"><div class="product-info"><span class="category">${esc(p.category)}</span><h3>${esc(p.name)}</h3><span class="price">${money(p.price)}</span>${p.originalPrice?`<span class="original">${money(p.originalPrice)}</span>`:""}</div></article>`}
function attachCards(){$$(".product-card").forEach(e=>e.onclick=()=>openProduct(e.dataset.id))}
function categoryNames(){
  const managed=categories.map(c=>c.name).filter(Boolean);
  const legacy=products.map(p=>p.category).filter(Boolean).filter(n=>!managed.includes(n));
  return [...managed,...new Set(legacy)];
}
function renderCategories(){
  const cats=categoryNames(),filterValue=$("#categoryFilter").value,productValue=$("#pCategory").value;
  $("#categoryFilter").innerHTML='<option value="">전체 카테고리</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
  $("#categoryFilter").value=cats.includes(filterValue)?filterValue:"";
  $("#pCategory").innerHTML='<option value="">카테고리를 선택하세요</option>'+cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
  if(cats.includes(productValue)) $("#pCategory").value=productValue;

  const drawer=$("#drawerCategories");
  drawer.innerHTML=cats.length
    ? cats.map(c=>`<button type="button" data-category="${esc(c)}" class="${filterValue===c?"active":""}">${esc(c)}</button>`).join("")
    : '<div class="drawer-category-empty">등록된 카테고리가 없습니다.</div>';
  $$("[data-category]").forEach(b=>b.onclick=()=>setCategory(b.dataset.category));

  renderCategoryAdmin();
}
function renderCategoryAdmin(){
  const list=[...categories].sort((a,b)=>(a.order||0)-(b.order||0)||a.name.localeCompare(b.name,"ko"));
  $("#categoryListAdmin").innerHTML=list.length?list.map((c,i)=>`<div class="category-row">
    <span class="category-number">${i+1}</span>
    <div><b>${esc(c.name)}</b><small>정렬 순서 ${Number(c.order||0)}</small></div>
    <div class="category-row-actions"><button class="mini" data-cedit="${c.id}">수정</button><button class="mini delete" data-cdelete="${c.id}">삭제</button></div>
  </div>`).join(""):'<div class="empty">등록된 카테고리가 없습니다.</div>';
  $$("[data-cedit]").forEach(b=>b.onclick=()=>editCategory(b.dataset.cedit));
  $$("[data-cdelete]").forEach(b=>b.onclick=()=>deleteCategory(b.dataset.cdelete));
}
function editCategory(id){
  const c=categories.find(x=>x.id===id);if(!c)return;
  $("#categoryId").value=id;$("#categoryName").value=c.name||"";$("#categoryOrder").value=Number(c.order||0);
  $("#cancelCategoryEdit").classList.remove("hidden");$("#categoryName").focus();
}
function resetCategory(){
  $("#categoryForm").reset();$("#categoryId").value="";$("#categoryOrder").value=0;$("#cancelCategoryEdit").classList.add("hidden");
}
async function deleteCategory(id){
  const c=categories.find(x=>x.id===id);if(!c)return;
  const used=products.filter(p=>p.category===c.name).length;
  if(used>0){toast(`이 카테고리를 사용하는 상품이 ${used}개 있습니다. 상품 카테고리를 먼저 변경하세요.`);return;}
  if(!confirm(`'${c.name}' 카테고리를 삭제할까요?`))return;
  try{await deleteDoc(doc(db,"categories",id));toast("카테고리를 삭제했습니다.");}catch{toast("카테고리 삭제에 실패했습니다.");}
}
function render(){const q=$("#searchInput").value.trim().toLowerCase(),cat=$("#categoryFilter").value;const base=products.filter(p=>p.visible!==false).filter(p=>!q||p.name.toLowerCase().includes(q)||(p.description||"").toLowerCase().includes(q)).filter(p=>!cat||p.category===cat);$("#newGrid").innerHTML=base.filter(p=>p.isNew).slice(0,8).map(productCard).join("");$("#popularGrid").innerHTML=base.filter(p=>p.popular).slice(0,8).map(productCard).join("");$("#featuredGrid").innerHTML=base.filter(p=>p.featured).slice(0,8).map(productCard).join("");let all=base;let title=cat||"전체 상품";if(view==="new"){all=base.filter(p=>p.isNew);title="신상품"}if(view==="popular"){all=base.filter(p=>p.popular);title="인기상품"}if(view==="featured"){all=base.filter(p=>p.featured);title="추천상품"}$("#allTitle").textContent=title;$("#allGrid").innerHTML=all.map(productCard).join("");$("#emptyState").classList.toggle("hidden",all.length>0);$("#homeSections").classList.toggle("hidden",view!=="all"||!!cat);attachCards();renderCategories();renderAdminProducts()}
function setView(v){view=v;$("#categoryFilter").value="";$$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.view===v));render();$("#allSection").scrollIntoView({behavior:"smooth"});closeDrawer()}
function setCategory(name){view="all";$("#categoryFilter").value=name;$$(".tab").forEach(b=>b.classList.remove("active"));render();$("#allSection").scrollIntoView({behavior:"smooth"});closeDrawer()}
function openProduct(id){const p=products.find(x=>x.id===id);if(!p)return;const imgs=[p.image,...(p.images||[])].filter(Boolean);$("#productDetail").innerHTML=`<img id="detailMain" class="detail-main" src="${esc(p.image)}">${imgs.length>1?`<div class="thumbs">${imgs.map(u=>`<img src="${esc(u)}" data-u="${esc(u)}">`).join("")}</div>`:""}<small class="kicker">${esc(p.category)}</small><h2>${esc(p.name)}</h2><p><b>${money(p.price)}</b>${p.originalPrice?` <span class="original">${money(p.originalPrice)}</span>`:""}</p><p style="white-space:pre-line;line-height:1.8;color:#666">${esc(p.description)}</p><div class="actions"><button id="directContact" class="light">바로 문의</button><button id="addCart" class="dark" ${p.soldout?"disabled":""}>${p.soldout?"품절":"견적함 담기"}</button></div>`;$$(".thumbs img").forEach(i=>i.onclick=()=>$("#detailMain").src=i.dataset.u);$("#addCart").onclick=()=>{if(!cart.includes(id))cart.push(id);saveCart();toast("견적함에 담았습니다.")};$("#directContact").onclick=()=>contact(`상품 문의\n상품명: ${p.name}\n가격: ${money(p.price)}`);$("#productDialog").showModal()}
function renderHero(){clearInterval(heroTimer);const list=banners.filter(b=>b.visible!==false);if(!list.length){$("#heroSlider").innerHTML='<div class="hero-slide active" style="background:linear-gradient(135deg,#222,#999)"><div class="hero-content"><small>BELLYSHOP</small><h1>새로운 컬렉션</h1><p>관리자에서 메인 배너를 등록해 주세요.</p><a href="#allSection">보러가기</a></div></div>';$("#heroDots").innerHTML="";return}heroIndex=Math.min(heroIndex,list.length-1);$("#heroSlider").innerHTML=list.map((b,i)=>`<div class="hero-slide ${i===heroIndex?"active":""}" style="background-image:url('${esc(b.image)}')"><div class="hero-content"><small>${esc(b.eyebrow||"NEW COLLECTION")}</small><h1>${esc(b.title)}</h1><p>${esc(b.subtitle||"")}</p><a href="${esc(b.link||"#allSection")}">${esc(b.button||"보러가기")}</a></div></div>`).join("");$("#heroDots").innerHTML=list.map((_,i)=>`<button class="hero-dot ${i===heroIndex?"active":""}" data-i="${i}"></button>`).join("");$$(".hero-dot").forEach(d=>d.onclick=()=>{heroIndex=Number(d.dataset.i);renderHero()});if(list.length>1)heroTimer=setInterval(()=>{heroIndex=(heroIndex+1)%list.length;renderHero()},5000)}
function renderCart(){const items=cart.map(id=>products.find(p=>p.id===id)).filter(Boolean);$("#cartItems").innerHTML=items.length?items.map(p=>`<div class="cart-row"><img src="${esc(p.image)}"><div><b>${esc(p.name)}</b><br>${money(p.price)}</div><button class="mini delete" data-remove="${p.id}">삭제</button></div>`).join(""):'<div class="empty">견적함이 비어 있습니다.</div>';$$("[data-remove]").forEach(b=>b.onclick=()=>{cart=cart.filter(x=>x!==b.dataset.remove);saveCart();renderCart()})}
function inquiryText(){const items=cart.map(id=>products.find(p=>p.id===id)).filter(Boolean);return `BELLYSHOP 상품 상담 요청\n\n${items.map((p,i)=>`${i+1}. ${p.name} / ${money(p.price)}`).join("\n")}\n\n추가 문의:\n${$("#cartMessage").value.trim()}`}
async function copy(t){try{await navigator.clipboard.writeText(t);toast("복사했습니다.")}catch{toast("복사하지 못했습니다.")}}
function contact(t){copy(t);if(settings.contactUrl)window.open(settings.contactUrl,"_blank","noopener");else if(settings.phone)location.href=`sms:${settings.phone.replace(/\D/g,"")}?body=${encodeURIComponent(t)}`;else if(settings.email)location.href=`mailto:${settings.email}?subject=${encodeURIComponent("BELLYSHOP 문의")}&body=${encodeURIComponent(t)}`;else toast("관리자에서 상담 주소를 설정해 주세요.")}
function renderAdminProducts(){$("#adminProductList").innerHTML=products.length?products.map(p=>`<div class="admin-item"><img src="${esc(p.image)}"><div><b>${esc(p.name)}</b><p>${esc(p.category)} · ${money(p.price)} · ${p.visible!==false?"공개":"비공개"}</p></div><div class="admin-item-actions"><button class="mini" data-edit="${p.id}">수정</button><button class="mini delete" data-delete="${p.id}">삭제</button></div></div>`).join(""):'<div class="empty">등록된 상품이 없습니다.</div>';$$("[data-edit]").forEach(b=>b.onclick=()=>editProduct(b.dataset.edit));$$("[data-delete]").forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete))}
function editProduct(id){const p=products.find(x=>x.id===id);if(!p)return;$("#productId").value=id;$("#pName").value=p.name||"";$("#pCategory").value=p.category||"";$("#pPrice").value=p.price||0;$("#pOriginalPrice").value=p.originalPrice||"";$("#pImage").value=p.image||"";$("#pImages").value=(p.images||[]).join("\n");$("#pDescription").value=p.description||"";$("#pNew").checked=!!p.isNew;$("#pPopular").checked=!!p.popular;$("#pFeatured").checked=!!p.featured;$("#pSoldout").checked=!!p.soldout;$("#pVisible").checked=p.visible!==false;$("#cancelProductEdit").classList.remove("hidden");$("#productForm").scrollIntoView({behavior:"smooth"})}
function resetProduct(){$("#productForm").reset();$("#productId").value="";$("#pNew").checked=true;$("#pVisible").checked=true;$("#cancelProductEdit").classList.add("hidden")}
async function deleteProduct(id){if(!confirm("이 상품을 삭제할까요?"))return;try{await deleteDoc(doc(db,"products",id));toast("삭제했습니다.")}catch{toast("삭제에 실패했습니다.")}}
function renderBanners(){$("#bannerList").innerHTML=banners.length?banners.map(b=>`<div class="admin-item"><img src="${esc(b.image)}"><div><b>${esc(b.title)}</b><p>${b.visible!==false?"공개":"비공개"}</p></div><div class="admin-item-actions"><button class="mini" data-bedit="${b.id}">수정</button><button class="mini delete" data-bdelete="${b.id}">삭제</button></div></div>`).join(""):'<div class="empty">등록된 배너가 없습니다.</div>';$$("[data-bedit]").forEach(b=>b.onclick=()=>editBanner(b.dataset.bedit));$$("[data-bdelete]").forEach(b=>b.onclick=async()=>{if(confirm("배너를 삭제할까요?"))await deleteDoc(doc(db,"banners",b.dataset.bdelete))})}
function editBanner(id){const b=banners.find(x=>x.id===id);if(!b)return;$("#bannerId").value=id;$("#bEyebrow").value=b.eyebrow||"";$("#bTitle").value=b.title||"";$("#bSubtitle").value=b.subtitle||"";$("#bImage").value=b.image||"";$("#bButton").value=b.button||"";$("#bLink").value=b.link||"";$("#bVisible").checked=b.visible!==false;$("#cancelBannerEdit").classList.remove("hidden")}
function resetBanner(){$("#bannerForm").reset();$("#bannerId").value="";$("#bVisible").checked=true;$("#bButton").value="보러가기";$("#cancelBannerEdit").classList.add("hidden")}
function openDrawer(){$("#drawer").classList.add("open");$("#overlay").classList.remove("hidden")}function closeDrawer(){$("#drawer").classList.remove("open");$("#overlay").classList.add("hidden")}

onSnapshot(collection(db,"categories"),s=>{
  categories=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.order||0)-(b.order||0)||a.name.localeCompare(b.name,"ko"));
  renderCategories();
},()=>toast("카테고리를 불러오지 못했습니다."));
onSnapshot(collection(db,"products"),s=>{products=s.docs.map(d=>({id:d.id,...d.data()}));render();renderCart()},()=>toast("상품 데이터를 불러오지 못했습니다."));
onSnapshot(collection(db,"banners"),s=>{banners=s.docs.map(d=>({id:d.id,...d.data()}));renderHero();renderBanners()});
getDoc(doc(db,"settings","site")).then(s=>{settings=s.exists()?s.data():{};$("#footerBrand").textContent=settings.brand||"BELLYSHOP";$("#footerText").textContent=settings.footer||"상품 상담은 상담 버튼을 이용해 주세요."});

$("#menuBtn").onclick=openDrawer;$("#drawerClose").onclick=closeDrawer;$("#overlay").onclick=closeDrawer;$("#searchBtn").onclick=()=>$("#searchPanel").classList.toggle("hidden");$("#searchInput").oninput=render;$("#categoryFilter").onchange=()=>{view="all";$$(".tab").forEach(b=>b.classList.toggle("active",!$("#categoryFilter").value&&b.dataset.view==="all"));render();};
$$("[data-view]").forEach(b=>b.onclick=()=>setView(b.dataset.view));
$("#adminBtn").onclick=$("#drawerAdmin").onclick=()=>user?$("#adminDialog").showModal():$("#loginDialog").showModal();
$("#cartBtn").onclick=()=>{renderCart();$("#cartDialog").showModal()};$("#talkBtn").onclick=()=>contact("BELLYSHOP 상품 상담을 요청합니다.");$("#shareBtn").onclick=()=>navigator.share?navigator.share({title:"BELLYSHOP",url:location.href}):copy(location.href);
$("#copyInquiry").onclick=()=>copy(inquiryText());$("#contactInquiry").onclick=()=>contact(inquiryText());$$("[data-close]").forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
$("#cancelProductEdit").onclick=resetProduct;$("#cancelBannerEdit").onclick=resetBanner;

$("#loginForm").onsubmit=async e=>{e.preventDefault();$("#loginError").textContent="";if($("#adminId").value.trim().toLowerCase()!=="admin"){$("#loginError").textContent="아이디가 올바르지 않습니다.";return}try{await signInWithEmailAndPassword(auth,ADMIN_EMAIL,$("#adminPassword").value);$("#loginDialog").close();$("#adminDialog").showModal()}catch{$("#loginError").textContent="비밀번호가 올바르지 않습니다."}};
onAuthStateChanged(auth,u=>{user=u?.email===ADMIN_EMAIL?u:null;$("#adminBtn").textContent=user?"상품 관리":"관리자";if(u&&!user)signOut(auth)});
$("#logoutBtn").onclick=async()=>{await signOut(auth);$("#adminDialog").close();toast("로그아웃했습니다.")};

$("#productForm").onsubmit=async e=>{e.preventDefault();const data={name:$("#pName").value.trim(),category:$("#pCategory").value.trim(),price:Number($("#pPrice").value),originalPrice:Number($("#pOriginalPrice").value||0),image:$("#pImage").value.trim(),images:$("#pImages").value.split("\n").map(x=>x.trim()).filter(Boolean),description:$("#pDescription").value.trim(),isNew:$("#pNew").checked,popular:$("#pPopular").checked,featured:$("#pFeatured").checked,soldout:$("#pSoldout").checked,visible:$("#pVisible").checked,updatedAt:serverTimestamp()};try{const id=$("#productId").value;if(id)await updateDoc(doc(db,"products",id),data);else await addDoc(collection(db,"products"),{...data,createdAt:serverTimestamp()});resetProduct();toast("상품을 저장했습니다.")}catch{toast("저장 실패: Firestore 규칙을 확인하세요.")}};
$("#categoryManageBtn").onclick=()=>{$("#categoryDialog").showModal();setTimeout(()=>$("#categoryName").focus(),100)};
$("#cancelCategoryEdit").onclick=resetCategory;
$("#categoryForm").onsubmit=async e=>{
  e.preventDefault();
  const name=$("#categoryName").value.trim(),order=Number($("#categoryOrder").value||0),id=$("#categoryId").value;
  if(!name)return;
  const duplicate=categories.find(c=>c.name.toLowerCase()===name.toLowerCase()&&c.id!==id);
  if(duplicate){toast("이미 등록된 카테고리 이름입니다.");return;}
  try{
    if(id){
      const old=categories.find(c=>c.id===id);
      await updateDoc(doc(db,"categories",id),{name,order,updatedAt:serverTimestamp()});
      if(old&&old.name!==name){
        const targets=products.filter(p=>p.category===old.name);
        await Promise.all(targets.map(p=>updateDoc(doc(db,"products",p.id),{category:name,updatedAt:serverTimestamp()})));
      }
      toast("카테고리를 수정했습니다.");
    }else{
      await addDoc(collection(db,"categories"),{name,order,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
      toast("카테고리를 추가했습니다.");
    }
    resetCategory();
  }catch(err){console.error(err);toast("카테고리 저장에 실패했습니다.");}
};
$("#bannerManageBtn").onclick=()=>$("#bannerDialog").showModal();
$("#bannerForm").onsubmit=async e=>{e.preventDefault();const data={eyebrow:$("#bEyebrow").value.trim(),title:$("#bTitle").value.trim(),subtitle:$("#bSubtitle").value.trim(),image:$("#bImage").value.trim(),button:$("#bButton").value.trim(),link:$("#bLink").value.trim(),visible:$("#bVisible").checked,updatedAt:serverTimestamp()};try{const id=$("#bannerId").value;if(id)await updateDoc(doc(db,"banners",id),data);else await addDoc(collection(db,"banners"),{...data,createdAt:serverTimestamp()});resetBanner();toast("배너를 저장했습니다.")}catch{toast("배너 저장에 실패했습니다.")}};
$("#settingsBtn").onclick=()=>{$("#sBrand").value=settings.brand||"BELLYSHOP";$("#sContactUrl").value=settings.contactUrl||"";$("#sPhone").value=settings.phone||"";$("#sEmail").value=settings.email||"";$("#sFooter").value=settings.footer||"";$("#settingsDialog").showModal()};
$("#settingsForm").onsubmit=async e=>{e.preventDefault();const data={brand:$("#sBrand").value.trim(),contactUrl:$("#sContactUrl").value.trim(),phone:$("#sPhone").value.trim(),email:$("#sEmail").value.trim(),footer:$("#sFooter").value.trim(),updatedAt:serverTimestamp()};try{await setDoc(doc(db,"settings","site"),data,{merge:true});settings={...settings,...data};$("#footerBrand").textContent=settings.brand||"BELLYSHOP";$("#footerText").textContent=settings.footer||"";$("#settingsDialog").close();toast("설정을 저장했습니다.")}catch{toast("설정 저장에 실패했습니다.")}};
saveCart();