const path = require("path");
const { startServer } = require("next/dist/server/lib/start-server");

const projectDir = path.join(__dirname, "..");
const port = Number(process.env.PORT || 3001);
const hostname = process.env.HOSTNAME || "0.0.0.0";

console.log("[dev-nofork] starting server...");

startServer({
  dir: projectDir,
  isDev: true,
  hostname,
  port,
})
  .then(() => {
    console.log(`[dev-nofork] listening at http://${hostname}:${port}`);
  })
  .catch((err) => {
    console.error("[dev-nofork] Failed to start Next dev server (no-fork):", err);
    process.exit(1);
  });
