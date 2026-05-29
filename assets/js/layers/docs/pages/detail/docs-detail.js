/* =============================================================================
   DOCS PUBLIC · DETAIL PAGE
============================================================================= */

const DATA_URL = "/assets/data/docs/index.json";
const SHELL_URL = "/assets/fragments/layers/docs/page/detail-shell.html";

let docsState = {
  registry: null,
  pages: [],
  categories: [],
  currentPage: null,
  activeCategory: "All",
  query: ""
};

function getCurrentRoute() {
  const path = window.location.pathname;
  return path.endsWith("/") ? path : `${path}/`;
}

function byId(id) {
  return document.getElementById(id);
}

function applyGlobalLabels(data) {
  const brand = data.global?.brand || {};
  const search = data.global?.search || {};
  const breadcrumbs = data.global?.breadcrumbs || {};

  const brandLink = byId("docs-page-brand");
  if (brandLink) {
    brandLink.textContent = brand.label || "Neuroartan Docs";
    brandLink.href = brand.href || "/";
  }

  const searchLabel = byId("docs-search-label");
  if (searchLabel) {
    searchLabel.textContent = search.label || "Search documentation";
  }

  const searchInput = byId("docs-search-input");
  if (searchInput) {
    searchInput.placeholder = search.placeholder || "Search articles";
  }

  const breadcrumbHome = byId("docs-breadcrumb-home");
  if (breadcrumbHome) {
    breadcrumbHome.textContent = breadcrumbs.homeLabel || "Home";
    breadcrumbHome.href = breadcrumbs.homeHref || "/";
  }
}

function createSidebarGroup(group, currentRoute) {
  const section = document.createElement("details");
  section.className = "docs-detail-sidebar__group";
  section.open = true;

  const title = document.createElement("summary");
  title.className = "docs-detail-sidebar__title";
  title.textContent = group.title || group.label || "";

  const list = document.createElement("ul");
  list.className = "docs-detail-sidebar__list";

  (group.links || []).forEach((item) => {
    const row = document.createElement("li");
    const link = document.createElement("a");
    link.className = "docs-detail-sidebar__link";
    link.href = item.href || "#";
    link.textContent = item.label || "";

    if (item.href === currentRoute) {
      link.setAttribute("aria-current", "page");
    }

    row.append(link);
    list.append(row);
  });

  section.append(title, list);
  return section;
}

function getSidebarForPage(page) {
  const registry = docsState.registry || {};
  return registry.sidebars?.[page.sidebar] || registry.sidebars?.home || [];
}

function createTab(label, active) {
  const tab = document.createElement("span");
  tab.className = "docs-tab";
  tab.textContent = label;
  tab.setAttribute("aria-current", active ? "true" : "false");
  return tab;
}

function createRecommendedCard(item) {
  const link = document.createElement("a");
  link.className = "docs-detail-recommended-card docs-link-card";
  link.href = item.href || "#";

  const label = document.createElement("p");
  label.className = "docs-detail-recommended-card__label";
  label.textContent = item.label || "";

  const title = document.createElement("h3");
  title.className = "docs-detail-recommended-card__title";
  title.textContent = item.title || "";

  const description = document.createElement("p");
  description.className = "docs-detail-recommended-card__description";
  description.textContent = item.description || "";

  link.append(label, title, description);
  return link;
}

function createContentSection(section) {
  const node = document.createElement("section");
  node.className = "docs-detail-section docs-surface";

  const title = document.createElement("h2");
  title.className = "docs-detail-section__title";
  title.textContent = section.title || "";

  const body = document.createElement("p");
  body.className = "docs-detail-section__body";
  body.textContent = section.body || "";

  node.append(title, body);
  return node;
}

function createHomeSection(section) {
  const link = document.createElement("a");
  link.className = "docs-article-row docs-home-card";
  link.href = section.href || "#";

  const meta = document.createElement("span");
  meta.className = "docs-article-row__meta";
  meta.textContent = section.meta || "Documentation";

  const title = document.createElement("h3");
  title.className = "docs-article-row__title";
  title.textContent = section.title || "";

  const body = document.createElement("p");
  body.className = "docs-article-row__description";
  body.textContent = section.body || section.description || "";

  link.append(meta, title, body);
  return link;
}

function createArticleBlock(block) {
  const node = document.createElement("section");
  node.className = "docs-detail-section docs-surface";

  const title = document.createElement("h2");
  title.className = "docs-detail-section__title";
  title.textContent = block.title || "";

  const body = document.createElement("p");
  body.className = "docs-detail-section__body";
  body.textContent = block.body || "";

  node.append(title, body);
  return node;
}

function createFilterButton(category) {
  const button = document.createElement("button");
  button.className = "docs-filter__button";
  button.type = "button";
  button.textContent = category;
  button.setAttribute("aria-label", `Filter articles by ${category}`);
  button.setAttribute("aria-pressed", category === docsState.activeCategory ? "true" : "false");

  button.onclick = () => {
    docsState.activeCategory = category;
    renderArticleBrowser();
  };

  return button;
}

