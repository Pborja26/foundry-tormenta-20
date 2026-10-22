import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armaduraEfetiva,
  calcularArma,
  bonusTreino,
  calcularBonusRacial,
  calcularDefesa,
  calcularDeslocamento,
  calcularPericia,
  descreverPartes,
  meioNivel,
  modificacoesAtivas,
  montarFormulaDano,
  multiplicarDados
} from "../module/regras.mjs";

const atributos = { for: 4, des: 3, con: 2, int: 0, sab: 1, car: -1 };
const pericia = (key, extra = {}) =>
  calcularPericia({ key, nivel: 5, atributos, treinada: false, ...extra }).total;

describe("½ nível", () => {
  it("arredonda para baixo", () => {
    assert.equal(meioNivel(1), 0);
    assert.equal(meioNivel(5), 2);
    assert.equal(meioNivel(20), 10);
  });
});

describe("bônus de treino", () => {
  it("+2 do 1º ao 6º nível", () => {
    assert.equal(bonusTreino(1), 2);
    assert.equal(bonusTreino(6), 2);
  });
  it("+4 do 7º ao 14º nível", () => {
    assert.equal(bonusTreino(7), 4);
    assert.equal(bonusTreino(14), 4);
  });
  it("+6 a partir do 15º nível", () => {
    assert.equal(bonusTreino(15), 6);
    assert.equal(bonusTreino(20), 6);
  });
});

describe("perícias", () => {
  it("½ nível + atributo-chave", () => {
    assert.equal(pericia("atletismo"), 2 + 4); // FOR
    assert.equal(pericia("diplomacia"), 2 - 1); // CAR negativo
  });

  it("soma treino quando treinada", () => {
    assert.equal(pericia("luta", { treinada: true }), 2 + 4 + 2);
    assert.equal(calcularPericia({ key: "luta", nivel: 7, atributos, treinada: true }).total, 3 + 4 + 4);
    assert.equal(calcularPericia({ key: "luta", nivel: 15, atributos, treinada: true }).total, 7 + 4 + 6);
  });

  it("soma outros bônus", () => {
    assert.equal(pericia("percepcao", { outros: 2 }), 2 + 1 + 2);
  });

  it("penalidade de armadura só em Acrobacia, Furtividade e Ladinagem", () => {
    assert.equal(pericia("acrobacia", { penalidadeArmadura: 2 }), 2 + 3 - 2);
    assert.equal(pericia("furtividade", { penalidadeArmadura: 2 }), 2 + 3 - 2);
    assert.equal(pericia("ladinagem", { penalidadeArmadura: 2 }), 2 + 3 - 2);
    assert.equal(pericia("atletismo", { penalidadeArmadura: 2 }), 2 + 4);
    assert.equal(pericia("reflexos", { penalidadeArmadura: 2 }), 2 + 3);
  });

  it("tamanho só em Furtividade", () => {
    assert.equal(pericia("furtividade", { tamanho: "pequeno" }), 2 + 3 + 2);
    assert.equal(pericia("furtividade", { tamanho: "grande" }), 2 + 3 - 2);
    assert.equal(pericia("furtividade", { tamanho: "minusculo" }), 2 + 3 + 5);
    assert.equal(pericia("acrobacia", { tamanho: "pequeno" }), 2 + 3);
  });

  it("descreve as partes para o tooltip", () => {
    const { total, partes } = calcularPericia({ key: "furtividade", nivel: 5, atributos, treinada: true, penalidadeArmadura: 1 });
    assert.equal(descreverPartes(partes, total), "½ nível 2 + DES 3 + Treino 2 − Armadura 1 = 6");
  });
});

