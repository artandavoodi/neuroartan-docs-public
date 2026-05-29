/* =============================================================================
   DOCS PUBLIC · INDEX PAGE
============================================================================= */

const DATA_URL = "/assets/data/docs/index.json";
const SHELL_URL = "/assets/fragments/layers/docs/index/index-shell.html";

function createSection(section) {
  const article = document.createElement("article");
  article.className = "docs-index-section docs-surface";

  const title = document.createElement("h2");
  title.className = "docs-index-section__title";
  title.textContent = section.title || "";

  const list = document.createElement("ul");
  list.className = "docs-index-section__list";

  (section.links || []).forEach((item) => {
    const listItem = document.createElement("li");
    const link = document.createElement("a");
    link.className = "docs-index-section__link";
    link.href = item.href || "#";
    link.textContent = item.label || "";
    listItem.append(link);
    list.append(listItem);
  });

  article.append(title, list);
  return article;
}

function createRecommendedCard(item) {
  const link = document.createElement("a");
  link.className = "docs-index-recommended-card docs-link-card";
  link.href = item.href || "#";

  const label = document.createElement("p");
  label.className = "docs-index-recommended-card__label";
  label.textContent = item.label || "";

  const title = document.createElement("h3");
  title.className = "docs-index-recommended-card__title";
  title.textContent = item.title || "";

  const description = document.createElement("p");
  description.className = "docs-index-recommended-card__description";
  description.textContent = item.description || "";

  link.append(label, title, description);
  return link;
}

async function mountDocsIndex() {
  const mount = document.getElementById("docs-page-root");
  if (!mount) return;

  const dataResponse = await fetch(DATA_URL);
  const shellResponse = await fetch(SHELL_URL);
  const data = await dataResponse.json();
  const shell = await shellResponse.text();

  document.title = data.meta?.title || document.title;
  mount.innerHTML = shell;

  document.getElementById("docs-hero-eyebrow").textContent = data.hero?.eyebrow || "";
  document.getElementById("docs-hero-title").textContent = data.hero?.title || "";
  document.getElementById("docs-hero-description").textContent = data.hero?.description || "";

  const primary = document.getElementById("docs-primary-destination");
  primary.href = data.primaryDestination?.href || "#";
  primary.textContent = data.primaryDestination?.label || "";
  primary.setAttribute("aria-label", data.primaryDestination?.description || data.primaryDestination?.label || "");

  const sections = document.getElementById("docs-sections");
  (data.sections || []).forEach((section) => sections.append(createSection(section)));

  const recommended = document.getElementById("docs-recommended");
  (data.recommended || []).forEach((item) => recommended.append(createRecommendedCard(item)));
}

mountDocsIndex();
