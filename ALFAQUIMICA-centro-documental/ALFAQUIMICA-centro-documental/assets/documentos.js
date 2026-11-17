/*
 * ALFA QUÍMICA - Centro documental público
 * Solo consulta documentos publicados en Sanity. No contiene tokens ni secretos.
 */
(() => {
  "use strict";

  const CONFIG = {
    projectId: "REEMPLAZAR_CON_PROJECT_ID",
    dataset: "production",
    apiVersion: "2025-02-19"
  };

  const root = document.getElementById("centro-documental");
  if (!root) return;

  const searchInput = root.querySelector("#aq-doc-search");
  const categorySelect = root.querySelector("#aq-doc-category");
  const list = root.querySelector("#aq-doc-list");
  const count = root.querySelector("#aq-doc-count");
  const status = root.querySelector("#aq-doc-status");
  const modal = root.querySelector("#aq-doc-modal");
  const frame = root.querySelector("#aq-doc-frame");
  const modalTitle = root.querySelector("#aq-doc-modal-title");
  const versionSelect = root.querySelector("#aq-doc-version");
  const downloadLink = root.querySelector("#aq-doc-download");
  const closeButton = root.querySelector("#aq-doc-close");

  const categoryLabels = {
    "ficha-tecnica": "Ficha técnica",
    "hoja-seguridad": "Hoja de seguridad",
    "hoja-ayuda": "Hoja de ayuda",
    "manual": "Manual"
  };

  let allDocuments = [];
  let activeVersions = [];

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));

  const formatDate = (value) => {
    if (!value) return "Fecha no indicada";
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime())
      ? escapeHtml(value)
      : new Intl.DateTimeFormat("es-MX", { year: "numeric", month: "short", day: "numeric" }).format(date);
  };

  const versionCompare = (a, b) => {
    const dateA = a.fechaEmision || "";
    const dateB = b.fechaEmision || "";
    if (dateA !== dateB) return dateB.localeCompare(dateA);
    return String(b.version || "").localeCompare(String(a.version || ""), "es", { numeric: true });
  };

  async function loadDocuments() {
    if (!CONFIG.projectId || CONFIG.projectId.includes("REEMPLAZAR")) {
      status.textContent = "Falta configurar el Project ID de Sanity en assets/documentos.js.";
      return;
    }

    const query = `*[_type == "documentoTecnico" && publicado == true && defined(archivo.asset)] | order(fechaEmision desc, _updatedAt desc) {
      _id, titulo, codigoDocumento, producto, categoria, descripcion, version,
      fechaEmision, destacado, palabrasClave,
      "archivoUrl": archivo.asset->url,
      "nombreArchivo": archivo.asset->originalFilename
    }`;

    const endpoint = `https://${CONFIG.projectId}.api.sanity.io/v${CONFIG.apiVersion}/data/query/${CONFIG.dataset}?query=${encodeURIComponent(query)}`;

    try {
      const response = await fetch(endpoint, { headers: { "Accept": "application/json" } });
      if (!response.ok) throw new Error(`Sanity respondió HTTP ${response.status}`);
      const payload = await response.json();
      allDocuments = Array.isArray(payload.result) ? payload.result : [];
      renderDocuments();
      status.hidden = allDocuments.length > 0;
      if (!allDocuments.length) status.textContent = "Todavía no hay documentos publicados.";
    } catch (error) {
      console.error("ALFA QUÍMICA documentos:", error);
      status.hidden = false;
      status.textContent = "No fue posible cargar los documentos. Intenta nuevamente más tarde.";
    }
  }

  function getLatestPerDocument(records) {
    const groups = new Map();
    records.forEach((doc) => {
      const key = doc.codigoDocumento || doc._id;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(doc);
    });

    return [...groups.values()].map((versions) => {
      versions.sort(versionCompare);
      return { current: versions[0], versions };
    }).sort((a, b) => {
      if (!!a.current.destacado !== !!b.current.destacado) return a.current.destacado ? -1 : 1;
      return versionCompare(a.current, b.current);
    });
  }

  function renderDocuments() {
    const term = searchInput.value.trim().toLocaleLowerCase("es-MX");
    const category = categorySelect.value;

    const filtered = allDocuments.filter((doc) => {
      const haystack = [
        doc.titulo, doc.producto, doc.descripcion, doc.codigoDocumento,
        ...(Array.isArray(doc.palabrasClave) ? doc.palabrasClave : [])
      ].join(" ").toLocaleLowerCase("es-MX");
      return (!term || haystack.includes(term)) && (!category || doc.categoria === category);
    });

    const groups = getLatestPerDocument(filtered);
    count.textContent = `${groups.length} documento${groups.length === 1 ? "" : "s"} disponible${groups.length === 1 ? "" : "s"}`;

    if (!groups.length) {
      list.innerHTML = "";
      status.hidden = false;
      status.textContent = "No encontramos documentos con esos criterios.";
      return;
    }
    status.hidden = true;

    list.innerHTML = groups.map(({ current, versions }) => {
      const categoryLabel = categoryLabels[current.categoria] || "Documento";
      const versionText = current.version ? `Versión ${escapeHtml(current.version)}` : "Versión no indicada";
      const versionButton = versions.length > 1
        ? `<button class="aq-doc-secondary" type="button" data-action="preview" data-id="${escapeHtml(current._id)}">Ver ${versions.length} versiones</button>`
        : `<button class="aq-doc-secondary" type="button" data-action="preview" data-id="${escapeHtml(current._id)}">Vista previa</button>`;

      return `
        <article class="aq-doc-card ${current.destacado ? "aq-doc-featured" : ""}">
          <div class="aq-doc-card-top">
            <div class="aq-doc-pdf" aria-hidden="true">PDF</div>
            <div>
              <h3>${escapeHtml(current.titulo)}</h3>
              <div class="aq-doc-meta">${escapeHtml(current.producto || "Producto no especificado")}</div>
              <span class="aq-doc-chip">${escapeHtml(categoryLabel)}</span>
            </div>
          </div>
          <p class="aq-doc-description">${escapeHtml(current.descripcion || "Consulta el documento para conocer sus detalles.")}</p>
          <div class="aq-doc-meta">${versionText} · ${formatDate(current.fechaEmision)}</div>
          <div class="aq-doc-actions">
            ${versionButton}
            <a class="aq-doc-button aq-doc-primary" href="${escapeHtml(current.archivoUrl)}" target="_blank" rel="noopener noreferrer" download>Descargar PDF</a>
          </div>
        </article>`;
    }).join("");
  }

  function openPreview(documentId) {
    const doc = allDocuments.find((item) => item._id === documentId);
    if (!doc) return;

    const group = allDocuments.filter((item) =>
      (item.codigoDocumento || item._id) === (doc.codigoDocumento || doc._id)
    ).sort(versionCompare);

    activeVersions = group;
    modalTitle.textContent = doc.titulo || "Vista previa del documento";
    versionSelect.innerHTML = group.map((item) =>
      `<option value="${escapeHtml(item._id)}">${escapeHtml(item.version || "Sin versión")} · ${escapeHtml(item.fechaEmision || "Sin fecha")}</option>`
    ).join("");
    versionSelect.value = doc._id;
    showSelectedVersion();
    modal.hidden = false;
    closeButton.focus();
  }

  function showSelectedVersion() {
    const selected = activeVersions.find((item) => item._id === versionSelect.value);
    if (!selected) return;
    frame.src = `${selected.archivoUrl}#toolbar=1&navpanes=0`;
    downloadLink.href = selected.archivoUrl;
    downloadLink.setAttribute("download", selected.nombreArchivo || "documento.pdf");
    modalTitle.textContent = `${selected.titulo || "Documento"} — ${selected.version || "Versión"}`;
  }

  function closePreview() {
    modal.hidden = true;
    frame.src = "about:blank";
  }

  searchInput.addEventListener("input", renderDocuments);
  categorySelect.addEventListener("change", renderDocuments);

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action='preview']");
    if (button) openPreview(button.dataset.id);
  });

  versionSelect.addEventListener("change", showSelectedVersion);
  closeButton.addEventListener("click", closePreview);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closePreview();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.hidden) closePreview();
  });

  loadDocuments();
})();
