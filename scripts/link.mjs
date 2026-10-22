// Cria um link desta pasta em <Dados do Foundry>/Data/systems/foundry-tormenta-20.
// Uso: npm run link -- "<caminho dos dados do Foundry>"
// (o caminho aparece no Foundry em Configuration → User Data Path)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const padrao = path.join(os.homedir(), "Library/Application Support/FoundryVTT");
const dados = process.argv[2] ?? process.env.FOUNDRY_DATA ?? padrao;
const systemsDir = path.join(dados, "Data", "systems");
const origem = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destino = path.join(systemsDir, "foundry-tormenta-20");

if (!fs.existsSync(systemsDir)) {
  console.error(`Pasta não encontrada: ${systemsDir}`);
  console.error('Informe o caminho dos dados do Foundry: npm run link -- "/caminho/FoundryVTT"');
  process.exit(1);
}
if (fs.existsSync(destino)) {
  console.log(`Já existe: ${destino}`);
  process.exit(0);
}
fs.symlinkSync(origem, destino, "dir");
console.log(`Link criado: ${destino} → ${origem}`);
