import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const origin=`https://${(await readFile(new URL('CNAME',root),'utf8')).trim()}`;
const files=execFileSync('git',['ls-files','--','*index.html','index.html'],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean);
const routes=[];
for(const file of files){
  if(file.startsWith('assets/')||file.startsWith('registry/'))continue;
  let html=await readFile(new URL(file,root),'utf8');
  if(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html))continue;
  const route='/'+file.replace(/index\.html$/,'');
  const canonical=`<link rel="canonical" href="${origin}${route}">`;
  html=/<link[^>]+rel="canonical"[^>]*>/.test(html)?html.replace(/<link[^>]+rel="canonical"[^>]*>/,canonical):html.replace('</head>',`  ${canonical}\n</head>`);
  await writeFile(new URL(file,root),html);routes.push(route);
}
const escape=value=>value.replace(/&/g,'&amp;').replace(/</g,'&lt;');
await writeFile(new URL('sitemap.xml',root),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(routes)].sort().map(route=>`  <url><loc>${escape(origin+route)}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile(new URL('robots.txt',root),`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`Published ${routes.length} existing documentation routes with canonical URLs.`);
