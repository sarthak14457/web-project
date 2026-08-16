const API_BASE = "https://web-project-server-xu4m.onrender.com/api";

const params = new URLSearchParams(window.location.search);
const token = params.get("token");
if (!token) window.location.href = "admin-login.html";

const money = (n) => "$" + Number(n).toFixed(2);

let suppliers = [];
let products = [];
let users = [];

function authHeaders(extra = {}) {
  return { Authorization: "Bearer " + token, ...extra };
}

async function api(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: authHeaders({
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }),
  });
  if (res.status === 401) {
    window.location.href = "admin-login.html";
    return;
  }
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ======================== TAB SWITCHING ========================
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab + "Tab").classList.add("active");
  });
});

// ======================== USERS ========================
function updateUserStats() {
  document.getElementById("statUsers").textContent = users.length;
  document.getElementById("userEmptyMsg").style.display = users.length ? "none" : "block";
}

function supplierOptionsHtml(selectedId) {
  const none = `<option value="" ${!selectedId ? "selected" : ""}>— none —</option>`;
  const rest = suppliers
    .map(
      (s) =>
        `<option value="${s.id}" ${s.id === selectedId ? "selected" : ""}>${s.name}</option>`,
    )
    .join("");
  return none + rest;
}

function addUserRow(user) {
  const tr = document.createElement("tr");
  tr.dataset.id = user.id;
  tr.innerHTML = `
    <td>${user.name}</td>
    <td>${user.email}</td>
    <td>
      <select class="roleSelect" style="padding:5px;">
        <option value="Staff" ${user.role === "Staff" ? "selected" : ""}>Staff</option>
        <option value="Admin" ${user.role === "Admin" ? "selected" : ""}>Admin</option>
      </select>
    </td>
    <td><span class="tag ${user.status === "Active" ? "active" : "suspended"}">${user.status}</span></td>
    <td class="row-actions">
      <button class="toggle">${user.status === "Active" ? "Suspend" : "Reactivate"}</button>
      <button class="del">Delete</button>
    </td>
  `;
  document.getElementById("userTbody").appendChild(tr);
}

async function loadUsers() {
  users = await api("/users");
  document.getElementById("userTbody").innerHTML = "";
  users.forEach(addUserRow);
  updateUserStats();
}

document.getElementById("userAddForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("userName").value.trim();
  const email = document.getElementById("userEmail").value.trim();
  const password = document.getElementById("userPassword").value;
  const role = document.getElementById("userRole").value;
  if (!name || !email || !password) return;

  try {
    await fetch(API_BASE + "/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create user");
    });
    e.target.reset();
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("userTbody").addEventListener("change", async (e) => {
  if (!e.target.classList.contains("roleSelect")) return;
  const tr = e.target.closest("tr");
  const id = tr.dataset.id;
  await api(`/users/${id}`, { method: "PUT", body: JSON.stringify({ role: e.target.value }) });
  loadUsers();
});

