const CHAT_TEMPLATE = "systems/t20-sistema/templates/chat/rolagem.hbs";

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
 * Ataque com arma: rola o teste de ataque e o dano juntos.
 * Se o d20 natural estiver na margem de ameaça, os dados de dano são multiplicados
 * (em Tormenta20 só os dados multiplicam; bônus fixos não).
 */
export async function rolarAtaque(actor, arma) {
  const sys = arma.system;
  const pericia = actor.system.pericias[sys.pericia];
  const bonusAtaque = pericia.total + sys.bonusAtaque;

  const ataque = await new Roll("1d20 + @bonus", { bonus: bonusAtaque }).evaluate();
  const natural = d20Natural(ataque);
  const critico = natural >= sys.margem;

  const dano = new Roll(sys.dano, actor.getRollData());
  if (critico) {
    for (const termo of dano.terms) {
      if (termo instanceof foundry.dice.terms.Die) termo.number *= sys.multiplicador;
    }
    dano.resetFormula();
  }
  await dano.evaluate();

  const tipo = CONFIG.T20S.tiposDano[sys.tipoDano] ?? "";
  const content = await foundry.applications.handlebars.renderTemplate(CHAT_TEMPLATE, {
    titulo: arma.name,
    img: arma.img,
    subtitulo: `${pericia.label} · ${sys.dano} ${tipo} · ${sys.critico}`,
    linhas: [
      { rotulo: "Ataque", html: await ataque.render() },
      { rotulo: critico ? `Dano (crítico x${sys.multiplicador})` : "Dano", html: await dano.render() }
    ],
    critico,
    natural1: natural === 1
  });

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    rolls: [ataque, dano]
  });
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

  const cd = 10 + actor.system.meioNivel + actor.system.atributos[sys.atributo].valor;
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