function createArticleRow(item) {
  const link = document.createElement("a");
  link.className = "docs-article-row";
  link.href = item.href || item.route || "#";

  const meta = document.createElement("span");
  meta.className = "docs-article-row__meta";
  meta.textContent = item.meta || [item.category, item.type].filter(Boolean).join(" · ");

  const title = document.createElement("h3");
  title.className = "docs-article-row__title";
  title.textContent = item.title || "";

  const description = document.createElement("p");
  description.className = "docs-article-row__description";
  description.textContent = item.description || "";

  link.append(meta, title, description);
  return link;
}

function getArticlePages() {
  const registry = docsState.registry || {};
  const key = docsState.currentPage?.category || docsState.currentPage?.recommended || "home";
  return registry.articleRows?.[key] || registry.articleRows?.home || [];
}

function getFilteredPages() {
  const query = docsState.query.trim().toLowerCase();

  return getArticlePages().filter((page) => {
    const categoryMatch = docsState.activeCategory === "All" || page.category === docsState.activeCategory || page.meta?.includes(docsState.activeCategory);
    const searchBody = [page.title, page.description, page.category, page.type, page.eyebrow, page.meta]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return categoryMatch && (!query || searchBody.includes(query));
  });
}

function renderArticleBrowser() {
  const filterRoot = byId("docs-category-filter");
  const listRoot = byId("docs-article-list");
  if (!filterRoot || !listRoot) return;

  filterRoot.replaceChildren();
  listRoot.replaceChildren();

  const categories = ["All", ...new Set(getArticlePages().map((page) => page.category || page.meta?.split(" · ")?.[0]).filter(Boolean))];
  categories.forEach((category) => filterRoot.append(createFilterButton(category)));

  getFilteredPages().forEach((page) => listRoot.append(createArticleRow(page)));

  if (!listRoot.children.length) {
    const empty = document.createElement("p");
    empty.className = "docs-article-row__description";
    empty.textContent = "No matching articles.";
    listRoot.append(empty);
  }
}

function renderHomeLayout(page) {
  const sidebar = byId("docs-detail-sidebar");
  const recommendedSection = byId("recommended-title")?.closest("section");
  const articleTitle = byId("docs-articles-title");
  const filterRoot = byId("docs-category-filter");
  const listRoot = byId("docs-article-list");
  const sections = byId("docs-detail-sections");

  if (sidebar) sidebar.remove();
  if (recommendedSection) recommendedSection.remove();
  if (articleTitle) articleTitle.textContent = "Browse documentation";
  if (filterRoot) filterRoot.remove();
  if (listRoot) {
    listRoot.replaceChildren();
    getArticlePages().forEach((item) => listRoot.append(createArticleRow(item)));
  }
  if (sections) {
    sections.replaceChildren();
    (page.sections || []).forEach((section) => sections.append(createHomeSection(section)));
  }
}

function bindSearch() {
  const input = byId("docs-search-input");
  if (!input) return;

  input.oninput = () => {
    docsState.query = input.value || "";
    renderArticleBrowser();
  };
}

async function mountDocsDetail() {
  const mount = byId("docs-detail-root");
  if (!mount) return;

  const dataResponse = await fetch(DATA_URL);
  const shellResponse = await fetch(SHELL_URL);
  const data = await dataResponse.json();
  const shell = await shellResponse.text();

  const currentRoute = getCurrentRoute();
  const pages = data.pages || [];
  const routeId = data.routes?.[currentRoute];
  const page = pages.find((item) => item.id === routeId) || pages.find((item) => item.route === currentRoute) || pages.find((item) => item.id === "home");
  if (!page) return;

  docsState.registry = data;
  docsState.pages = pages;
  docsState.categories = data.categories || [];
  docsState.currentPage = page;
  docsState.activeCategory = "All";

  document.title = `${page.title} · Neuroartan Documentation`;
  mount.innerHTML = shell;
  applyGlobalLabels(data);

  const sidebarGroups = getSidebarForPage(page);
  const sidebar = byId("docs-detail-sidebar");

  if (sidebar) {
    sidebarGroups.forEach((group) => sidebar.append(createSidebarGroup(group, currentRoute)));
  }

  byId("docs-breadcrumb-current").textContent = page.breadcrumb || page.title || "";
  byId("docs-detail-eyebrow").textContent = page.hero?.eyebrow || page.eyebrow || "";
  byId("docs-detail-title").textContent = page.hero?.title || page.title || "";
  byId("docs-detail-description").textContent = page.hero?.description || page.description || "";

  const tabs = byId("docs-detail-tabs");
  (page.hero?.tabs || page.tabs || data.global?.tabs || []).forEach((tab, index) => tabs.append(createTab(tab, index === 0)));

  const recommended = byId("docs-detail-recommended");
  const recommendedItems = data.recommendedGroups?.[page.recommended] || data.recommendedGroups?.home || [];
  recommendedItems.forEach((item) => recommended.append(createRecommendedCard(item)));

  const sections = byId("docs-detail-sections");
  const articleBlocks = page.article?.blocks || [];

  if (articleBlocks.length) {
    articleBlocks.forEach((block) => sections.append(createArticleBlock(block)));
  } else {
    (page.sections || []).forEach((section) => sections.append(createContentSection(section)));
  }

  bindSearch();

  if (page.layout === "home") {
    renderHomeLayout(page);
  } else {
    renderArticleBrowser();
  }
}

mountDocsDetail();