document.getElementById("userTbody").addEventListener("click", async (e) => {
  const tr = e.target.closest("tr");
  if (!tr) return;
  const id = tr.dataset.id;

  if (e.target.classList.contains("toggle")) {
    const status = tr.querySelector(".tag").textContent === "Active" ? "Suspended" : "Active";
    await api(`/users/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
    loadUsers();
  }
  if (e.target.classList.contains("del")) {
    await api(`/users/${id}`, { method: "DELETE" });
    loadUsers();
  }
});

// ======================== PRODUCTS ========================
function updateProductStats() {
  document.getElementById("statProducts").textContent = products.length;
  document.getElementById("productEmptyMsg").style.display = products.length ? "none" : "block";
}

function addProductRow(item) {
  const tr = document.createElement("tr");
  tr.dataset.id = item.id;
  const low = item.qty <= item.threshold;
  tr.innerHTML = `
    <td><input type="text" value="${item.name}" class="nameInput" style="min-width:120px; padding:5px;"></td>
    <td class="num"><input type="number" min="0" value="${item.qty}" class="qtyInput" style="width:60px; padding:5px;"></td>
    <td class="num"><input type="number" min="0" value="${item.threshold}" class="thresholdInput" style="width:60px; padding:5px;"></td>
    <td class="num"><input type="number" min="0" step="0.01" value="${item.price}" class="priceInput" style="width:70px; padding:5px;"></td>
    <td><select class="supplierInput" style="padding:5px;">${supplierOptionsHtml(item.supplierId)}</select></td>
    <td><span class="tag ${low ? "low" : "ok"}">${low ? "Low stock" : "In stock"}</span></td>
    <td class="row-actions"><button class="del">Delete</button></td>
  `;
  document.getElementById("productTbody").appendChild(tr);
}

async function loadProducts() {
  products = await api("/items");
  document.getElementById("productTbody").innerHTML = "";
  products.forEach(addProductRow);
  updateProductStats();
}

function updateProductDisplay(tr, updated) {
  tr.querySelector(".nameInput").value = updated.name;
  tr.querySelector(".qtyInput").value = updated.qty;
  tr.querySelector(".thresholdInput").value = updated.threshold;
  tr.querySelector(".priceInput").value = updated.price;
  tr.querySelector(".supplierInput").value = updated.supplierId || "";
  const tag = tr.querySelector(".tag");
  const low = updated.qty <= updated.threshold;
  tag.textContent = low ? "Low stock" : "In stock";
  tag.className = "tag " + (low ? "low" : "ok");
}

const productFieldMap = {
  nameInput: (el) => ({ name: el.value.trim() }),
  qtyInput: (el) => ({ qty: Math.max(0, Number(el.value) || 0) }),
  thresholdInput: (el) => ({ threshold: Math.max(0, Number(el.value) || 0) }),
  priceInput: (el) => ({ price: Math.max(0, Number(el.value) || 0) }),
  supplierInput: (el) => ({ supplierId: el.value }),
};

document.getElementById("productTbody").addEventListener("change", async (e) => {
  const cls = [...e.target.classList].find((c) => productFieldMap[c]);
  if (!cls) return;

  const tr = e.target.closest("tr");
  const id = tr.dataset.id;
  const payload = productFieldMap[cls](e.target);

  const updated = await api(`/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  updateProductDisplay(tr, updated);
});

document.getElementById("productTbody").addEventListener("click", async (e) => {
  if (!e.target.classList.contains("del")) return;
  const tr = e.target.closest("tr");
  await api(`/items/${tr.dataset.id}`, { method: "DELETE" });
  loadProducts();
});

document.getElementById("productAddForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("productName").value.trim();
  if (!name) return;

  await api("/items", {
    method: "POST",
    body: JSON.stringify({
      name,
      qty: Number(document.getElementById("productQty").value) || 0,
      threshold: Number(document.getElementById("productThreshold").value) || 5,
      price: Number(document.getElementById("productPrice").value) || 0,
      supplierId: document.getElementById("productSupplier").value,
    }),
  });
  e.target.reset();
  loadProducts();
});

// ======================== SUPPLIERS ========================
function updateSupplierStats() {
  document.getElementById("statSuppliers").textContent = suppliers.length;
  document.getElementById("supplierEmptyMsg").style.display = suppliers.length ? "none" : "block";
}

function populateProductSupplierSelect() {
  document.getElementById("productSupplier").innerHTML = supplierOptionsHtml(null);
}

function addSupplierRow(supplier) {
  const tr = document.createElement("tr");
  tr.dataset.id = supplier.id;
  const productCount = supplier.products ? supplier.products.length : 0;
  tr.innerHTML = `
    <td><input type="text" value="${supplier.name}" class="nameInput" style="min-width:140px; padding:5px;"></td>
    <td><input type="email" value="${supplier.contactEmail || ""}" class="emailInput" style="min-width:160px; padding:5px;"></td>
    <td><input type="text" value="${supplier.phone || ""}" class="phoneInput" style="min-width:120px; padding:5px;"></td>
    <td><input type="text" value="${supplier.address || ""}" class="addressInput" style="min-width:140px; padding:5px;"></td>
    <td class="num">${productCount}</td>
    <td class="row-actions"><button class="del">Delete</button></td>
  `;
  document.getElementById("supplierTbody").appendChild(tr);
}

async function loadSuppliers() {
  suppliers = await api("/suppliers");
  document.getElementById("supplierTbody").innerHTML = "";
  suppliers.forEach(addSupplierRow);
  updateSupplierStats();
  populateProductSupplierSelect();
}

const supplierFieldMap = {
  nameInput: (el) => ({ name: el.value.trim() }),
  emailInput: (el) => ({ contactEmail: el.value.trim() }),
  phoneInput: (el) => ({ phone: el.value.trim() }),
  addressInput: (el) => ({ address: el.value.trim() }),
};

document.getElementById("supplierTbody").addEventListener("change", async (e) => {
  const cls = [...e.target.classList].find((c) => supplierFieldMap[c]);
  if (!cls) return;

  const tr = e.target.closest("tr");
  const id = tr.dataset.id;
  const payload = supplierFieldMap[cls](e.target);

  await api(`/suppliers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  loadSuppliers();
});

document.getElementById("supplierTbody").addEventListener("click", async (e) => {
  if (!e.target.classList.contains("del")) return;
  const tr = e.target.closest("tr");
  await api(`/suppliers/${tr.dataset.id}`, { method: "DELETE" });
  loadSuppliers();
});

document.getElementById("supplierAddForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("supplierName").value.trim();
  if (!name) return;

  await api("/suppliers", {
    method: "POST",
    body: JSON.stringify({
      name,
      contactEmail: document.getElementById("supplierEmail").value.trim(),
      phone: document.getElementById("supplierPhone").value.trim(),
      address: document.getElementById("supplierAddress").value.trim(),
    }),
  });
  e.target.reset();
  loadSuppliers();
});

// ======================== INIT ========================
(async function init() {
  await loadSuppliers();
  await loadProducts();
  await loadUsers();
})();
