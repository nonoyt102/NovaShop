
// ---- Utilities & state ----
const EUR_TO_FCFA = 650; // demo rate
function nearIntegerEuro(e){ // 1,99 -> 2 rule (if cents > .95)
  const cents = Math.round((e - Math.floor(e))*100);
  if (cents >= 95) return Math.ceil(e);
  return Number(e.toFixed(2));
}

const currencyPref = {
  get: () => localStorage.getItem("currency") || (navigator.language && navigator.language.toLowerCase().includes("fr") ? "FCFA" : "EUR"),
  set: (c) => localStorage.setItem("currency", c)
};

const user = {
  get: () => localStorage.getItem("userEmail"),
  set: (email) => localStorage.setItem("userEmail", email),
  clear: () => localStorage.removeItem("userEmail")
};

const cart = {
  get: () => JSON.parse(localStorage.getItem("cart")||"[]"),
  set: (v) => localStorage.setItem("cart", JSON.stringify(v)),
  add: (p) => {
    const c = cart.get();
    const found = c.find(i=>i.id===p.id);
    if(found) found.qty += 1; else c.push({...p, qty:1});
    cart.set(c);
    updateCartBadge();
  },
  count: () => cart.get().reduce((a,b)=>a+b.qty,0),
  clear: ()=> cart.set([])
};

function eurToDisplay(e){
  e = nearIntegerEuro(e);
  const c = currencyPref.get();
  if(c==="FCFA") return Math.round(e*EUR_TO_FCFA) + " FCFA";
  return e.toFixed(2) + " €";
}

function updateCartBadge(){
  const badge = document.querySelector("[data-cart-badge]");
  if(!badge) return;
  badge.textContent = cart.count();
}

// ---- Rendering ----
async function loadProducts(){
  const res = await fetch("products.json");
  const items = await res.json();
  const grid = document.querySelector("#grid");
  if(!grid) return;
  grid.innerHTML = "";
  items.forEach(p=>{
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <img src="${p.image}" alt="${p.platform}"/>
      <div class="title">${p.name}</div>
      <div class="p"><small class="muted">${p.platform.toUpperCase()}</small></div>
      <div class="price">${eurToDisplay(p.euros)}</div>
      <div style="padding:0 12px 12px">
        <button class="btn" data-add="${p.id}">Ajouter au panier</button>
      </div>
    `;
    grid.appendChild(el);
  });
  grid.addEventListener("click", (e)=>{
    const id = e.target?.getAttribute?.("data-add");
    if(!id) return;
    if(!user.get()){
      alert("Connectez-vous avec Google avant d'ajouter au panier.");
      location.href="login.html";
      return;
    }
    fetch("products.json").then(r=>r.json()).then(all=>{
      const p = all.find(x=>x.id==id);
      cart.add(p);
      alert("Produit ajouté au panier ✅");
    });
  });
}

function renderHeader(title){
  const root = document.querySelector("header .nav .title");
  if(root) root.textContent = title || "NovaShop";
  updateCartBadge();
  const select = document.querySelector("#currencySelect");
  if(select){
    select.value = currencyPref.get();
    select.addEventListener("change", (e)=>{
      currencyPref.set(e.target.value);
      location.reload();
    });
  }
  const userLabel = document.querySelector("[data-user]");
  if(userLabel) userLabel.textContent = user.get() || "Invité";
}

// ---- Cart & checkout ----
async function loadCart(){
  const tbody = document.querySelector("#cartBody");
  const totalEl = document.querySelector("#cartTotal");
  const items = cart.get();
  tbody.innerHTML = "";
  let total = 0;
  items.forEach(i=>{
    total += i.euros * i.qty;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i.name}</td>
      <td>${i.qty}</td>
      <td>${eurToDisplay(i.euros)}</td>
      <td><button class="btn" data-remove="${i.id}">Supprimer</button></td>`;
    tbody.appendChild(tr);
  });
  totalEl.textContent = eurToDisplay(total);
  tbody.addEventListener("click",(e)=>{
    const id = e.target?.getAttribute?.("data-remove");
    if(!id) return;
    const c = cart.get().filter(x=>x.id!=id);
    cart.set(c);
    loadCart();
    updateCartBadge();
  });
}

function requireAuth(){
  if(!user.get()){
    alert("Connexion requise.");
    location.href="login.html";
  }
}

// ---- Mock payments ----
function bindPayments(){
  document.querySelectorAll("[data-pay]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const method = btn.getAttribute("data-pay");
      alert("Démo : paiement via "+method.toUpperCase()+" non connecté.\nBranchez l'API serveur pour la production.");
    });
  });
}

window.NS = {loadProducts,renderHeader,loadCart,requireAuth,bindPayments,user,cart,currencyPref};
