/**
 * Cálculos de regra puros (sem dependência do Foundry), para poderem ser testados com `npm test`.
 * Cada função devolve o total e as partes que o compõem, usadas no tooltip da ficha.
 */
import { T20S } from "./config.mjs";

/** Metade do nível, arredondada para baixo. */
export const meioNivel = (nivel) => Math.floor(nivel / 2);

/** Converte a pontuação de atributo no modificador usado pelas regras. */
export const modificadorAtributo = (valor) => Math.floor((valor - 10) / 2);

/** Pontuação canônica para um modificador legado, usada na migração de fichas antigas. */
export const valorAtributoDeModificador = (modificador) => Math.max(1, 10 + modificador * 2);

/** +2 até o 6º nível, +4 do 7º ao 14º, +6 a partir do 15º. */
export const bonusTreino = (nivel) => (nivel >= 15 ? 6 : nivel >= 7 ? 4 : 2);

/**
 * Perícia = ½ nível + atributo + treino + outros − penalidade de armadura + tamanho.
 * @param {object} p
 * @param {string} [p.key]               chave da perícia em T20S.pericias
 * @param {object} [p.cfg]               configuração própria (ofícios): { atributo, penalidadeArmadura?, tamanho? }
 * @param {number} p.nivel
 * @param {object} p.atributos           { for: 2, des: 1, ... }
 * @param {boolean} p.treinada
 * @param {number} [p.outros=0]
 * @param {number} [p.penalidadeArmadura=0]  valor positivo; é subtraído
 * @param {string} [p.tamanho="medio"]
 */
export function calcularPericia({
  key,
  cfg = T20S.pericias[key],
  nivel,
  atributos,
  treinada,
  outros = 0,
  penalidadeArmadura = 0,
  tamanho = "medio"
}) {
  const partes = [
    { rotulo: "½ nível", valor: meioNivel(nivel) },
    { rotulo: T20S.atributosAbr[cfg.atributo], valor: atributos[cfg.atributo] }
  ];
  if (treinada) partes.push({ rotulo: "Treino", valor: bonusTreino(nivel) });
  if (outros) partes.push({ rotulo: "Outros", valor: outros });
  if (cfg.penalidadeArmadura && penalidadeArmadura) {
    partes.push({ rotulo: "Armadura", valor: -penalidadeArmadura });
  }
  const modTamanho = T20S.modificadorTamanho[tamanho] ?? 0;
  if (cfg.tamanho && modTamanho) partes.push({ rotulo: "Tamanho", valor: modTamanho });

  return { total: somar(partes), partes };
}

/**
 * Defesa = 10 + atributo + armadura + escudo + outros.
 * Armadura pesada não soma o atributo (Destreza), salvo melhorias como Delicada (até 1 ponto).
 * Só uma armadura e um escudo contam; se houver mais de um equipado, vale o de maior bônus.
 * Melhorias/encantos das armaduras já entram aqui (veja armaduraEfetiva).
 * @param {object} p
 * @param {number} p.atributo           valor do atributo da Defesa (normalmente DES)
 * @param {string} p.atributoChave      "des", "sab"...; só usado no rótulo
 * @param {Array<{defesa:number, penalidade:number, tipo:string, modificacoes?:object[]}>} p.equipadas
 * @param {number} [p.outros=0]
 */
export function calcularDefesa({ atributo, atributoChave = "des", equipadas = [], outros = 0 }) {
  const efetivas = equipadas.map(armaduraEfetiva);
  const melhor = (lista) => lista.reduce((m, a) => (!m || a.defesa > m.defesa ? a : m), null);
  const armadura = melhor(efetivas.filter((a) => a.tipo !== "escudo"));
  const escudo = melhor(efetivas.filter((a) => a.tipo === "escudo"));
  const pesada = armadura?.tipo === "pesada";

  const abr = T20S.atributosAbr[atributoChave];
  const partes = [{ rotulo: "Base", valor: 10 }];
  if (!pesada) partes.push({ rotulo: abr, valor: atributo });
  else if (armadura.atributoMax && atributo > 0) {
    partes.push({
      rotulo: `${abr} (máx. ${armadura.atributoMax})`,
      valor: Math.min(atributo, armadura.atributoMax)
    });
  }
  if (armadura) partes.push({ rotulo: "Armadura", valor: armadura.defesa });
  if (escudo) partes.push({ rotulo: "Escudo", valor: escudo.defesa });
  if (outros) partes.push({ rotulo: "Outros", valor: outros });

  return {
    total: somar(partes),
    partes,
    penalidade: (armadura?.penalidade ?? 0) + (escudo?.penalidade ?? 0),
    pesada
  };
}