describe("ofícios", () => {
  const oficio = (extra = {}) =>
    calcularPericia({ cfg: { atributo: "int" }, nivel: 5, atributos, treinada: true, ...extra });

  it("usa a mesma fórmula das perícias, com o atributo escolhido", () => {
    assert.equal(oficio().total, 2 + 0 + 2); // INT 0
    assert.equal(oficio({ cfg: { atributo: "sab" } }).total, 2 + 1 + 2);
    assert.equal(oficio({ outros: 3 }).total, 2 + 0 + 2 + 3);
  });

  it("não sofre penalidade de armadura nem tamanho", () => {
    assert.equal(oficio({ penalidadeArmadura: 3, tamanho: "pequeno" }).total, 2 + 0 + 2);
  });
});

describe("bônus racial", () => {
  it("aplica modificadores fixos (Anão: CON +2, SAB +1, DES −1)", () => {
    const { bonus, pendentes } = calcularBonusRacial({ atributos: { con: 2, sab: 1, des: -1 } });
    assert.deepEqual(bonus, { for: 0, des: -1, con: 2, int: 0, sab: 1, car: 0 });
    assert.equal(pendentes, 0);
  });

  it("Humano: +1 em três atributos escolhidos", () => {
    const humano = { escolhas: { quantidade: 3, valor: 1 } };
    assert.equal(calcularBonusRacial(humano).pendentes, 3);
    const { bonus, pendentes } = calcularBonusRacial({ ...humano, escolhidos: ["for", "des", "car"] });
    assert.deepEqual(bonus, { for: 1, des: 1, con: 0, int: 0, sab: 0, car: 1 });
    assert.equal(pendentes, 0);
  });

  it("ignora escolhas além da quantidade", () => {
    const r = calcularBonusRacial({ escolhas: { quantidade: 3, valor: 1 }, escolhidos: ["for", "des", "con", "int"] });
    assert.deepEqual(r.validos, ["for", "des", "con"]);
    assert.equal(r.bonus.int, 0);
  });

  it("Lefou: não pode escolher Carisma, e Carisma −1 continua", () => {
    const lefou = { atributos: { car: -1 }, escolhas: { quantidade: 3, valor: 1, excluir: ["car"] } };
    const r = calcularBonusRacial({ ...lefou, escolhidos: ["car", "for", "des"] });
    assert.equal(r.bonus.car, -1);
    assert.deepEqual(r.validos, ["for", "des"]);
    assert.equal(r.pendentes, 1);
  });

  it("escolhas repetidas contam uma vez", () => {
    const r = calcularBonusRacial({ escolhas: { quantidade: 3, valor: 1 }, escolhidos: ["for", "for"] });
    assert.equal(r.bonus.for, 1);
    assert.equal(r.pendentes, 2);
  });

  it("bônus racial entra no total que as perícias usam", () => {
    const { bonus } = calcularBonusRacial({ atributos: { int: 2, des: 1, con: -1 } }); // Elfo
    const total = { ...atributos };
    for (const k of Object.keys(total)) total[k] += bonus[k];
    assert.equal(calcularPericia({ key: "misticismo", nivel: 1, atributos: total, treinada: true }).total, 0 + 2 + 2);
  });
});

describe("Defesa", () => {
  const leve = { tipo: "leve", defesa: 4, penalidade: 1 };
  const pesada = { tipo: "pesada", defesa: 5, penalidade: 2 };
  const escudo = { tipo: "escudo", defesa: 2, penalidade: 2 };

  it("10 + Destreza sem armadura", () => {
    assert.equal(calcularDefesa({ atributo: 3 }).total, 13);
  });

  it("armadura leve soma Destreza", () => {
    assert.equal(calcularDefesa({ atributo: 3, equipadas: [leve] }).total, 10 + 3 + 4);
  });

  it("armadura pesada não soma Destreza", () => {
    const r = calcularDefesa({ atributo: 3, equipadas: [pesada] });
    assert.equal(r.total, 10 + 5);
    assert.equal(r.pesada, true);
  });

  it("escudo soma com a armadura e as penalidades se acumulam", () => {
    const r = calcularDefesa({ atributo: 3, equipadas: [leve, escudo] });
    assert.equal(r.total, 10 + 3 + 4 + 2);
    assert.equal(r.penalidade, 1 + 2);
  });

  it("duas armaduras equipadas: vale só a melhor", () => {
    const r = calcularDefesa({ atributo: 3, equipadas: [leve, { tipo: "leve", defesa: 2, penalidade: 0 }] });
    assert.equal(r.total, 10 + 3 + 4);
    assert.equal(r.penalidade, 1);
  });

  it("soma outros bônus", () => {
    assert.equal(calcularDefesa({ atributo: 3, outros: 2 }).total, 15);
  });
});

