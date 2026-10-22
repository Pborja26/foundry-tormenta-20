// Verificação rápida sem o Foundry: JSON válido e sintaxe dos .mjs.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let erros = 0;

const arquivos = fs
  .readdirSync(root, { recursive: true })
  .filter((f) => !f.startsWith("node_modules") && !f.startsWith(".git"));

for (const f of arquivos.filter((f) => f.endsWith(".json"))) {
  try {
    JSON.parse(fs.readFileSync(path.join(root, f), "utf8"));
  } catch (e) {
    erros++;
    console.error(`JSON inválido: ${f} — ${e.message}`);
  }
}

for (const f of arquivos.filter((f) => f.endsWith(".mjs"))) {
  try {
    execFileSync(process.execPath, ["--check", path.join(root, f)], { stdio: "pipe" });
  } catch (e) {
    erros++;
    console.error(`Erro de sintaxe: ${f}\n${e.stderr}`);
  }
}

console.log(erros ? `${erros} problema(s) encontrado(s)` : "Tudo certo.");
process.exit(erros ? 1 : 0);