/* ---------- Modificações (melhorias e encantos) ---------- */

const normalizar = (texto) => (texto ?? "").trim().toLowerCase();

/**
 * Modificações que valem: as ativas, tirando as substituídas por outra
 * (ex.: Pungente substitui Certeira, Atroz substitui Cruel, Magnífica substitui Formidável).
 */
export function modificacoesAtivas(modificacoes = []) {
  const ativas = modificacoes.filter((m) => m.ativa !== false);
  const substituidas = new Set(ativas.map((m) => normalizar(m.substitui)).filter(Boolean));
  return ativas.filter((m) => !substituidas.has(normalizar(m.nome)));
}

const soma = (lista, campo) => lista.reduce((total, m) => total + (Number(m[campo]) || 0), 0);

/** Armadura/escudo com as modificações aplicadas: Defesa, penalidade (mínimo 0) e limite de atributo. */
export function armaduraEfetiva(armadura) {
  const mods = modificacoesAtivas(armadura.modificacoes);
  const limites = mods.map((m) => m.atributoMax).filter((v) => v > 0);
  return {
    ...armadura,
    defesa: armadura.defesa + soma(mods, "defesa"),
    penalidade: Math.max(0, armadura.penalidade + soma(mods, "penalidade")),
    atributoMax: limites.length ? Math.max(...limites) : 0
  };
}

/**
 * Tudo que uma arma precisa para atacar, com melhorias e encantos aplicados.
 * @param {object} p
 * @param {object} p.arma        system da arma (pericia, atributoAtaque, bonusAtaque, margem, multiplicador, arremesso, modificacoes)
 * @param {{total:number, atributo:string, label:string}} p.pericia   perícia de ataque já calculada
 * @param {Record<string, number>} p.atributos                         totais dos atributos
 */
export function calcularArma({ arma, pericia, atributos }) {
  const mods = modificacoesAtivas(arma.modificacoes);

  // Ataque: perícia + bônus da arma + modificações. Trocar o atributo (ex.: Acuidade com Arma usa DES).
  const atributoAtaque = arma.atributoAtaque || pericia.atributo;
  const trocaAtributo = atributos[atributoAtaque] - atributos[pericia.atributo];
  const partesAtaque = [{ rotulo: pericia.label, valor: pericia.total }];
  if (trocaAtributo) {
    partesAtaque.push({
      rotulo: `${T20S.atributosAbr[atributoAtaque]} no lugar de ${T20S.atributosAbr[pericia.atributo]}`,
      valor: trocaAtributo
    });
  }
  if (arma.bonusAtaque) partesAtaque.push({ rotulo: "Arma", valor: arma.bonusAtaque });
  for (const m of mods) if (m.ataque) partesAtaque.push({ rotulo: m.nome, valor: Number(m.ataque) });

  // Margem de ameaça: Ameaçadora duplica a faixa da arma; Precisa e similares somam depois.
  let faixa = 21 - arma.margem;
  if (mods.some((m) => m.margemDobrada)) faixa *= 2;
  faixa += soma(mods, "margem");
  const margem = Math.max(1, 21 - faixa);
  const multiplicador = arma.multiplicador + soma(mods, "multiplicador");

  // Dano: atributo (Força em Luta e arremesso; o atributo do ataque, se foi trocado em Luta) + bônus fixos.
  let atributoDano = null;
  if (arma.pericia === "luta") atributoDano = atributoAtaque;
  else if (arma.arremesso) atributoDano = "for";
  const partesDano = [];
  if (atributoDano && atributos[atributoDano]) {
    partesDano.push({ rotulo: T20S.atributosAbr[atributoDano], valor: atributos[atributoDano] });
  }
  for (const m of mods) if (m.dano) partesDano.push({ rotulo: m.nome, valor: Number(m.dano) });

  return {
    ataque: { total: somar(partesAtaque), partes: partesAtaque },
    margem,
    multiplicador,
    critico: `${margem < 20 ? `${margem}/` : ""}x${multiplicador}`,
    bonusDano: somar(partesDano),
    partesDano,
    extras: mods
      .filter((m) => m.dadosExtras)
      .map((m) => ({ nome: m.nome, formula: m.dadosExtras, tipo: m.tipoExtra })),
    danoCritico: soma(mods, "danoCritico"),
    modificacoes: mods
  };
}

