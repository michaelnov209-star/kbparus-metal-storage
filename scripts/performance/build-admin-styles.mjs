import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compile } from "sass";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "../..");
const outputDirectory = resolve(projectRoot, "public/assets/admin");

const stylesheets = [
  {
    input: "app/(payload)/control-center.scss",
    output: "control-center.css"
  },
  {
    input: "app/(payload)/seo-route.scss",
    output: "seo-reports.css"
  },
  {
    input: "app/(payload)/system-center.scss",
    output: "system-center.css"
  }
];

await mkdir(outputDirectory, { recursive: true });

for (const stylesheet of stylesheets) {
  const result = compile(resolve(projectRoot, stylesheet.input), {
    charset: false,
    sourceMap: false,
    style: "compressed"
  });
  const outputPath = resolve(outputDirectory, stylesheet.output);
  const css = `${result.css.trim()}\n`;
  await writeFile(outputPath, css, "utf8");
  console.log(
    `[admin-styles] ${stylesheet.output}: ${Buffer.byteLength(css)} bytes`
  );
}
