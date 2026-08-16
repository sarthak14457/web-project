const API_BASE = "https://web-project-server-xu4m.onrender.com/api";

// Token comes from the URL (set by login.html on redirect) and is kept in memory for this page only.
const params = new URLSearchParams(window.location.search);
const token = params.get("token");
if (!token) window.location.href = "login.html";
document.getElementById("adminLink").href =
  "admin.html?token=" + encodeURIComponent(token);

const tbody = document.getElementById("tbody");
const emptyMsg = document.getElementById("emptyMsg");
const supplierSelect = document.getElementById("supplier");

const money = (n) => "$" + Number(n).toFixed(2);

let suppliers = [];

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
    window.location.href = "login.html";
    return;
  }
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function updateStats(items) {
  document.getElementById("statItems").textContent = items.length;
  document.getElementById("statUnits").textContent = items.reduce(
    (s, i) => s + i.qty,
    0,
  );
  document.getElementById("statLow").textContent = items.filter(
    (i) => i.qty <= i.threshold,
  ).length;
  emptyMsg.style.display = items.length ? "none" : "block";
}

// Builds the <option> list for a supplier <select>, matching whichever id is currently selected.
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

function populateAddFormSupplierSelect() {
  supplierSelect.innerHTML = supplierOptionsHtml(null);
}

async function loadSuppliers() {
  suppliers = await api("/suppliers");
  populateAddFormSupplierSelect();
}

function addRow(item) {
  const tr = document.createElement("tr");
  tr.dataset.id = item.id;
  const low = item.qty <= item.threshold;
  tr.innerHTML = `
    <td><input type="text" value="${item.name}" class="nameInput" style="min-width:140px; padding:5px;"></td>
    <td class="num"><input type="number" min="0" value="${item.qty}" class="qtyInput" style="width:60px; padding:5px; text-align:right;"></td>
    <td class="num"><input type="number" min="0" value="${item.threshold}" class="thresholdInput" style="width:60px; padding:5px; text-align:right;"></td>
    <td class="num"><input type="number" min="0" step="0.01" value="${item.price}" class="priceInput" style="width:70px; padding:5px; text-align:right;"></td>
    <td class="num valueCell">${money(item.qty * item.price)}</td>
    <td><select class="supplierInput" style="padding:5px;">${supplierOptionsHtml(item.supplierId)}</select></td>
    <td><span class="tag ${low ? "low" : "ok"}">${low ? "Low stock" : "In stock"}</span></td>
    <td class="row-actions"><button class="del">Delete</button></td>
  `;
  tbody.appendChild(tr);
}

async function loadItems() {
  const items = await api("/items");
  tbody.innerHTML = "";
  items.forEach(addRow);
  updateStats(items);
}

function refreshRowDisplay(tr, updated) {
  tr.querySelector(".valueCell").textContent = money(
    updated.qty * updated.price,
  );
  const tag = tr.querySelector(".tag");
  const low = updated.qty <= updated.threshold;
  tag.textContent = low ? "Low stock" : "In stock";
  tag.className = "tag " + (low ? "low" : "ok");
}

// Event delegation: one listener handles edits to any field in any row.
const fieldMap = {
  nameInput: (el) => ({ name: el.value.trim() }),
  qtyInput: (el) => ({ qty: Math.max(0, Number(el.value) || 0) }),
  thresholdInput: (el) => ({ threshold: Math.max(0, Number(el.value) || 0) }),
  priceInput: (el) => ({ price: Math.max(0, Number(el.value) || 0) }),
  supplierInput: (el) => ({ supplierId: el.value }),
};

tbody.addEventListener("change", async (e) => {
  const cls = [...e.target.classList].find((c) => fieldMap[c]);
  if (!cls) return;

  const tr = e.target.closest("tr");
  const id = tr.dataset.id;
  const payload = fieldMap[cls](e.target);

  const updated = await api(`/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  refreshRowDisplay(tr, updated);
});

tbody.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("del")) return;
  const tr = e.target.closest("tr");
  await api(`/items/${tr.dataset.id}`, { method: "DELETE" });
  loadItems();
});

document.getElementById("addForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("name").value.trim();
  if (!name) return;

  await api("/items", {
    method: "POST",
    body: JSON.stringify({
      name,
      qty: Number(document.getElementById("qty").value) || 0,
      threshold: Number(document.getElementById("threshold").value) || 5,
      price: Number(document.getElementById("price").value) || 0,
      supplierId: supplierSelect.value,
    }),
  });
  e.target.reset();
  loadItems();
});

(async function init() {
  await loadSuppliers();
  await loadItems();
})();
