// Gera os compêndios em packs/ a partir de packs/_source/. Uso: npm run build:packs
// O Foundry precisa estar FECHADO (ele trava os arquivos do compêndio enquanto o mundo está aberto).
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import racas from "../packs/_source/racas.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const lerFonte = (nome) => JSON.parse(fs.readFileSync(path.join(root, "packs/_source", nome), "utf8"));
const magias = lerFonte("magias.json");
const armas = lerFonte("armas.json");
const armaduras = lerFonte("armaduras.json");
const itens = lerFonte("itens.json");

const ATRIBUTOS = ["for", "des", "con", "int", "sab", "car"];
const ICONE = "icons/svg/mystery-man.svg";
const ICONE_ARMA = { luta: "icons/svg/sword.svg", pontaria: "icons/svg/target.svg" };
const ICONE_ARMADURA = { leve: "icons/svg/statue.svg", pesada: "icons/svg/statue.svg", escudo: "icons/svg/shield.svg" };
const ICONE_ITEM = {
  alquimico: "icons/svg/acid.svg",
  veneno: "icons/svg/poison.svg",
  alimento: "icons/svg/tankard.svg",
  municao: "icons/svg/target.svg",
  geral: "icons/svg/item-bag.svg",
  magico: "icons/svg/heal.svg"
};
const ICONE_MAGIA = { arcana: "icons/svg/book.svg", divina: "icons/svg/sun.svg", universal: "icons/svg/aura.svg" };
/** Atributo padrão da CD; o certo depende da classe de quem lança, e dá para trocar na ficha. */
const ATRIBUTO_MAGIA = { arcana: "int", divina: "sab", universal: "int" };

const referencia = (pagina) => (pagina ? `<p><em>Tormenta20 — Livro Básico, p. ${pagina}.</em></p>` : "");

/** Id estável de 16 caracteres a partir de um texto, para o compêndio não mudar a cada build. */
function idEstavel(texto) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const hash = createHash("sha256").update(texto).digest();
  return Array.from(hash.subarray(0, 16), (b) => chars[b % chars.length]).join("");
}

function racaParaItem(raca) {
  const _id = idEstavel(`raca:${raca.name}`);
  const habilidades = Object.fromEntries(
    (raca.habilidades ?? []).map((nome) => [idEstavel(`raca:${raca.name}:${nome}`), { nome, descricao: "" }])
  );
  const effects = (raca.efeitos ?? []).map((e) => {
    const effectId = idEstavel(`raca:${raca.name}:efeito:${e.name}`);
    return {
      _id: effectId,
      _key: `!items.effects!${_id}.${effectId}`,
      name: e.name,
      img: ICONE,
      transfer: true,
      disabled: false,
      changes: e.changes.map((c) => ({ priority: null, ...c }))
    };
  });

  return {
    _id,
    _key: `!items!${_id}`,
    name: raca.name,
    type: "raca",
    img: ICONE,
    system: {
      descricao: referencia(raca.pagina),
      atributos: Object.fromEntries(ATRIBUTOS.map((k) => [k, raca.atributos?.[k] ?? 0])),
      escolhas: {
        quantidade: raca.escolhas?.quantidade ?? 0,
        valor: raca.escolhas?.valor ?? 1,
        excluir: raca.escolhas?.excluir ?? []
      },
      escolhidos: [],
      tamanho: raca.tamanho ?? "medio",
      deslocamento: raca.deslocamento ?? 9,
      habilidades
    },
    effects,
    flags: {}
  };
}

function magiaParaItem(m) {
  const _id = idEstavel(`magia:${m.name}`);
  return {
    _id,
    _key: `!items!${_id}`,
    name: m.name,
    type: "magia",
    img: ICONE_MAGIA[m.tipo],
    system: {
      descricao: referencia(m.pagina),
      tipo: m.tipo,
      circulo: m.circulo,
      escola: m.escola,
      execucao: m.execucao,
      alcance: m.alcance,
      alvo: m.alvo,
      duracao: m.duracao,
      resistencia: m.resistencia,
      atributo: ATRIBUTO_MAGIA[m.tipo]
    },
    effects: [],
    flags: {}
  };
}

function base(prefixo, nome, type, img, system, effects = []) {
  const _id = idEstavel(`${prefixo}:${nome}`);
  return {
    _id,
    _key: `!items!${_id}`,
    name: nome,
    type,
    img,
    system,
    effects: effects.map((e) => {
      const effectId = idEstavel(`${prefixo}:${nome}:efeito:${e.name}`);
      return {
        _id: effectId,
        _key: `!items.effects!${_id}.${effectId}`,
        name: e.name,
        img,
        transfer: e.transfer ?? type !== "consumivel",
        disabled: false,
        changes: e.changes.map((c) => ({ priority: null, ...c }))
      };
    }),
    flags: {}
  };
}

const armaParaItem = (a) =>
  base("arma", a.name, "arma", ICONE_ARMA[a.pericia], {
    descricao: referencia(a.pagina),
    equipada: false,
    espacos: a.espacos,
    preco: a.preco,
    pericia: a.pericia,
    bonusAtaque: a.bonusAtaque,
    dano: a.dano,
    danoAlternativo: a.danoAlternativo,
    tipoDano: a.tipoDano,
    margem: a.margem,
    multiplicador: a.multiplicador,
    alcance: a.alcance,
    arremesso: a.arremesso,
    atributoAtaque: "",
    proficiencia: a.proficiencia,
    empunhadura: a.empunhadura,
    agil: a.agil,
    habilidades: a.habilidades,
    modificacoes: {}
  });

const armaduraParaItem = (a) =>
  base("armadura", a.name, "armadura", ICONE_ARMADURA[a.tipo], {
    descricao: referencia(a.pagina),
    equipada: false,
    espacos: a.espacos,
    preco: a.preco,
    tipo: a.tipo,
    defesa: a.defesa,
    penalidade: a.penalidade,
    modificacoes: {}
  });

/** Poções, óleos e granadas dizem qual magia contêm e onde ela está no livro. */
function descricaoItem(i) {
  if (!i.magia) return referencia(i.pagina);
  const m = i.magia;
  return (
    `<p>Contém a magia <strong>${m.nome}</strong> (${m.circulo}º círculo; duração: ${m.duracao.toLowerCase()}), ` +
    `Livro Básico, p. ${m.pagina}.</p>` +
    referencia(i.pagina)
  );
}

const itemParaItem = (i) =>
  base(
    "item",
    i.name,
    "consumivel",
    ICONE_ITEM[i.categoria],
    {
      descricao: descricaoItem(i),
      categoria: i.categoria,
      quantidade: i.quantidade,
      espacos: i.espacos,
      preco: i.preco,
      execucao: i.execucao,
      alcance: i.alcance,
      consumir: true,
      efeito: i.efeito
    },
    i.efeitos
  );

async function construir(nome, documentos) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `t20s-${nome}-`));
  for (const doc of documentos) {
    fs.writeFileSync(path.join(tmp, `${doc._id}.json`), JSON.stringify(doc, null, 2));
  }
  const destino = path.join(root, "packs", nome);
  fs.rmSync(destino, { recursive: true, force: true });
  await compilePack(tmp, destino);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`packs/${nome}: ${documentos.length} documento(s)`);
}

await construir("racas", racas.map(racaParaItem));
await construir("magias", magias.map(magiaParaItem));
await construir("armas", armas.map(armaParaItem));
await construir("armaduras", armaduras.map(armaduraParaItem));
await construir("itens", itens.map(itemParaItem));
