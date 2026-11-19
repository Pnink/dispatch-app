// Start the app so other machines can reach it. Refuses to run without an owner password.
import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

// pick up .env.local / .env the same way Next.js will
for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const pw = process.env.OWNER_PASSWORD || "";
if (pw.length < 12) {
  console.error("Refusing to start on the network: set OWNER_PASSWORD (12+ characters) in .env.local first.");
  process.exit(1);
}
spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", process.env.PORT || "3100"], { stdio: "inherit" }).on("exit", (c) => process.exit(c ?? 0));
