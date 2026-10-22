import { montarFormulaDano } from "../regras.mjs";

const CHAT_TEMPLATE ="systems/t20-sistema/templates/chat/rolagem.hbs";

/** Resultado natural do primeiro d20 de uma rolagem já avaliada. */
function d20Natural(roll) {
  return roll.dice.find((d) => d.faces === 20)?.results[0]?.result ?? null;
}

/**
 * Teste genérico: 1d20 + bônus. Usado para perícias e atributos.
 * @param {Actor} actor
 * @param {object} opcoes
 * @param {string} opcoes.titulo   Texto do cartão ("Atletismo", "Força"...)
 * @param {number} opcoes.bonus    Bônus total do teste
 */
export async function rolarTeste(actor, { titulo, bonus }) {
  const roll = await new Roll("1d20 + @bonus", { bonus }).evaluate();
  const natural = d20Natural(roll);

  const content = await foundry.applications.handlebars.renderTemplate(CHAT_TEMPLATE, {
    titulo,
    linhas: [{ rotulo: "Teste", html: await roll.render() }],
    natural20: natural === 20,
    natural1: natural === 1
  });

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [roll]
  });
}

/**
 * Ataque com arma: rola o teste de ataque e o dano juntos, com melhorias e encantos.
 * Na margem de ameaça, só os dados da arma multiplicam; bônus fixos e dados extras não.
 */
export async function rolarAtaque(actor, arma) {
  const sys = arma.system;
  const calc = actor.dadosArma(arma);

  const ataque = await new Roll("1d20 + @bonus", { bonus: calc.ataque.total }).evaluate();
  const natural = d20Natural(ataque);
  const critico = natural >= calc.margem;

  // Armas sem dano (ex.: rede) só rolam o ataque.
  const formula = sys.dano && montarFormulaDano({
    dano: sys.dano,
    bonusDano: calc.bonusDano,
    extras: calc.extras,
    critico,
    multiplicador: calc.multiplicador,
    danoCritico: calc.danoCritico
  });
  const dano = formula ? await new Roll(formula, actor.getRollData()).evaluate() : null;

  const tipo = CONFIG.T20S.tiposDano[sys.tipoDano] ?? "";
  const mods = calc.modificacoes.map((m) => m.nome).join(", ");
  const content = await foundry.applications.handlebars.renderTemplate(CHAT_TEMPLATE, {
    titulo: arma.name,
    img: arma.img,
    subtitulo: [`${sys.dano} ${tipo}`, calc.critico, mods].filter(Boolean).join(" · "),
    linhas: [
      { rotulo: "Ataque", html: await ataque.render() },
      dano && { rotulo: critico ? `Dano (crítico x${calc.multiplicador})` : "Dano", html: await dano.render() }
    ].filter(Boolean),
    critico,
    natural1: natural === 1
  });

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [ataque, dano].filter(Boolean)
  });
}

/**
 * Usa um item utilizável: rola o efeito, aplica cura/PM/PV temporários e os efeitos do item
 * nos alvos marcados (ou em quem usa, se não houver alvo), e gasta uma unidade.
 * Dano e perda de PV não são aplicados sozinhos, porque dependem do teste de resistência.
 */