describe("deslocamento", () => {
  it("armadura pesada reduz 3m", () => {
    assert.equal(calcularDeslocamento(9, false), 9);
    assert.equal(calcularDeslocamento(9, true), 6);
  });
});

describe("armas", () => {
  const luta = { total: 6, atributo: "for", label: "Luta" }; // ½ nível 2 + FOR 4
  const pontaria = { total: 5, atributo: "des", label: "Pontaria" }; // ½ nível 2 + DES 3
  const espada = { pericia: "luta", bonusAtaque: 0, margem: 19, multiplicador: 2, dano: "1d8", modificacoes: [] };

  it("ataque = perícia + bônus da arma", () => {
    assert.equal(calcularArma({ arma: { ...espada, bonusAtaque: 1 }, pericia: luta, atributos }).ataque.total, 7);
  });

  it("Luta soma Força no dano; disparo não soma; arremesso soma Força", () => {
    assert.equal(calcularArma({ arma: espada, pericia: luta, atributos }).bonusDano, 4);
    const arco = { ...espada, pericia: "pontaria", margem: 20, multiplicador: 3 };
    assert.equal(calcularArma({ arma: arco, pericia: pontaria, atributos }).bonusDano, 0);
    assert.equal(calcularArma({ arma: { ...arco, arremesso: true }, pericia: pontaria, atributos }).bonusDano, 4);
  });

  it("trocar o atributo do ataque (Acuidade com Arma) muda ataque e dano em Luta", () => {
    const r = calcularArma({ arma: { ...espada, atributoAtaque: "des" }, pericia: luta, atributos });
    assert.equal(r.ataque.total, 6 - 4 + 3);
    assert.equal(r.bonusDano, 3);
  });

  it("melhorias: Certeira +1 ataque, Cruel +1 dano; Pungente e Atroz substituem", () => {
    const mods = [{ nome: "Certeira", ataque: 1 }, { nome: "Cruel", dano: 1 }];
    let r = calcularArma({ arma: { ...espada, modificacoes: mods }, pericia: luta, atributos });
    assert.equal(r.ataque.total, 7);
    assert.equal(r.bonusDano, 5);
    mods.push({ nome: "Pungente", ataque: 2, substitui: "Certeira" }, { nome: "Atroz", dano: 2, substitui: "Cruel" });
    r = calcularArma({ arma: { ...espada, modificacoes: mods }, pericia: luta, atributos });
    assert.equal(r.ataque.total, 8);
    assert.equal(r.bonusDano, 6);
  });

  it("modificação inativa não conta", () => {
    const mods = [{ nome: "Sagrada", dadosExtras: "2d8", tipoExtra: "luz", ativa: false }];
    assert.deepEqual(calcularArma({ arma: { ...espada, modificacoes: mods }, pericia: luta, atributos }).extras, []);
    assert.equal(modificacoesAtivas(mods).length, 0);
  });

  it("Precisa aumenta a margem; Maciça aumenta o multiplicador", () => {
    const r = calcularArma({
      arma: { ...espada, modificacoes: [{ nome: "Precisa", margem: 1 }, { nome: "Maciça", multiplicador: 1 }] },
      pericia: luta,
      atributos
    });
    assert.equal(r.margem, 18);
    assert.equal(r.multiplicador, 3);
    assert.equal(r.critico, "18/x3");
  });

  it("Ameaçadora duplica a margem (19 → 17; x3 sem margem → 19)", () => {
    const amea = [{ nome: "Ameaçadora", margemDobrada: true }];
    assert.equal(calcularArma({ arma: { ...espada, modificacoes: amea }, pericia: luta, atributos }).margem, 17);
    const machado = { ...espada, margem: 20, multiplicador: 3, modificacoes: amea };
    assert.equal(calcularArma({ arma: machado, pericia: luta, atributos }).margem, 19);
  });

  it("encantos de dado entram como dados extras com tipo", () => {
    const r = calcularArma({
      arma: { ...espada, modificacoes: [{ nome: "Flamejante", dadosExtras: "1d6", tipoExtra: "fogo" }] },
      pericia: luta,
      atributos
    });
    assert.deepEqual(r.extras, [{ nome: "Flamejante", formula: "1d6", tipo: "fogo" }]);
  });
});

