const INDEX_DATA_URL = "/assets/data/docs/index.json";
const PAGES_DATA_URL = "/assets/data/docs/pages/pages.json";
const DETAIL_SHELL_URL = "/assets/fragments/layers/docs/page/detail-shell.html";
const HOME_SHELL_URL = "/assets/fragments/layers/docs/index/index-shell.html";

const ICONS = {
  home: "/registry/icons/public/assets/core/navigation/primary/home.svg",
  start: "/registry/icons/public/assets/core/navigation/discovery/explore.svg",
  "get-started": "/registry/icons/public/assets/core/navigation/discovery/explore.svg",
  product: "/registry/icons/public/assets/core/platform/platform/platform.svg",
  products: "/registry/icons/public/assets/core/platform/platform/platform.svg",
  platform: "/registry/icons/public/assets/core/platform/platform/platform.svg",
  "model-profile": "/registry/icons/public/assets/core/cognition/model/model.svg",
  "model-identity": "/registry/icons/public/assets/core/cognition/model/model.svg",
  plans: "/registry/icons/public/assets/core/commerce/subscriptions/plan.svg",
  trust: "/registry/icons/public/assets/core/legal/privacy/privacy.svg",
  "trust-safety": "/registry/icons/public/assets/core/legal/privacy/privacy.svg",
  privacy: "/registry/icons/public/assets/core/legal/privacy/privacy.svg",
  verification: "/registry/icons/public/assets/core/identity/trust/verified.svg",
  safety: "/registry/icons/public/assets/core/identity/shield/shield.svg",
  developers: "/registry/icons/public/assets/core/files/code/code.svg",
  company: "/registry/icons/public/assets/layers/website/navigation/actions/company.svg",
  support: "/registry/icons/public/assets/core/system/support/support.svg",
  "developers-api-integration": "/registry/icons/public/assets/layers/software/api/api.svg",
  "developers-cli": "/registry/icons/public/assets/layers/website/home/stage/developer-operations-panel/tabs/code-review.svg",
  "developers-errors": "/registry/icons/public/assets/core/actions/security-alerts/security-alerts.svg",
  "developers-oauth-connectors": "/registry/icons/public/assets/core/identity/security/key.svg",
  "developers-release-notes": "/registry/icons/public/assets/layers/software/releases/release.svg",
  "developers-security-requirements": "/registry/icons/public/assets/core/identity/security/security.svg",
  "developers-troubleshooting": "/registry/icons/public/assets/core/system/support/support.svg",
  "company-careers": "/registry/icons/public/assets/core/navigation/institutional/careers.svg",
  "company-public-relations": "/registry/icons/public/assets/layers/website/navigation/actions/company.svg",
  "company-research": "/registry/icons/public/assets/layers/website/content/research/research.svg",
  "privacy-policy": "/registry/icons/public/assets/core/legal/privacy/privacy.svg",
  "data-retention": "/registry/icons/public/assets/core/files/database/database.svg",
  "terms-direction": "/registry/icons/public/assets/layers/software/documentation/documentation.svg",
  article: "/registry/icons/public/assets/layers/website/content/articles/article.svg",
  docs: "/registry/icons/public/assets/layers/developer/docs/docs.svg",
  disclosure: "/registry/icons/public/assets/core/navigation/chevron/chevron-down.svg"
};

let docsData = null;
let activeSearchQuery = "";
let cleanupTocScrollState = null;

function normalizeRoute(route) {
  if (!route || route === "/index.html") return "/";
  const clean = route.split("#")[0].split("?")[0];
  if (clean === "/" || clean === "") return "/";
  return clean.endsWith("/") ? clean : `${clean}/`;
}

function currentRoute() {
  return normalizeRoute(window.location.pathname);
}

