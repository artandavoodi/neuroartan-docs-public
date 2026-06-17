import { fetchDocsFragment } from "../01-services/docs-fragments.js";

function ensureMount(id, includeName, position = "beforebegin") {
  let mount = document.getElementById(id);
  if (mount) {
    mount.dataset.docsInclude = includeName;
    return mount;
  }

  mount = document.createElement("div");
  mount.id = id;
  mount.dataset.docsInclude = includeName;

  const main = document.getElementById("docs-detail-root") || document.getElementById("site-main") || document.querySelector("main");
  if (main) {
    main.insertAdjacentElement(position, mount);
    return mount;
  }

  document.body.append(mount);
  return mount;
}

export async function mountDocsShell() {
  ensureMount("docs-header-mount", "docs-header", "beforebegin");
  ensureMount("docs-footer-mount", "docs-footer", "afterend");

  const mounts = document.querySelectorAll("[data-docs-include]");

  await Promise.all([...mounts].map(async (mount) => {
    const name = mount.dataset.docsInclude;
    const html = await fetchDocsFragment(name);
    if (html) mount.innerHTML = html;
  }));

  document.documentElement.dataset.docsRuntime = "ready";
  document.dispatchEvent(new CustomEvent("docs:shell-ready"));
}

mountDocsShell();
