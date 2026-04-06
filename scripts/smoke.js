// Quick smoke test: start Next dev server, hit a few public routes, report status codes.
const { startServer } = require("next/dist/server/lib/start-server");
const http = require("node:http");

async function main() {
  const port = 3000; // reuse default; fail fast if occupied.
  const hostname = "localhost";

  console.log("[smoke] starting dev server...");
  await startServer({ dir: process.cwd(), isDev: true, hostname, port });
  console.log("[smoke] server ready, probing routes...");

  const routes = ["/", "/blog", "/tutoriales", "/docs/api", "/integraciones"];

  for (const route of routes) {
    try {
      const status = await fetchStatus(`http://${hostname}:${port}${route}`);
      console.log(`[smoke] ${route} -> ${status}`);
    } catch (err) {
      console.error(`[smoke] ${route} -> error`, err.message);
    }
  }

  console.log("[smoke] done; exiting.");
  process.exit(0);
}

function fetchStatus(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      res.resume(); // drain
      resolve(res.statusCode);
    });
    req.on("error", reject);
  });
}

main().catch((err) => {
  console.error("[smoke] fatal", err);
  process.exit(1);
});