function slug(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function byId(id) {
  return document.getElementById(id);
}

function el(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function img(src, className, alt = "") {
  const node = document.createElement("img");
  node.src = src;
  node.className = src?.startsWith("/registry/icons/") && !className.includes("ui-icon")
    ? `${className} ui-icon-theme-aware`
    : className;
  node.alt = alt;
  node.loading = "lazy";
  node.decoding = "async";
  if (!alt) node.setAttribute("aria-hidden", "true");
  return node;
}

function link(href, className, text = "") {
  const node = document.createElement("a");
  node.href = href || "/";
  node.className = className;
  if (text) node.textContent = text;
  return node;
}

function routeMatches(left, right) {
  return normalizeRoute(left) === normalizeRoute(right);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load ${url}`);
  return response.text();
}

function mergePage(base = {}, rich = {}) {
  return {
    ...base,
    ...rich,
    id: rich.id || base.id,
    route: rich.route || base.route,
    title: rich.title || base.title,
    description: rich.description || base.description,
    category: rich.category || base.category,
    sidebar: base.sidebar || rich.sidebar,
    recommended: rich.recommended || base.recommended,
    articles: rich.articles || base.articles,
    sections: rich.sections || base.sections,
    hero: {
      ...(base.hero || {}),
      ...(rich.hero || {})
    },
    article: rich.article || base.article
  };
}

function normalizePageCategory(page, categories) {
  const value = page.category || "";
  const match = categories.find((category) => (
    category.id === value ||
    category.label === value ||
    category.title === value ||
    slug(category.label || category.title || category.id) === slug(value)
  ));
  return match?.label || match?.title || value || "Documentation";
}

function buildRegistry(indexData, pagesData) {
  const categorySource = indexData.categories?.length ? indexData.categories : pagesData.categories || [];
  const categories = categorySource.map((category) => ({
    ...category,
    id: category.id || slug(category.label || category.title),
    label: category.label || category.title || category.id,
    title: category.title || category.label || category.id
  }));

  const routeMap = new Map();
  Object.entries(indexData.routes || {}).forEach(([route, id]) => {
    const page = (indexData.pages || []).find((item) => item.id === id) || { id, route };
    routeMap.set(normalizeRoute(route), { ...page, route: page.route || route });
  });

  (indexData.pages || []).forEach((page) => routeMap.set(normalizeRoute(page.route), mergePage(routeMap.get(normalizeRoute(page.route)), page)));

  (pagesData.pages || []).forEach((page) => {
    const route = normalizeRoute(page.route);
    routeMap.set(route, mergePage(routeMap.get(route), page));
  });

  const pages = Array.from(routeMap.values())
    .filter((page) => page?.route && page?.title)
    .map((page) => ({
      ...page,
      route: normalizeRoute(page.route),
      categoryLabel: normalizePageCategory(page, categories)
    }));

  const pageByRoute = new Map(pages.map((page) => [normalizeRoute(page.route), page]));
  const pageById = new Map();
  pages.forEach((page) => {
    pageById.set(page.id, page);
    pageById.set(slug(page.id), page);
  });

  return {
    indexData,
    pagesData,
    categories,
    pages,
    pageByRoute,
    pageById
  };
}

function resolvePageById(id) {
  if (!id) return null;
  return docsData.pageById.get(id) || docsData.pageById.get(slug(id));
}

function resolvePageFromLink(item = {}) {
  return resolvePageById(item.id) || docsData.pageByRoute.get(normalizeRoute(item.href || item.route));
}

function pageSearchText(page) {
  return [
    page.title,
    page.description,
    page.categoryLabel,
    page.category,
    page.type,
    page.eyebrow,
    page.route,
    page.id,
    ...(page.article?.searchKeywords || []),
    ...(page.article?.blocks || []).flatMap((block) => [block.title, block.body])
  ].filter(Boolean).join(" ").toLowerCase();
}

function filteredPages(query = activeSearchQuery) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return docsData.pages;
  const terms = normalized.split(/\s+/).filter(Boolean);
  return docsData.pages.filter((page) => terms.every((term) => pageSearchText(page).includes(term)));
}

function iconForCategory(category = {}) {
  const key = category.id || slug(category.label || category.title || "");
  return ICONS[key] || ICONS[slug(category.label || category.title || "")] || ICONS.article;
}

function iconForPage(page = {}) {
  return ICONS[slug(page.id || "")] || ICONS[slug(page.categoryLabel || page.category || "")] || ICONS.article;
}

function topCategories() {
  const preferred = ["start", "product", "model-profile", "plans", "trust-safety", "developers", "company"];
  return [...docsData.categories].sort((a, b) => {
    const ai = preferred.indexOf(a.id);
    const bi = preferred.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function renderHeader() {
  const nav = document.querySelector("[data-docs-header-nav]");
  if (!nav || nav.dataset.docsRendered === "true") return;

  topCategories().slice(0, 6).forEach((category) => {
    const anchor = link(category.route || category.href || "/", "docs-nav-link", category.label || category.title);
    nav.append(anchor);
  });

  nav.dataset.docsRendered = "true";
}

function renderFooter() {
  const footerLinks = document.querySelector("[data-docs-footer-links]");
  const footerBase = document.querySelector("[data-docs-footer-base]");

  if (footerLinks && footerLinks.dataset.docsRendered !== "true") {
    const columns = [
      { title: "Support", ids: ["support", "developers-troubleshooting", "developers-errors", "developers-release-notes"] },
      { title: "Policies", ids: ["privacy-policy", "data-retention", "terms-direction", "appeals"] },
      { title: "Company", ids: ["company-public-relations", "company-research", "company-careers"] }
    ];

    columns.forEach((column) => {
      const links = column.ids.map(resolvePageById).filter(Boolean);
      if (!links.length) return;

      const section = el("section", "docs-footer__column");
      section.append(el("h3", "", column.title));
      links.forEach((page) => section.append(link(page.route, "docs-nav-link", page.title)));
      footerLinks.append(section);
    });

    footerLinks.dataset.docsRendered = "true";
  }

  if (footerBase && footerBase.dataset.docsRendered !== "true") {
    ["privacy-policy", "terms-direction", "support"].forEach((id) => {
      const page = resolvePageById(id);
      if (page) footerBase.append(link(page.route, "docs-nav-link", page.title));
    });
    footerBase.dataset.docsRendered = "true";
  }
}

function renderSearchResults(query) {
  const root = byId("docs-detail-root");
  if (!root) return;

  if (!query.trim()) {
    renderCurrentRoute();
    return;
  }

  root.innerHTML = "";
  const shell = el("section", "docs-search-page");
  const header = el("header", "docs-search-page__header");
  header.append(
    el("h1", "docs-page-title", `Search results for "${query.trim()}"`)
  );

  const list = el("div", "docs-search-results");
  filteredPages(query).slice(0, 30).forEach((page) => {
    list.append(createResultCard(page));
  });

  if (!list.children.length) {
    list.append(el("p", "docs-empty", "No matching documentation."));
  }

  shell.append(header, list);
  root.append(shell);
}

function bindSearch() {
  const input = document.querySelector("[data-docs-search-input]");
  const clear = document.querySelector("[data-docs-search-clear]");
  const form = document.querySelector("[data-docs-search-form]");
  if (!input || input.dataset.docsBound === "true") return;

  const sync = () => {
    activeSearchQuery = input.value;
    if (clear) clear.hidden = !input.value;
    renderSearchResults(input.value);
  };

  input.addEventListener("input", sync);
  clear?.addEventListener("click", () => {
    input.value = "";
    input.focus();
    sync();
  });
  form?.addEventListener("submit", (event) => event.preventDefault());
  input.dataset.docsBound = "true";
}

function createResultCard(page) {
  const anchor = link(page.route, "docs-result-card");
  anchor.append(
    img(iconForPage(page), "docs-result-card__icon"),
    el("span", "docs-result-card__meta", page.categoryLabel),
    el("strong", "docs-result-card__title", page.title),
    el("span", "docs-result-card__description", page.description || "")
  );
  return anchor;
}

function pageLinksForCategory(category) {
  const ids = new Set((category.groups || []).flatMap((group) => group.items || []));
  const linked = Array.from(ids).map(resolvePageById).filter(Boolean);
  if (linked.length) return linked;
  return docsData.pages.filter((page) => page.categoryLabel === (category.label || category.title));
}

function createCategoryCard(category) {
  const card = link(category.route || category.href || "/", "docs-home-category-card");
  const pages = pageLinksForCategory(category).slice(0, 6);
  card.append(
    img(iconForCategory(category), "docs-home-category-card__icon"),
    el("h2", "docs-home-category-card__title", category.label || category.title),
    el("p", "docs-home-category-card__description", category.description || pages.map((page) => page.title).slice(0, 3).join(", "))
  );
  return card;
}

async function renderHome(root, page) {
  root.innerHTML = "";
  root.innerHTML = await fetchText(HOME_SHELL_URL);
  const hero = root.querySelector("[data-docs-home-hero]");
  const categories = root.querySelector("[data-docs-home-categories]");
  const popular = root.querySelector("[data-docs-home-popular]");

  hero?.append(
    el("h1", "docs-home__title", page.hero?.title || page.title),
    el("p", "docs-home__description", page.hero?.description || page.description)
  );

  topCategories().forEach((category) => categories?.append(createCategoryCard(category)));

  const popularTitle = el("h2", "docs-section-title", "Popular");
  const popularGrid = el("div", "docs-home__popular-grid");
  ["get-started", "what-is-icos", "platform", "privacy", "developers-troubleshooting", "plans"].forEach((id) => {
    const item = resolvePageById(id);
    if (item) popularGrid.append(createResultCard(item));
  });
  popular?.append(popularTitle, popularGrid);
}

function sidebarGroupsFor(page) {
  const category = docsData.categories.find((item) => (
    item.label === page.categoryLabel ||
    item.title === page.categoryLabel ||
    item.id === page.category ||
    item.id === slug(page.categoryLabel)
  ));

  if (category?.groups?.length) {
    return category.groups.map((group) => ({
      title: group.label || group.title,
      links: (group.items || []).map(resolvePageById).filter(Boolean)
    }));
  }

  const key = page.sidebar || slug(page.categoryLabel);
  const sidebar = docsData.indexData.sidebars?.[key] || docsData.indexData.sidebars?.home || [];
  return sidebar.map((group) => ({
    title: group.title || group.label,
    links: (group.links || []).map((item) => resolvePageFromLink(item) || {
      title: item.label,
      route: normalizeRoute(item.href || item.route)
    })
  }));
}

function renderSidebar(root, page) {
  root.replaceChildren();
  sidebarGroupsFor(page).forEach((group) => {
    const details = document.createElement("details");
    details.className = "docs-sidebar__group";
    details.open = true;

    const summary = el("summary", "docs-sidebar__summary");
    summary.append(el("span", "", group.title), img(ICONS.disclosure, "docs-sidebar__summary-icon"));
    const list = el("ul", "docs-sidebar__list");

    group.links.forEach((item) => {
      const row = el("li");
      const anchor = link(item.route, "docs-sidebar__link", item.title);
      if (routeMatches(item.route, page.route)) anchor.setAttribute("aria-current", "page");
      row.append(anchor);
      list.append(row);
    });

    details.append(summary, list);
    root.append(details);
  });
}

function renderBreadcrumb(root, page) {
  root.replaceChildren();
  root.append(link("/", "docs-breadcrumb__link", "Docs"));
  root.append(el("span", "docs-breadcrumb__separator", "/"));
  root.append(el("span", "docs-breadcrumb__current", page.categoryLabel || page.category || "Documentation"));
}

function renderArticleHeader(root, page) {
  root.replaceChildren();
  root.append(
    el("h1", "docs-page-title", page.hero?.title || page.title),
    el("p", "docs-page-description", page.hero?.description || page.description || "")
  );

  const tabs = tabLinksForPage(page);
  if (tabs.length) {
    const list = el("div", "docs-tabs");
    tabs.forEach((tab, index) => {
      const item = link(`#${tab.id}`, "docs-tab", tab.label);
      item.dataset.docsTabTarget = tab.id;
      item.setAttribute("aria-current", index === 0 ? "true" : "false");
      list.append(item);
    });
    root.append(list);
  }
}

