const DOCS_FRAGMENT_MAP = {
  "docs-header": "/assets/fragments/layers/docs/global/docs-header.html",
  "docs-footer": "/assets/fragments/layers/docs/global/docs-footer.html"
};

export async function fetchDocsFragment(name) {
  const path = DOCS_FRAGMENT_MAP[name];
  if (!path) return "";

  const response = await fetch(path);
  if (!response.ok) return "";

  return response.text();
}
