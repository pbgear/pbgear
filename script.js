(function () {
  "use strict";

  const page = document.body.dataset.page || "";
  const config = window.PBDB_CONFIG || {};
  const fallbackImage = config.fallbackImage || "";
  const GOOGLE_BASE = "https://opensheet.elk.sh";
  const PRO_PLAYERS = [
    { name: "Ben Johns", paddleHint: "JOOLA Perseus", skill: "Advanced", style: "Power" },
    { name: "Anna Leigh Waters", paddleHint: "Paddletek Bantam", skill: "Advanced", style: "Balanced" },
    { name: "Tyson McGuffin", paddleHint: "Selkirk Vanguard", skill: "Advanced", style: "Power" },
    { name: "Federico Staksrud", paddleHint: "JOOLA Scorpeus", skill: "Advanced", style: "Control" }
  ];

  let db = [];

  function slugify(value) {
    return (value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function parseNum(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function deriveImageUrl(name, brand, id) {
    const seedBase = slugify(`pb ${id || "0"} ${brand} ${name}`) || "pbdb-default";
    return `https://picsum.photos/seed/${seedBase}/800/600`;
  }

  function cleanRow(row, idx) {
    const id = String(row.id || idx + 1);
    const name = row.name || "Unknown Paddle";
    const brand = row.brand || "Unknown";
    const slug = slugify(name);
    const weight = parseNum(row.weight_oz, 8.0);
    const releaseYear = parseNum(row.release_year, 2024);
    const pros = String(row.pros || "").split("|").map((v) => v.trim()).filter(Boolean);
    const cons = String(row.cons || "").split("|").map((v) => v.trim()).filter(Boolean);

    return {
      id,
      name,
      slug,
      brand,
      weight_oz: weight,
      surface_material: row.surface_material || "Unknown",
      core_material: row.core_material || "Unknown",
      skill_level: row.skill_level || "Beginner",
      paddle_type: row.paddle_type || "Balanced",
      image_url: (row.image_url && String(row.image_url).trim())
        ? row.image_url
        : (fallbackImage || deriveImageUrl(name, brand, id)),
      description: row.description || "No description yet.",
      pros,
      cons,
      affiliate_link: row.affiliate_link || "#",
      release_year: releaseYear
    };
  }

  async function fetchGoogleSheetRows() {
    const { googleSheetId, sheetName } = config;
    if (!googleSheetId || googleSheetId === "PASTE_YOUR_GOOGLE_SHEET_ID_HERE") {
      console.warn("Google Sheet ID not configured.");
      return [];
    }
    const url = `${GOOGLE_BASE}/${googleSheetId}/${encodeURIComponent(sheetName || "sheet1")}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("Failed to fetch sheet data.");
    }
    const rows = await res.json();
    return Array.isArray(rows) ? rows : [];
  }

  function getLocalOverrides() {
    try {
      const raw = localStorage.getItem("pbdb_local_rows");
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function setLocalOverrides(rows) {
    localStorage.setItem("pbdb_local_rows", JSON.stringify(rows));
  }

  async function loadData() {
    const sheetRows = await fetchGoogleSheetRows().catch((err) => {
      console.error(err);
      return [];
    });
    const localRows = getLocalOverrides();
    db = [...sheetRows, ...localRows].map(cleanRow);
  }

  function uniqueValues(rows, key) {
    return [...new Set(rows.map((r) => r[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
  }

  function setSelectOptions(select, values) {
    if (!select) return;
    const existing = select.querySelector("option") ? select.querySelector("option").outerHTML : "";
    select.innerHTML = existing + values.map((v) => `<option value="${v}">${v}</option>`).join("");
  }

  function getWeightBucket(weight) {
    if (weight < 7.7) return "light";
    if (weight <= 8.3) return "medium";
    return "heavy";
  }

  function byFilters(rows, filters) {
    return rows.filter((p) => {
      const searchText = `${p.name} ${p.brand} ${p.surface_material} ${p.core_material} ${p.skill_level} ${p.paddle_type}`.toLowerCase();
      const matchesSearch = !filters.search || searchText.includes(filters.search.toLowerCase());
      const matchesBrand = !filters.brand || p.brand === filters.brand;
      const matchesSkill = !filters.skill || p.skill_level === filters.skill;
      const matchesType = !filters.type || p.paddle_type === filters.type;
      const matchesWeight = !filters.weight || getWeightBucket(p.weight_oz) === filters.weight;
      return matchesSearch && matchesBrand && matchesSkill && matchesType && matchesWeight;
    });
  }

  function cardHTML(p) {
    return `
      <article class="card">
        <a href="paddle.html?slug=${encodeURIComponent(p.slug)}" aria-label="View details for ${p.name}">
          <img class="adaptive-image" src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.src='${fallbackImage}'">
        </a>
        <div class="card-body">
          <h3>${p.name}</h3>
          <p class="meta">${p.brand} · ${p.weight_oz.toFixed(1)} oz</p>
          <div class="tag-row">
            <span class="tag">${p.skill_level}</span>
            <span class="tag">${p.paddle_type}</span>
          </div>
          <a class="btn" href="paddle.html?slug=${encodeURIComponent(p.slug)}">View Details</a>
        </div>
      </article>
    `;
  }

  function renderGrid(container, rows, emptyEl) {
    if (!container) return;
    container.innerHTML = rows.map(cardHTML).join("");
    if (emptyEl) emptyEl.classList.toggle("hidden", rows.length > 0);
    markVerticalImages(container);
  }

  function markVerticalImages(rootEl) {
    const root = rootEl || document;
    root.querySelectorAll("img.adaptive-image").forEach((img) => {
      const applyClass = () => {
        const w = img.naturalWidth || 0;
        const h = img.naturalHeight || 0;
        if (!w || !h) return;
        const ratio = h / w;
        img.classList.toggle("too-vertical", ratio > 1.45);
      };

      if (img.complete) applyClass();
      img.addEventListener("load", applyClass, { once: true });
    });
  }

  function setupNavMenu() {
    const toggle = document.querySelector(".menu-toggle");
    const nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;
    toggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  function getQuery() {
    return new URLSearchParams(window.location.search);
  }

  function renderSearchPages(limitTo12) {
    const searchInput = document.getElementById("search-input");
    const brandSelect = document.getElementById("filter-brand");
    const skillSelect = document.getElementById("filter-skill");
    const typeSelect = document.getElementById("filter-type");
    const weightSelect = document.getElementById("filter-weight");
    const grid = document.getElementById("paddle-grid");
    const empty = document.getElementById("empty-state");

    setSelectOptions(brandSelect, uniqueValues(db, "brand"));
    setSelectOptions(skillSelect, uniqueValues(db, "skill_level"));
    setSelectOptions(typeSelect, uniqueValues(db, "paddle_type"));

    const run = () => {
      const filters = {
        search: searchInput ? searchInput.value.trim() : "",
        brand: brandSelect ? brandSelect.value : "",
        skill: skillSelect ? skillSelect.value : "",
        type: typeSelect ? typeSelect.value : "",
        weight: weightSelect ? weightSelect.value : ""
      };

      let rows = byFilters(db, filters);
      rows.sort((a, b) => a.name.localeCompare(b.name));

      if (page === "paddles") {
        rows = applyPaddlesView(rows);
      }

      if (limitTo12) rows = rows.slice(0, 12);
      renderGrid(grid, rows, empty);
    };

    [searchInput, brandSelect, skillSelect, typeSelect, weightSelect].forEach((el) => {
      if (el) el.addEventListener("input", run);
      if (el) el.addEventListener("change", run);
    });

    run();
  }

  function matchesKeyword(p, keyword) {
    const text = `${p.name} ${p.description} ${p.surface_material} ${p.paddle_type} ${p.brand}`.toLowerCase();
    return text.includes(keyword.toLowerCase());
  }

  function applyPaddlesView(rows) {
    const q = getQuery();
    const view = q.get("view") || "";
    const titleEl = document.getElementById("dynamic-page-title");
    const introEl = document.getElementById("dynamic-page-intro");

    function setHeader(title, intro) {
      if (titleEl) titleEl.textContent = title;
      if (introEl) introEl.textContent = intro;
      document.title = `${title} | Pickleball Paddle Database`;
    }

    if (!view) {
      setHeader("All Paddles", "Browse every paddle in the database.");
      return rows;
    }

    const builders = {
      "best-beginners": {
        title: "Best Paddles for Beginners",
        intro: "Easy-to-use paddles with forgiving feel and great value.",
        filter: (r) => r.skill_level === "Beginner"
      },
      "best-control": {
        title: "Best Control Paddles",
        intro: "Paddles focused on touch, placement, and softer control.",
        filter: (r) => r.paddle_type === "Control"
      },
      "best-power": {
        title: "Best Power Paddles",
        intro: "Top picks for drives, put-aways, and aggressive shotmaking.",
        filter: (r) => r.paddle_type === "Power"
      },
      "best-lightweight": {
        title: "Best Lightweight Paddles",
        intro: "Faster hands and maneuverability with lighter builds.",
        filter: (r) => r.weight_oz < 7.7
      },
      "new-pickleball-paddles": {
        title: "New Pickleball Paddles",
        intro: "Newest paddle releases sorted by release year.",
        filter: () => true,
        sort: (a, b) => b.release_year - a.release_year
      }
    };

    if (builders[view]) {
      const cfg = builders[view];
      setHeader(cfg.title, cfg.intro);
      const out = rows.filter(cfg.filter);
      if (cfg.sort) out.sort(cfg.sort);
      return out;
    }

    // Programmatic SEO style pages via query view slug conventions.
    const decoded = view.replace(/-/g, " ");
    setHeader(toTitleCase(decoded), `Automatically filtered page for: ${decoded}.`);

    return rows.filter((p) => {
      const slugName = slugify(`${p.brand} ${p.paddle_type} ${p.skill_level} ${p.surface_material} ${getWeightBucket(p.weight_oz)}`);
      return slugName.includes(view) || matchesKeyword(p, decoded);
    });
  }

  function toTitleCase(value) {
    return value
      .split(" ")
      .map((w) => w ? w[0].toUpperCase() + w.slice(1) : "")
      .join(" ");
  }

  function addProductSchema(paddle) {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: paddle.name,
      brand: {
        "@type": "Brand",
        name: paddle.brand
      },
      image: paddle.image_url,
      description: paddle.description,
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        url: paddle.affiliate_link
      }
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }

  function renderDetailPage() {
    const target = document.getElementById("paddle-detail");
    const empty = document.getElementById("detail-empty");
    if (!target) return;

    const q = getQuery();
    const slug = q.get("slug") || "";
    const paddle = db.find((p) => p.slug === slug);

    if (!paddle) {
      empty.classList.remove("hidden");
      return;
    }

    document.title = `${paddle.name} | Pickleball Paddle Database`;

    target.innerHTML = `
      <div>
        <img class="adaptive-image" src="${paddle.image_url}" alt="${paddle.name}" onerror="this.src='${fallbackImage}'">
      </div>
      <div>
        <h1>${paddle.name}</h1>
        <p class="meta">${paddle.brand}</p>
        <div class="spec-grid">
          <div class="spec"><strong>Weight</strong>${paddle.weight_oz.toFixed(1)} oz</div>
          <div class="spec"><strong>Surface</strong>${paddle.surface_material}</div>
          <div class="spec"><strong>Core</strong>${paddle.core_material}</div>
          <div class="spec"><strong>Skill Level</strong>${paddle.skill_level}</div>
          <div class="spec"><strong>Paddle Type</strong>${paddle.paddle_type}</div>
          <div class="spec"><strong>Release Year</strong>${paddle.release_year}</div>
        </div>
        <p>${paddle.description}</p>
        <p><strong>Pros:</strong> ${paddle.pros.join(", ") || "N/A"}</p>
        <p><strong>Cons:</strong> ${paddle.cons.join(", ") || "N/A"}</p>
        <p>
          <a class="btn" href="${paddle.affiliate_link}" target="_blank" rel="noopener noreferrer sponsored">View on Amazon</a>
        </p>
      </div>
    `;

    markVerticalImages(target);
    addProductSchema(paddle);
  }

  function renderComparePage() {
    const aSel = document.getElementById("compare-a");
    const bSel = document.getElementById("compare-b");
    const btn = document.getElementById("compare-btn");
    const result = document.getElementById("compare-result");
    const preview = document.getElementById("compare-url-preview");
    if (!aSel || !bSel || !btn || !result) return;

    const options = db.map((p) => `<option value="${p.slug}">${p.name} (${p.brand})</option>`).join("");
    aSel.innerHTML += options;
    bSel.innerHTML += options;

    const q = getQuery();
    const match = (q.get("match") || "").split("-vs-");
    if (match.length === 2) {
      aSel.value = match[0];
      bSel.value = match[1];
    }

    function oneCol(p) {
      return `
        <article class="compare-col">
          <img class="adaptive-image" src="${p.image_url}" alt="${p.name}" onerror="this.src='${fallbackImage}'">
          <h2>${p.name}</h2>
          <p class="meta">${p.brand}</p>
          <p><strong>Weight:</strong> ${p.weight_oz.toFixed(1)} oz</p>
          <p><strong>Surface:</strong> ${p.surface_material}</p>
          <p><strong>Core:</strong> ${p.core_material}</p>
          <p><strong>Skill Level:</strong> ${p.skill_level}</p>
          <p><a class="btn" href="paddle.html?slug=${encodeURIComponent(p.slug)}">View Details</a></p>
        </article>
      `;
    }

    function run() {
      const pa = db.find((p) => p.slug === aSel.value);
      const pb = db.find((p) => p.slug === bSel.value);
      const slugA = aSel.value || "paddle-a";
      const slugB = bSel.value || "paddle-b";
      preview.textContent = `/compare/${slugA}-vs-${slugB}`;

      if (!pa || !pb) {
        result.innerHTML = "";
        return;
      }

      const url = new URL(window.location.href);
      url.searchParams.set("match", `${pa.slug}-vs-${pb.slug}`);
      history.replaceState({}, "", url);

      document.title = `${pa.name} vs ${pb.name} | Paddle Compare`;
      result.innerHTML = oneCol(pa) + oneCol(pb);
      markVerticalImages(result);
    }

    btn.addEventListener("click", run);
    aSel.addEventListener("change", run);
    bSel.addEventListener("change", run);
    run();
  }

  function renderFinderPage() {
    const form = document.getElementById("finder-form");
    const results = document.getElementById("finder-results");
    const empty = document.getElementById("finder-empty");
    if (!form || !results || !empty) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const skill = document.getElementById("quiz-skill").value;
      const style = document.getElementById("quiz-style").value;
      const weightPref = document.getElementById("quiz-weight").value;

      let out = db.filter((p) => p.skill_level === skill && p.paddle_type === style && getWeightBucket(p.weight_oz) === weightPref);
      if (!out.length) {
        out = db.filter((p) => p.skill_level === skill || p.paddle_type === style).slice(0, 12);
      }
      renderGrid(results, out, empty);
    });
  }

  function renderProPlayersPage() {
    const container = document.getElementById("pro-player-list");
    if (!container) return;

    const cards = PRO_PLAYERS.map((pro) => {
      const paddle = db.find((p) => `${p.name} ${p.brand}`.toLowerCase().includes(pro.paddleHint.toLowerCase())) || db.find((p) => p.skill_level === "Advanced");
      if (!paddle) return "";

      return `
        <article class="pro-card">
          <h2>${pro.name}</h2>
          <p><strong>Paddle Used:</strong> ${paddle.name}</p>
          <p><strong>Brand:</strong> ${paddle.brand}</p>
          <p><strong>Weight:</strong> ${paddle.weight_oz.toFixed(1)} oz</p>
          <p><strong>Surface:</strong> ${paddle.surface_material}</p>
          <p><strong>Core:</strong> ${paddle.core_material}</p>
          <p><strong>Skill Focus:</strong> ${pro.style}</p>
          <p><a class="btn" href="${paddle.affiliate_link}" target="_blank" rel="noopener noreferrer sponsored">View on Amazon</a></p>
        </article>
      `;
    }).join("");

    container.innerHTML = cards;
  }

  function setupAdminForm() {
    const form = document.getElementById("admin-form");
    if (!form) return;

    const resetBtn = document.getElementById("admin-reset");
    const idEl = document.getElementById("admin-id");

    const fields = {
      name: document.getElementById("admin-name"),
      brand: document.getElementById("admin-brand"),
      weight_oz: document.getElementById("admin-weight"),
      surface_material: document.getElementById("admin-surface"),
      core_material: document.getElementById("admin-core"),
      skill_level: document.getElementById("admin-skill"),
      paddle_type: document.getElementById("admin-type"),
      image_url: document.getElementById("admin-image"),
      description: document.getElementById("admin-description"),
      pros: document.getElementById("admin-pros"),
      cons: document.getElementById("admin-cons"),
      affiliate_link: document.getElementById("admin-affiliate"),
      release_year: document.getElementById("admin-year")
    };

    function clear() {
      idEl.value = "";
      Object.values(fields).forEach((el) => { el.value = ""; });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const localRows = getLocalOverrides();
      const id = idEl.value || `local-${Date.now()}`;
      const row = { id };

      Object.keys(fields).forEach((key) => {
        row[key] = fields[key].value;
      });

      const existingIdx = localRows.findIndex((r) => String(r.id) === String(id));
      if (existingIdx >= 0) localRows[existingIdx] = row;
      else localRows.push(row);

      setLocalOverrides(localRows);
      alert("Saved locally in this browser. For permanent edits, update Google Sheets.");
      clear();
      loadData().then(() => renderSearchPages(false));
    });

    resetBtn.addEventListener("click", clear);

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-admin-edit],[data-admin-delete]");
      if (!btn) return;

      const slug = btn.getAttribute("data-slug");
      const match = db.find((p) => p.slug === slug);
      if (!match) return;

      if (btn.hasAttribute("data-admin-delete")) {
        const localRows = getLocalOverrides().filter((r) => slugify(r.name || "") !== slug);
        setLocalOverrides(localRows);
        loadData().then(() => renderSearchPages(false));
        return;
      }

      idEl.value = match.id;
      fields.name.value = match.name;
      fields.brand.value = match.brand;
      fields.weight_oz.value = match.weight_oz;
      fields.surface_material.value = match.surface_material;
      fields.core_material.value = match.core_material;
      fields.skill_level.value = match.skill_level;
      fields.paddle_type.value = match.paddle_type;
      fields.image_url.value = match.image_url;
      fields.description.value = match.description;
      fields.pros.value = match.pros.join(" | ");
      fields.cons.value = match.cons.join(" | ");
      fields.affiliate_link.value = match.affiliate_link;
      fields.release_year.value = match.release_year;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function enhancePaddlesGridWithAdminActions() {
    if (page !== "paddles") return;
    const grid = document.getElementById("paddle-grid");
    if (!grid) return;

    const observer = new MutationObserver(() => {
      grid.querySelectorAll(".card-body").forEach((body) => {
        if (body.querySelector(".admin-inline")) return;
        const link = body.querySelector("a.btn");
        if (!link) return;
        const slug = new URL(link.href).searchParams.get("slug");
        const row = document.createElement("div");
        row.className = "admin-inline tag-row";
        row.innerHTML = `<button class="btn btn-secondary" type="button" data-admin-edit data-slug="${slug}">Edit (local)</button>
                         <button class="btn btn-secondary" type="button" data-admin-delete data-slug="${slug}">Delete (local)</button>`;
        body.appendChild(row);
      });
    });

    observer.observe(grid, { childList: true, subtree: true });
  }

  async function init() {
    setupNavMenu();
    await loadData();

    if (page === "home") renderSearchPages(true);
    if (page === "paddles") {
      renderSearchPages(false);
      setupAdminForm();
      enhancePaddlesGridWithAdminActions();
    }
    if (page === "paddle-detail") renderDetailPage();
    if (page === "compare") renderComparePage();
    if (page === "finder") renderFinderPage();
    if (page === "pro-players") renderProPlayersPage();
  }

  init();
})();