function recommendationPages(page) {
  const ids = Array.isArray(page.recommended) ? page.recommended : [];
  const own = ids.map(resolvePageById).filter(Boolean);
  if (own.length) return own.slice(0, 4);
  return docsData.pages
    .filter((item) => item.categoryLabel === page.categoryLabel && item.route !== page.route)
    .slice(0, 4);
}

function renderRecommended(root, page) {
  root.replaceChildren();
  const pages = recommendationPages(page);
  if (!pages.length) return;

  root.append(el("h2", "docs-section-title", "Recommended"));
  const grid = el("div", "docs-recommended-grid");
  pages.forEach((item) => grid.append(createResultCard(item)));
  root.append(grid);
}

function articleBlocks(page) {
  const blocks = page.article?.blocks?.length ? page.article.blocks : [];
  if (blocks.length) return blocks;
  return (page.sections || []).map((section) => ({
    type: "section",
    title: section.title,
    body: section.body
  }));
}

function articleBlockEntries(page) {
  const counts = new Map();
  return articleBlocks(page).map((block) => {
    const base = slug(block.title || block.type || "section");
    const count = counts.get(base) || 0;
    counts.set(base, count + 1);
    return {
      block,
      id: count ? `${base}-${count + 1}` : base
    };
  });
}

function tabLinksForPage(page) {
  const entries = articleBlockEntries(page).filter(({ block }) => block.title);
  const tabs = page.hero?.tabs || page.tabs || [];
  const links = tabs.map((tab) => {
    const tabSlug = slug(tab);
    const match = tabSlug === "overview"
      ? entries[0]
      : entries.find(({ block }) => slug(block.title) === tabSlug || slug(block.type) === tabSlug);

    return match ? { label: tab, id: match.id } : null;
  }).filter(Boolean);

  const uniqueLinks = links.filter((item, index, items) => (
    items.findIndex((candidate) => candidate.id === item.id) === index
  ));

  return uniqueLinks.length > 1 ? uniqueLinks : [];
}

