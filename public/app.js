const entriesBody = document.getElementById("entries-body");
const summaryBody = document.getElementById("summary-body");
const entryForm = document.getElementById("entry-form");
const formError = document.getElementById("form-error");
const countBadge = document.getElementById("entry-count-badge");

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

function formatDate(str) {
  if (!str) return "—";
  return str.replace("T", " ").replace("Z", " UTC");
}

function renderEntries(entries) {
  if (!entries.length) {
    entriesBody.innerHTML = '<tr class="empty-row"><td colspan="10">No entries found.</td></tr>';
    return;
  }
  entriesBody.innerHTML = entries.map(e => `
    <tr>
      <td>${e.id}</td>
      <td>${e.warehouse_id}</td>
      <td><span class="badge badge--${e.category}">${e.category}</span></td>
      <td>${e.item_name}</td>
      <td>${e.week_number}</td>
      <td>${e.quantity}</td>
      <td>${e.unit}</td>
      <td>${e.recorded_by}</td>
      <td>${formatDate(e.created_at)}</td>
      <td><button class="delete-btn" data-id="${e.id}">✕</button></td>
    </tr>
  `).join("");
}

function renderSummary(summary) {
  if (!summary.length) {
    summaryBody.innerHTML = '<tr class="empty-row"><td colspan="4">No summary data.</td></tr>';
    return;
  }
  summaryBody.innerHTML = summary.map(s => `
    <tr>
      <td><span class="badge badge--${s.category}">${s.category}</span></td>
      <td>${s.week_number}</td>
      <td>${s.total_quantity}</td>
      <td>${s.entry_count}</td>
    </tr>
  `).join("");
}

async function loadEntries(params = {}) {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.min_quantity !== undefined && params.min_quantity !== "") qs.set("min_quantity", params.min_quantity);
  const { data } = await api(`/entries?${qs}`);
  renderEntries(data.entries || []);
  countBadge.textContent = `${data.count || 0} entries`;
}

async function loadSummary() {
  const { data } = await api("/summary");
  renderSummary(data.summary || []);
}

async function refresh() {
  await Promise.all([loadEntries(), loadSummary()]);
}

entryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.hidden = true;
  const fd = new FormData(entryForm);
  const body = {
    warehouse_id: fd.get("warehouse_id").trim(),
    category: fd.get("category"),
    item_name: fd.get("item_name").trim(),
    week_number: parseInt(fd.get("week_number"), 10),
    quantity: parseInt(fd.get("quantity"), 10),
    unit: fd.get("unit"),
    recorded_by: fd.get("recorded_by").trim()
  };
  const { ok, data } = await api("/entries", { method: "POST", body: JSON.stringify(body) });
  if (ok) {
    entryForm.reset();
    await refresh();
  } else {
    formError.hidden = false;
    if (data.error === "validation_error") {
      formError.innerHTML = data.detail.map(d => `<div>• <b>${d.field}</b>: ${d.message}</div>`).join("");
    } else {
      formError.textContent = data.message || "An error occurred.";
    }
  }
});

entriesBody.addEventListener("click", async (e) => {
  const btn = e.target.closest(".delete-btn");
  if (!btn) return;
  const id = btn.dataset.id;
  if (!confirm(`Delete entry #${id}?`)) return;
  const { ok, data } = await api(`/entries/${id}`, { method: "DELETE" });
  if (ok) {
    await refresh();
  } else {
    alert(data.message || "Delete failed.");
  }
});

document.getElementById("filter-btn").addEventListener("click", async () => {
  const category = document.getElementById("filter-category").value.trim();
  const min_quantity = document.getElementById("filter-min-qty").value;
  await loadEntries({ category, min_quantity });
});

document.getElementById("clear-btn").addEventListener("click", async () => {
  document.getElementById("filter-category").value = "";
  document.getElementById("filter-min-qty").value = "";
  await loadEntries();
});

document.getElementById("refresh-summary").addEventListener("click", loadSummary);

refresh();
