const path = require("node:path");
const fs = require("node:fs");

const compiledEntry = path.join(__dirname, "dist", "main", "index.js");

if (!fs.existsSync(compiledEntry)) {
  console.error(
    "Missing compiled main process bundle at dist/main/index.js. Run `npm run build:main` first.",
  );
  process.exit(1);
}

require(compiledEntry);
