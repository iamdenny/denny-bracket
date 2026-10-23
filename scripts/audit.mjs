import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const { urls } = JSON.parse(fs.readFileSync("dist/site-manifest.json")),
  seen = new Set();
for (const u of urls) {
  const pathname = new URL(u).pathname,
    file = path.join("dist", pathname, "index.html"),
    html = fs.readFileSync(file, "utf8"),
    title = html.match(/<title>(.*?)<\/title>/s)?.[1];
  assert(title);
  assert(!title.includes("\n"), "search titles must not contain hero line breaks");
  assert.equal(html.match(/property="og:title" content="([^"]+)"/)?.[1], title);
  assert.equal(html.match(/name="twitter:title" content="([^"]+)"/)?.[1], title);
  const description = html.match(/name="description" content="([^"]+)"/)?.[1];
  assert(description, "missing description");
  assert.equal(html.match(/name="twitter:description" content="([^"]+)"/)?.[1], description);
  assert(html.includes('rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg"'));
  assert(!seen.has(title), "duplicate title " + title);
  seen.add(title);
  assert(html.includes(`rel="canonical" href="${u}"`));
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.equal((html.match(/rel="alternate"/g) || []).length, 5);
  for (const m of html.matchAll(
    /<script type="application\/ld\+json">(.*?)<\/script>/gs,
  ))
    JSON.parse(m[1]);
  for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)"/g)) {
    let target = path.join("dist", m[1]);
    if (m[1].endsWith("/")) target = path.join(target, "index.html");
    assert(fs.existsSync(target), "missing " + target);
  }
  assert(!/G-PLACEHOLDER|TODO|undefined/.test(html));
}
for (const file of [
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "ads.txt",
  "favicon.svg",
  "social.png",
  "404.html",
  "release.json",
])
  assert(fs.existsSync("dist/" + file), file);
console.log(
  `SEO audit passed: ${urls.length} pages, metadata, alternates, schema, assets and local links`,
);
