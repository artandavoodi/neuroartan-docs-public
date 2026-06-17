const DATA_URL = "/assets/data/docs/pages/pages.json";
const SEARCH_SELECTOR = ".docs-header__search-input";

const SEARCH_CLEAR_ICON = "/registry/icons/public/assets/core/actions/search-clear/search-clear.svg";

const CATEGORY_ICON_MAP = {
  "Get started": "/registry/icons/public/assets/core/navigation/discovery/explore.svg",
  "Platform": "/registry/icons/public/assets/core/platform/platform/platform.svg",
  "Model & Profile": "/registry/icons/public/assets/core/cognition/model/model.svg",
  "Plans": "/registry/icons/public/assets/core/commerce/subscriptions/plan.svg",
  "Trust, Safety & Privacy": "/registry/icons/public/assets/core/legal/privacy/privacy.svg",
  "Developers": "/registry/icons/public/assets/core/actions/developer-dashboard/developer-dashboard.svg",
  "Company": "/registry/icons/public/assets/layers/website/navigation/actions/company.svg"
};

function isHomeRoute() {
  const path = window.location.pathname;
  return path === "/" || path === "/index.html";
}

function byId(id) {
  return document.getElementById(id);
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function icon(src, className, alt = "") {
  const node = document.createElement("img");
  node.className = className;
  node.src = src;
  node.alt = alt;
  node.loading = "lazy";
  node.decoding = "async";
  node.setAttribute("aria-hidden", alt ? "false" : "true");
  return node;
}

function getRenderablePages(data) {
  return (data.pages || []).filter((page) => page.route && page.category && page.title);
}

function mapPagesById(pages) {
  return pages.reduce((map, page) => {
    map.set(page.id, page);
    return map;
  }, new Map());
}

function normalizeSearchValue(value) {
  return value.trim().toLowerCase();
}

function pageMatchesSearch(page, query) {
  if (!query) return true;

  const terms = query.split(/\s+/).filter(Boolean);
  const searchableText = [
    page.title,
    page.description,
    page.category,
    page.id,
    page.route,
    page.article?.supportTrace?.category,
    page.article?.supportTrace?.status,
    ...(page.article?.supportTrace?.tags || [])
  ].filter(Boolean).join(" ").toLowerCase();

  return terms.every((term) => searchableText.includes(term));
}

function createPageCard(page) {
  const card = element("article", "docs-home-card");
  const anchor = document.createElement("a");
  anchor.className = "docs-home-card__link";
  anchor.href = page.route;

  const content = element("div", "docs-home-card__content");
  const title = element("h4", "docs-home-card__title", page.title);
  const description = element("p", "docs-home-card__description", page.description);

  content.append(title);

  if (page.description) {
    content.append(description);
  }

  anchor.append(content);
  card.append(anchor);

  return card;
}

function createCategoryIcon(category) {
  const src = CATEGORY_ICON_MAP[category];
  if (!src) return null;

  return icon(src, "docs-home-category__icon");
}

function createSubgroup(group, pageMap, query) {
  const pages = (group.items || [])
    .map((id) => pageMap.get(id))
    .filter(Boolean)
    .filter((page) => pageMatchesSearch(page, query));

  if (!pages.length) return null;

  const subgroup = element("section", "docs-home-subgroup");
  const title = element("h3", "docs-home-subgroup__title", group.label);
  const list = element("div", "docs-home-category__grid");

  pages.forEach((page) => {
    list.append(createPageCard(page));
  });

  subgroup.append(title, list);
  return subgroup;
}

function createFallbackCategory(category, pages, query) {
  const filteredPages = pages
    .filter((page) => page.category === category.label)
    .filter((page) => pageMatchesSearch(page, query));

  if (!filteredPages.length) return null;

  const section = element("section", "docs-home-category");
  const titleRow = element("div", "docs-home-category__header");
  const title = element("h2", "docs-home-category__title", category.label);
  const categoryIcon = createCategoryIcon(category.label);
  const list = element("div", "docs-home-category__grid");

  if (categoryIcon) {
    titleRow.append(categoryIcon);
  }

  titleRow.append(title);

  filteredPages.forEach((page) => {
    list.append(createPageCard(page));
  });

  section.append(titleRow, list);
  return section;
}

function createCategory(category, pageMap, pages, query) {
  const section = element("section", "docs-home-category");
  const titleRow = element("div", "docs-home-category__header");
  const title = element("h2", "docs-home-category__title", category.label);
  const categoryIcon = createCategoryIcon(category.label);
  const subgroups = (category.groups || [])
    .map((group) => createSubgroup(group, pageMap, query))
    .filter(Boolean);

  if (!subgroups.length) {
    return createFallbackCategory(category, pages, query);
  }

  if (categoryIcon) {
    titleRow.append(categoryIcon);
  }

  titleRow.append(title);
  section.append(titleRow, ...subgroups);

  return section;
}

function createEmptyState() {
  const section = element("section", "docs-home-empty");
  const title = element("h2", "docs-home-empty__title", "No matching documentation");
  const text = element("p", "docs-home-empty__text", "Try a different product, feature, or platform term.");

  section.append(title, text);
  return section;
}

function renderDirectory(mount, data, pages, query = "") {
  const pageMap = mapPagesById(pages);
  const categories = data.categories || [];
  const indexShell = element("section", "docs-home-directory");

  mount.innerHTML = "";

  categories.forEach((category) => {
    const section = createCategory(category, pageMap, pages, query);
    if (section) {
      indexShell.append(section);
    }
  });

  if (!indexShell.children.length) {
    mount.append(createEmptyState());
    return;
  }

  mount.append(indexShell);
}

function syncSearchClearButton(search, button) {
  button.hidden = !search.value;
}

function mountSearchClearControl(mount, data, pages) {
  const search = document.querySelector(SEARCH_SELECTOR);
  if (!search) return;

  const wrapper = search.closest(".docs-header__search");
  if (!wrapper || wrapper.querySelector(".docs-header__search-clear")) return;

  const button = document.createElement("button");
  button.className = "docs-header__search-clear";
  button.type = "button";
  button.setAttribute("aria-label", "Clear search");
  button.append(icon(SEARCH_CLEAR_ICON, "docs-header__search-clear-icon"));

  button.addEventListener("click", () => {
    search.value = "";
    renderDirectory(mount, data, pages);
    syncSearchClearButton(search, button);
    search.focus();
  });

  wrapper.append(button);
  syncSearchClearButton(search, button);
}

function bindDocsSearch(mount, data, pages) {
  document.addEventListener("input", (event) => {
    const search = event.target.closest(SEARCH_SELECTOR);
    if (!search) return;

    renderDirectory(mount, data, pages, normalizeSearchValue(search.value));

    const clearButton = document.querySelector(".docs-header__search-clear");
    if (clearButton) {
      syncSearchClearButton(search, clearButton);
    }
  });
}

async function mountDocsHome() {
  if (!isHomeRoute()) return;

  const mount = byId("docs-detail-root");
  if (!mount) return;

  const response = await fetch(DATA_URL);
  if (!response.ok) return;

  const data = await response.json();
  const pages = getRenderablePages(data);

  renderDirectory(mount, data, pages);
  bindDocsSearch(mount, data, pages);
  mountSearchClearControl(mount, data, pages);
  document.addEventListener("docs:shell-ready", () => mountSearchClearControl(mount, data, pages), { once: true });
}

mountDocsHome();