/** Multiplica só os dados de uma fórmula: "2d4+1" ×3 → "6d4+1". */
export const multiplicarDados = (formula, mult) =>
  formula.replace(/(\d*)d(\d+)/g, (_, n, faces) => `${(Number(n) || 1) * mult}d${faces}`);

/**
 * Fórmula de dano. No crítico só os dados da arma multiplicam;
 * bônus numéricos e dados extras (encantos, Ataque Furtivo) não.
 */
export function montarFormulaDano({
  dano,
  bonusDano = 0,
  extras = [],
  critico = false,
  multiplicador = 2,
  danoCritico = 0
}) {
  const termos = [critico ? multiplicarDados(dano, multiplicador) : dano];
  for (const e of extras) termos.push(e.tipo ? `${e.formula}[${e.tipo}]` : e.formula);
  let formula = termos.join(" + ");
  const fixo = bonusDano + (critico ? danoCritico : 0);
  if (fixo) formula += ` ${fixo > 0 ? "+" : "-"} ${Math.abs(fixo)}`;
  return formula;
}

/**
 * Modificadores raciais de atributo: os fixos da raça mais os de livre escolha
 * (ex.: Humano, +1 em três atributos diferentes; Lefou, idem exceto Carisma).
 * Escolhas repetidas, proibidas ou além da quantidade são ignoradas.
 * @param {object} raca
 * @param {Record<string, number>} raca.atributos        modificadores fixos { for: 2, sab: -1, ... }
 * @param {{quantidade:number, valor:number, excluir:string[]}} raca.escolhas
 * @param {string[]} raca.escolhidos                     atributos escolhidos pelo jogador
 * @returns {{bonus: Record<string, number>, validos: string[], pendentes: number}}
 */
export function calcularBonusRacial({ atributos = {}, escolhas = {}, escolhidos = [] }) {
  const { quantidade = 0, valor = 1, excluir = [] } = escolhas;
  const bonus = Object.fromEntries(Object.keys(T20S.atributos).map((k) => [k, atributos[k] ?? 0]));

  const validos = [...new Set(escolhidos)]
    .filter((k) => k in bonus && !excluir.includes(k))
    .slice(0, quantidade);
  for (const k of validos) bonus[k] += valor;

  return { bonus, validos, pendentes: quantidade - validos.length };
}

/** Armadura pesada reduz o deslocamento em 3m. */
export const calcularDeslocamento = (base, pesada) => Math.max(0, base - (pesada ? 3 : 0));

/** Texto para tooltip: "½ nível 2 + FOR 4 + Treino 2 = 8". */
export const descreverPartes = (partes, total) => {
  const texto = partes
    .map((p, i) => {
      if (i === 0) return `${p.rotulo} ${p.valor}`;
      return `${p.valor < 0 ? "−" : "+"} ${p.rotulo} ${Math.abs(p.valor)}`;
    })
    .join(" ");
  return `${texto} = ${total}`;
};

const somar = (partes) => partes.reduce((soma, p) => soma + p.valor, 0);
