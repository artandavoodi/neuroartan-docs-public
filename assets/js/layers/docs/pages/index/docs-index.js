/* =============================================================================
   DOCS PUBLIC · INDEX PAGE
============================================================================= */

const DATA_URL = "/assets/data/docs/index.json";
const SHELL_URL = "/assets/fragments/layers/docs/index/index-shell.html";

// Get home page data from the pages array
async function getIndexData() {
  const response = await fetch(DATA_URL);
  const data = await response.json();
  const homePage = data.pages?.find((page) => page.id === "home" || page.route === "/");
  return {
    meta: data.meta,
    hero: homePage?.hero || {},
    primaryDestination: homePage?.primaryDestination || { href: "/get-started/", label: "Get Started", description: "Start with the documentation" },
    sections: homePage?.sections || [],
    recommended: data.recommendedGroups?.home || []
  };
}

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

function getCurrentRoute() {
  const path = window.location.pathname;
  return path.endsWith("/") ? path : `${path}/`;
}

async function mountDocsIndex() {
  const currentRoute = getCurrentRoute();
  console.log("Current route:", currentRoute);
  if (currentRoute !== "/") {
    return;
  }

  const mount = document.getElementById("docs-detail-root");
  if (!mount) {
    console.error("Mount element not found");
    return;
  }

  try {
    const shellResponse = await fetch(SHELL_URL);
    const data = await getIndexData();
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
  } catch (error) {
    console.error("Failed to mount docs index:", error);
  }
}

mountDocsIndex();
