import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const serverDir = fileURLToPath(new URL('../dist/server/', import.meta.url));
const entries = [];

async function collect(directory) {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isDirectory()) {
      if (item.name !== 'server' && item.name !== '.openai') await collect(path);
      continue;
    }
    const extension = extname(item.name);
    if (!['.html', '.js', '.css', '.svg', '.txt', '.json'].includes(extension)) continue;
    const route = `/${relative(dist, path).split(sep).join('/')}`;
    entries.push([route, await readFile(path, 'utf8')]);
  }
}

await collect(dist);
const serialized = entries.map(([route, content]) => `${JSON.stringify(route)}:${JSON.stringify(content)}`).join(',\n');
const worker = `const files={${serialized}};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
export default {async fetch(request){
  const url=new URL(request.url); let path=url.pathname==='/'?'/index.html':url.pathname;
  const body=files[path];
  if(body===undefined) return new Response('Not found',{status:404});
  const extension=path.slice(path.lastIndexOf('.'));
  return new Response(body,{headers:{'content-type':types[extension]||'application/octet-stream','cache-control':extension==='.html'?'no-cache':'public, max-age=31536000, immutable'}});
}};`;

await mkdir(serverDir, { recursive: true });
await writeFile(new URL('../dist/server/index.js', import.meta.url), worker);
console.log(`Embedded ${entries.length} static files into the Sites worker.`);
