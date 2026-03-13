/**
 * popup.js — Lógica del popup de la extensión
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

function sendMessageToTab(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
      else resolve(response);
    });
  });
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function loadProperties() {
  const result = await chrome.storage.local.get(["properties"]);
  return result.properties || [];
}

async function saveProperties(properties) {
  await chrome.storage.local.set({ properties });
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  document.getElementById(viewId)?.classList.remove("hidden");
}

function setStatus(msg, type = "info") {
  const el = document.getElementById("save-status");
  if (!el) return;
  el.textContent = msg;
  el.className = `status-msg status-${type}`;
}

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// Extrae el número de un string de precio "349.900 €" → 349900
function parsePrice(priceStr) {
  if (!priceStr) return null;
  const num = parseFloat(priceStr.replace(/[^\d,]/g, "").replace(",", "."));
  return isNaN(num) ? null : num;
}

// Renderiza el historial de precios de una propiedad
function renderPriceHistory(history) {
  if (!history?.length) return "";

  const rows = history.map((entry, i) => {
    const prev = history[i - 1];
    const current = parsePrice(entry.price);
    const prevPrice = prev ? parsePrice(prev.price) : null;

    let indicator = "";
    if (prevPrice !== null && current !== null) {
      if (current < prevPrice) indicator = `<span class="price-down">▼</span>`;
      else if (current > prevPrice) indicator = `<span class="price-up">▲</span>`;
      else indicator = `<span class="price-same">–</span>`;
    }

    const date = new Date(entry.date).toLocaleDateString("es-ES", {
      day: "numeric", month: "short", year: "numeric"
    });

    return `<li class="history-row">${indicator}<span class="history-price">${escapeHtml(entry.price)}</span><span class="history-date">${date}</span></li>`;
  }).reverse(); // más reciente primero

  return `
    <div class="history-block">
      <button class="btn-toggle-history" data-expanded="false">Historial de precios (${history.length})</button>
      <ul class="history-list hidden">${rows.join("")}</ul>
    </div>
  `;
}

// ─── Renderizado: Preview de propiedad actual ────────────────────────────────

function renderPropertyPreview(property) {
  const container = document.getElementById("property-preview");
  if (!container) return;

  const photosHtml = property.coverPhoto
    ? `<img class="cover-photo" src="${escapeHtml(property.coverPhoto)}" alt="" />`
    : "";

  const detailsHtml = property.details?.length
    ? `<p class="preview-details">${property.details.slice(0, 4).map(escapeHtml).join(" · ")}</p>`
    : "";

  const descHtml = property.description
    ? `<div class="desc-block">
        <p class="desc-text collapsed" id="preview-desc">${escapeHtml(property.description)}</p>
        <button class="btn-toggle-desc" data-target="preview-desc">Ver más</button>
       </div>`
    : "";

  container.innerHTML = `
    ${photosHtml}
    <p class="preview-title">${escapeHtml(property.title ?? "Sin título")}</p>
    ${property.address ? `<p class="preview-address">${escapeHtml(property.address)}</p>` : ""}
    <p class="preview-price">${escapeHtml(property.price ?? "Precio no disponible")}</p>
    ${detailsHtml}
    ${descHtml}
  `;

  bindDescToggles(container);
}

// ─── Renderizado: Lista de guardadas ─────────────────────────────────────────

function renderSavedList(properties) {
  const list = document.getElementById("saved-list");
  const countEl = document.getElementById("saved-count");
  if (!list || !countEl) return;

  countEl.textContent = properties.length;

  if (properties.length === 0) {
    list.innerHTML = `<li class="empty-msg">No hay viviendas guardadas.</li>`;
    return;
  }

  list.innerHTML = properties
    .slice()
    .reverse()
    .map((p, reversedIndex) => {
      const realIndex = properties.length - 1 - reversedIndex;
      const date = p.savedAt ? new Date(p.savedAt).toLocaleDateString("es-ES") : "";

      const photosHtml = p.coverPhoto
        ? `<img class="cover-photo" src="${escapeHtml(p.coverPhoto)}" alt="" />`
        : "";

      const featuresHtml = p.features?.length
        ? `<ul class="feature-list">${p.features.slice(0, 6).map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>`
        : "";

      const descId = `desc-${realIndex}`;
      const descHtml = p.description
        ? `<div class="desc-block">
            <p class="desc-text collapsed" id="${descId}">${escapeHtml(p.description)}</p>
            <button class="btn-toggle-desc" data-target="${descId}">Ver descripción</button>
           </div>`
        : "";

      const historyHtml = renderPriceHistory(p.priceHistory);

      return `
        <li class="saved-item" data-index="${realIndex}">
          <div class="saved-header">
            <a class="saved-title" href="${escapeHtml(p.url)}" target="_blank">${escapeHtml(truncate(p.title ?? "Sin título", 48))}</a>
            <button class="btn-remove" data-index="${realIndex}" title="Eliminar">✕</button>
          </div>
          ${p.address ? `<p class="saved-address">${escapeHtml(p.address)}</p>` : ""}
          <p class="saved-price">${escapeHtml(p.price ?? "—")}</p>
          ${p.details?.length ? `<p class="saved-details">${p.details.slice(0, 3).map(escapeHtml).join(" · ")}</p>` : ""}
          ${photosHtml}
          ${historyHtml}
          ${featuresHtml}
          ${descHtml}
          <span class="saved-date">Guardado: ${date}</span>
        </li>
      `;
    })
    .join("");

  // Listeners eliminar
  list.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index, 10);
      const props = await loadProperties();
      props.splice(index, 1);
      await saveProperties(props);
      renderSavedList(props);
    });
  });

  bindDescToggles(list);
  bindHistoryToggles(list);
}

// Botones "Ver más / Ver menos" para descripciones
function bindDescToggles(container) {
  container.querySelectorAll(".btn-toggle-desc").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const isCollapsed = target.classList.toggle("collapsed");
      btn.textContent = isCollapsed ? "Ver más" : "Ver menos";
    });
  });
}

// Botones de historial de precios
function bindHistoryToggles(container) {
  container.querySelectorAll(".btn-toggle-history").forEach((btn) => {
    btn.addEventListener("click", () => {
      const list = btn.nextElementSibling;
      if (!list) return;
      const isHidden = list.classList.toggle("hidden");
      btn.dataset.expanded = isHidden ? "false" : "true";
    });
  });
}

// ─── Inicialización ──────────────────────────────────────────────────────────

async function init() {
  const tab = await getActiveTab();
  let isProperty = false;

  try {
    const response = await sendMessageToTab(tab.id, { type: "IS_PROPERTY_PAGE" });
    isProperty = response?.isProperty ?? false;
  } catch {
    isProperty = false;
  }

  const properties = await loadProperties();

  if (isProperty) {
    showView("view-property");
    try {
      const response = await sendMessageToTab(tab.id, { type: "GET_PROPERTY" });
      if (response?.success && response.data) {
        renderPropertyPreview(response.data);
      }
    } catch {
      // No crítico
    }
  } else {
    showView("view-no-property");
  }

  // Lista de guardadas siempre visible
  document.getElementById("view-saved")?.classList.remove("hidden");
  renderSavedList(properties);

  // ─── Guardar vivienda ──────────────────────────────────────────────────────
  document.getElementById("btn-save")?.addEventListener("click", async () => {
    setStatus("Guardando…", "info");
    try {
      const response = await sendMessageToTab(tab.id, { type: "GET_PROPERTY" });
      if (!response?.success || !response.data) {
        setStatus("No se pudieron extraer los datos.", "error");
        return;
      }

      const property = response.data;
      const props = await loadProperties();

      const existingIndex = props.findIndex((p) => p.url === property.url);

      if (existingIndex !== -1) {
        // Propiedad ya guardada → actualizar precio e historial
        const existing = props[existingIndex];
        const oldPrice = existing.price;
        const newPrice = property.price;

        // Inicializar historial si no existe (compatibilidad con entradas antiguas)
        if (!existing.priceHistory) {
          existing.priceHistory = [{ price: oldPrice, date: existing.savedAt }];
        }

        if (oldPrice !== newPrice) {
          existing.price = newPrice;
          existing.priceHistory.push({ price: newPrice, date: new Date().toISOString() });
          // Actualizar también fotos y descripción por si han cambiado
          existing.photos = property.photos;
          existing.description = property.description;
          props[existingIndex] = existing;
          await saveProperties(props);
          setStatus(`Precio actualizado: ${newPrice}`, "success");
        } else {
          setStatus("Sin cambios de precio.", "info");
        }
      } else {
        // Nueva propiedad → guardar con historial inicial
        property.priceHistory = [{ price: property.price, date: property.savedAt }];
        props.push(property);
        await saveProperties(props);
        setStatus("¡Vivienda guardada!", "success");
      }

      renderSavedList(props);
    } catch (err) {
      setStatus("Error al guardar.", "error");
      console.error(err);
    }
  });

  // ─── Exportar ──────────────────────────────────────────────────────────────
  document.getElementById("btn-export")?.addEventListener("click", async () => {
    const props = await loadProperties();
    if (!props.length) {
      alert("No hay viviendas guardadas para exportar.");
      return;
    }
    const json = JSON.stringify(props, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `idetracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // ─── Importar ──────────────────────────────────────────────────────────────
  document.getElementById("btn-import-trigger")?.addEventListener("click", () => {
    document.getElementById("btn-import")?.click();
  });

  document.getElementById("btn-import")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);

      if (!Array.isArray(imported)) {
        alert("Archivo no válido: debe ser un array de viviendas.");
        return;
      }

      const existing = await loadProperties();
      const existingUrls = new Set(existing.map((p) => p.url));

      let added = 0;
      let skipped = 0;

      for (const p of imported) {
        if (!p.url || !p.title) { skipped++; continue; }
        if (existingUrls.has(p.url)) { skipped++; continue; }
        existing.push(p);
        existingUrls.add(p.url);
        added++;
      }

      await saveProperties(existing);
      renderSavedList(existing);
      alert(`Importación completada: ${added} añadidas, ${skipped} omitidas (duplicadas o inválidas).`);
    } catch {
      alert("Error al leer el archivo. Asegúrate de que es un JSON exportado por IdeTracker.");
    }

    // Reset input para permitir reimportar el mismo archivo
    e.target.value = "";
  });

  // ─── Borrar todo ───────────────────────────────────────────────────────────
  document.getElementById("btn-clear-all")?.addEventListener("click", async () => {
    if (!confirm("¿Borrar todas las viviendas guardadas?")) return;
    await saveProperties([]);
    renderSavedList([]);
  });
}

document.addEventListener("DOMContentLoaded", init);
