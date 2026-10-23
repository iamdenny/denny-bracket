import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve("dist");
http
  .createServer((req, res) => {
    let p;
    try {
      p = path.resolve(
        root,
        "." + decodeURIComponent(new URL(req.url, "http://local").pathname),
      );
      if (p !== root && !p.startsWith(root + path.sep)) throw Error();
      if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p += "/index.html";
      if (!fs.existsSync(p)) {
        res.statusCode = 404;
        p = root + "/404.html";
      }
      res.setHeader(
        "Content-Type",
        {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript; charset=utf-8",
          ".css": "text/css",
          ".json": "application/json",
          ".svg": "image/svg+xml",
          ".xml": "application/xml",
          ".txt": "text/plain",
          ".png": "image/png",
        }[path.extname(p)] || "application/octet-stream",
      );
      res.end(fs.readFileSync(p));
    } catch {
      res.statusCode = 400;
      res.end("Bad request");
    }
  })
  .listen(Number(process.env.PORT || 4350), "127.0.0.1");