describe("fórmula de dano", () => {
  it("multiplica só os dados", () => {
    assert.equal(multiplicarDados("1d8", 2), "2d8");
    assert.equal(multiplicarDados("2d4", 3), "6d4");
    assert.equal(multiplicarDados("d6", 2), "2d6");
  });

  it("normal: dado + extras + bônus fixo", () => {
    const f = montarFormulaDano({ dano: "1d8", bonusDano: 4, extras: [{ formula: "1d6", tipo: "fogo" }] });
    assert.equal(f, "1d8 + 1d6[fogo] + 4");
  });

  it("crítico: multiplica os dados da arma, não os extras nem o bônus", () => {
    const f = montarFormulaDano({ dano: "1d8", bonusDano: 4, extras: [{ formula: "1d6", tipo: "fogo" }], critico: true, multiplicador: 3 });
    assert.equal(f, "3d8 + 1d6[fogo] + 4");
  });

  it("Dilacerante: +10 só no crítico", () => {
    assert.equal(montarFormulaDano({ dano: "1d8", bonusDano: 4, danoCritico: 10 }), "1d8 + 4");
    assert.equal(montarFormulaDano({ dano: "1d8", bonusDano: 4, danoCritico: 10, critico: true }), "2d8 + 14");
  });

  it("bônus negativo", () => {
    assert.equal(montarFormulaDano({ dano: "1d4", bonusDano: -1 }), "1d4 - 1");
  });
});

describe("armaduras com melhorias", () => {
  const cota = { tipo: "pesada", defesa: 6, penalidade: 2 };

  it("Reforçada: +1 Defesa e +1 penalidade", () => {
    const r = armaduraEfetiva({ ...cota, modificacoes: [{ nome: "Reforçada", defesa: 1, penalidade: 1 }] });
    assert.equal(r.defesa, 7);
    assert.equal(r.penalidade, 3);
  });

  it("Ajustada −1 e Sob Medida −2 (substitui), penalidade nunca negativa", () => {
    const mods = [{ nome: "Ajustada", penalidade: -1 }, { nome: "Sob Medida", penalidade: -2, substitui: "Ajustada" }];
    assert.equal(armaduraEfetiva({ ...cota, modificacoes: mods }).penalidade, 0);
    assert.equal(armaduraEfetiva({ tipo: "leve", defesa: 2, penalidade: 0, modificacoes: mods }).penalidade, 0);
  });

  it("Delicada: armadura pesada soma até 1 de DES", () => {
    const delicada = { ...cota, modificacoes: [{ nome: "Delicada", atributoMax: 1 }] };
    assert.equal(calcularDefesa({ atributo: 3, equipadas: [delicada] }).total, 10 + 1 + 6);
    assert.equal(calcularDefesa({ atributo: 3, equipadas: [cota] }).total, 10 + 6);
  });

  it("encanto Defensor soma na Defesa", () => {
    const r = calcularDefesa({ atributo: 3, equipadas: [{ tipo: "leve", defesa: 2, penalidade: 0, modificacoes: [{ nome: "Defensor", defesa: 2 }] }] });
    assert.equal(r.total, 10 + 3 + 4);
  });
});