export async function usarConsumivel(actor, item) {
  const sys = item.system;
  if (sys.consumir && sys.quantidade < 1) {
    ui.notifications.warn(`${item.name}: acabou.`);
    return null;
  }

  const efeito = sys.efeito;
  const alvos = [...game.user.targets].map((t) => t.actor).filter(Boolean);
  const destinos = alvos.length ? alvos : [actor];
  const linhas = [];
  const rolls = [];

  let roll = null;
  if (efeito.tipo !== "nenhum" && efeito.formula) {
    roll = await new Roll(efeito.formula, actor.getRollData()).evaluate();
    rolls.push(roll);
    const rotulo = CONFIG.T20S.efeitosConsumivel[efeito.tipo];
    const tipoDano = efeito.tipoDano ? ` de ${CONFIG.T20S.tiposDano[efeito.tipoDano].toLowerCase()}` : "";
    const porRodada = efeito.rodadas ? ` por rodada, durante ${efeito.rodadas} rodadas` : "";
    linhas.push({ rotulo: `${rotulo}${tipoDano}${porRodada}`, html: await roll.render() });
  }

  const aplicados = [];
  for (const alvo of destinos) {
    if (!alvo.isOwner) continue;
    const mudancas = {};
    const { pv, pm } = alvo.system;
    if (roll && efeito.tipo === "cura") mudancas["system.pv.value"] = Math.min(pv.max, pv.value + roll.total);
    if (roll && efeito.tipo === "mana") mudancas["system.pm.value"] = Math.min(pm.max, pm.value + roll.total);
    if (roll && efeito.tipo === "pvTemp") mudancas["system.pv.temp"] = Math.max(pv.temp, roll.total);
    if (roll && efeito.tipo === "pmTemp") mudancas["system.pm.temp"] = Math.max(pm.temp, roll.total);
    if (Object.keys(mudancas).length) await alvo.update(mudancas);

    const efeitos = item.effects.map((e) => ({ ...e.toObject(), origin: item.uuid, transfer: false, disabled: false }));
    if (efeitos.length) await alvo.createEmbeddedDocuments("ActiveEffect", efeitos);
    if (Object.keys(mudancas).length || efeitos.length) aplicados.push(alvo.name);
  }

  const cd = efeito.atributoCd ? 10 + actor.system.meioNivel + actor.system.atributos[efeito.atributoCd].total : null;
  const detalhes = [
    { rotulo: "Execução", valor: sys.execucao },
    { rotulo: "Alcance", valor: sys.alcance },
    { rotulo: "Resistência", valor: efeito.resistencia ? `${efeito.resistencia}${cd ? ` (CD ${cd})` : ""}` : "" },
    { rotulo: "Aplicado em", valor: aplicados.join(", ") }
  ].filter((d) => d.valor);

  if (sys.consumir) await item.update({ "system.quantidade": sys.quantidade - 1 });

  const content = await foundry.applications.handlebars.renderTemplate(CHAT_TEMPLATE, {
    titulo: item.name,
    img: item.img,
    subtitulo: sys.consumir ? `Restam ${sys.quantidade - 1}` : CONFIG.T20S.categoriasConsumivel[sys.categoria],
    linhas,
    detalhes,
    descricao: await foundry.applications.ux.TextEditor.implementation.enrichHTML(sys.descricao, { relativeTo: item })
  });
  return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content, rolls });
}

/** Lança uma magia: gasta PM e mostra o cartão com a CD. */
export async function lancarMagia(actor, magia) {
  const sys = magia.system;
  const pmAtual = actor.system.pm.value;
  if (pmAtual < sys.custo) {
    ui.notifications.warn(`${actor.name} não tem PM suficiente (${pmAtual}/${sys.custo}).`);
    return null;
  }
  await actor.update({ "system.pm.value": pmAtual - sys.custo });

  const cd = 10 + actor.system.meioNivel + actor.system.atributos[sys.atributo].total;
  const content = await foundry.applications.handlebars.renderTemplate(CHAT_TEMPLATE, {
    titulo: magia.name,
    img: magia.img,
    subtitulo: `${CONFIG.T20S.tiposMagia[sys.tipo]} ${sys.circulo}º círculo · ${sys.custo} PM`,
    detalhes: [
      { rotulo: "Execução", valor: sys.execucao },
      { rotulo: "Alcance", valor: sys.alcance },
      { rotulo: "Alvo/Área", valor: sys.alvo },
      { rotulo: "Duração", valor: sys.duracao },
      { rotulo: "Resistência", valor: sys.resistencia ? `${sys.resistencia} (CD ${cd})` : "" }
    ].filter((d) => d.valor),
    descricao: await foundry.applications.ux.TextEditor.implementation.enrichHTML(sys.descricao, {
      relativeTo: magia
    })
  });

  return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });
}

/** Usa um poder: gasta PM (se tiver custo) e mostra a descrição. */
export async function usarPoder(actor, poder) {
  const { custo } = poder.system;
  if (custo > 0) {
    const pmAtual = actor.system.pm.value;
    if (pmAtual < custo) {
      ui.notifications.warn(`${actor.name} não tem PM suficiente (${pmAtual}/${custo}).`);
      return null;
    }
    await actor.update({ "system.pm.value": pmAtual - custo });
  }

  const content = await foundry.applications.handlebars.renderTemplate(CHAT_TEMPLATE, {
    titulo: poder.name,
    img: poder.img,
    subtitulo: custo > 0 ? `${custo} PM` : CONFIG.T20S.tiposPoder[poder.system.tipo],
    descricao: await foundry.applications.ux.TextEditor.implementation.enrichHTML(poder.system.descricao, {
      relativeTo: poder
    })
  });

  return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content });
}