function renderBlock(block, id) {
  const section = el("section", "docs-content-section");
  section.id = id;
  if (block.title) section.append(el("h2", "docs-content-section__title", block.title));
  if (block.body) section.append(el("p", "docs-content-section__body", block.body));
  if (Array.isArray(block.links)) {
    const list = el("ul", "docs-content-section__links");
    block.links.forEach((item) => {
      const row = el("li");
      row.append(link(item.href || item.route, "docs-inline-link", item.label || item.title));
      list.append(row);
    });
    section.append(list);
  }
  return section;
}

function renderArticleBody(root, page) {
  root.replaceChildren();
  articleBlockEntries(page).forEach(({ block, id }) => root.append(renderBlock(block, id)));
}

function renderToc(root, page) {
  root.replaceChildren();
  const entries = articleBlockEntries(page).filter(({ block }) => block.title);
  if (!entries.length) return;

  root.append(el("h2", "docs-toc__title", "In this article"));
  const list = el("ul", "docs-toc__list");
  entries.forEach(({ block, id }) => {
    const item = el("li");
    const anchor = link(`#${id}`, "docs-toc__link", block.title);
    anchor.dataset.docsTocTarget = id;
    item.append(anchor);
    list.append(item);
  });
  root.append(list);
}

function bindTocScrollState() {
  cleanupTocScrollState?.();
  cleanupTocScrollState = null;

  const links = [...document.querySelectorAll("[data-docs-toc-target]")];
  const tabs = [...document.querySelectorAll("[data-docs-tab-target]")];
  if (!links.length && !tabs.length) return;

  const targets = [...links.map((anchor) => anchor.dataset.docsTocTarget), ...tabs.map((anchor) => anchor.dataset.docsTabTarget)];
  const sections = [...new Set(targets)]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const setActive = (id) => {
    links.forEach((anchor) => {
      anchor.setAttribute("aria-current", anchor.dataset.docsTocTarget === id ? "true" : "false");
    });
    tabs.forEach((anchor) => {
      anchor.setAttribute("aria-current", anchor.dataset.docsTabTarget === id ? "true" : "false");
    });
  };

  let activeId = "";
  let frame = 0;

  const update = () => {
    frame = 0;
    const threshold = Math.max(window.innerHeight * 0.22, 120);
    const active = sections.reduce((current, section) => {
      const top = section.getBoundingClientRect().top;
      if (top <= threshold) return section;
      return current;
    }, sections[0]);

    if (active?.id && active.id !== activeId) {
      activeId = active.id;
      setActive(activeId);
    }
  };

  const requestUpdate = () => {
    if (frame) return;
    frame = window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  cleanupTocScrollState = () => {
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", requestUpdate);
    if (frame) window.cancelAnimationFrame(frame);
  };
}

function fallbackPage(route) {
  const label = route.split("/").filter(Boolean).pop() || "Documentation";
  return {
    id: slug(label),
    route,
    title: label.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    description: "This documentation route exists, but no public registry content has been attached yet.",
    category: "Documentation",
    categoryLabel: "Documentation",
    sections: [
      {
        title: "Content pending",
        body: "This page is registered as a public route shell. Add this article to the documentation registry to publish structured content."
      }
    ]
  };
}

async function renderDetail(root, page) {
  root.innerHTML = await fetchText(DETAIL_SHELL_URL);
  renderSidebar(root.querySelector("[data-docs-sidebar]"), page);
  renderBreadcrumb(root.querySelector("[data-docs-breadcrumb]"), page);
  renderArticleHeader(root.querySelector("[data-docs-article-header]"), page);
  renderRecommended(root.querySelector("[data-docs-recommended]"), page);
  renderArticleBody(root.querySelector("[data-docs-article-body]"), page);
  renderToc(root.querySelector("[data-docs-toc]"), page);
  bindTocScrollState();
}

async function renderCurrentRoute() {
  const root = byId("docs-detail-root");
  if (!root || !docsData) return;

  const route = currentRoute();
  const page = docsData.pageByRoute.get(route) || fallbackPage(route);
  document.title = `${page.title || "Documentation"} · Neuroartan Documentation`;
  document.body.classList.add("docs-page");

  if (route === "/" || page.layout === "home" || page.id === "home") {
    await renderHome(root, docsData.pageByRoute.get("/") || page);
    return;
  }

  await renderDetail(root, page);
}

async function initializeDocs() {
  const [indexData, pagesData] = await Promise.all([
    fetchJson(INDEX_DATA_URL),
    fetchJson(PAGES_DATA_URL)
  ]);

  docsData = buildRegistry(indexData, pagesData);

  if (document.documentElement.dataset.docsRuntime === "ready") {
    renderHeader();
    renderFooter();
    bindSearch();
  } else {
    document.addEventListener("docs:shell-ready", () => {
      renderHeader();
      renderFooter();
      bindSearch();
    }, { once: true });
  }

  await renderCurrentRoute();
}

initializeDocs().catch((error) => {
  console.warn("[Neuroartan Docs] Runtime failed.", error);
  const root = byId("docs-detail-root");
  if (root) {
    root.innerHTML = "";
    const failure = el("section", "docs-search-page");
    failure.append(el("h1", "docs-page-title", "Documentation could not be loaded"));
    failure.append(el("p", "docs-page-description", "Refresh the page or check the local documentation data registry."));
    root.append(failure);
  }
});
