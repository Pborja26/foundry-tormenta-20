import { T20S } from "../config.mjs";

const { NumberField, StringField, BooleanField, HTMLField } = foundry.data.fields;

const inteiro = (initial = 0, opts = {}) =>
  new NumberField({ required: true, nullable: false, integer: true, initial, ...opts });
const texto = (initial = "", opts = {}) => new StringField({ required: true, initial, ...opts });

class ItemBaseData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      descricao: new HTMLField({ initial: "" })
    };
  }
}

class EquipamentoData extends ItemBaseData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      equipada: new BooleanField({ initial: false }),
      espacos: new NumberField({ required: true, initial: 1, min: 0 }),
      preco: texto("")
    };
  }
}

export class ArmaData extends EquipamentoData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      pericia: texto("luta", { choices: T20S.periciasAtaque }),
      bonusAtaque: inteiro(0),
      dano: texto("1d6"),
      tipoDano: texto("corte", { choices: T20S.tiposDano }),
      /** Resultado mínimo no d20 para ameaçar um crítico (ex.: 19 em "19/x2"). */
      margem: inteiro(20, { min: 1, max: 20 }),
      multiplicador: inteiro(2, { min: 2 }),
      alcance: texto("")
    };
  }

  get critico() {
    return `${this.margem < 20 ? `${this.margem}/` : ""}x${this.multiplicador}`;
  }
}

export class ArmaduraData extends EquipamentoData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      defesa: inteiro(0, { min: 0 }),
      penalidade: inteiro(0, { min: 0 }),
      escudo: new BooleanField({ initial: false })
    };
  }
}

export class MagiaData extends ItemBaseData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      tipo: texto("arcana", { choices: T20S.tiposMagia }),
      circulo: inteiro(1, { min: 1, max: 5 }),
      escola: texto(""),
      execucao: texto("Padrão"),
      alcance: texto("Curto"),
      alvo: texto(""),
      duracao: texto("Instantânea"),
      resistencia: texto(""),
      /** Atributo usado na CD (10 + ½ nível + atributo). */
      atributo: texto("int", { choices: T20S.atributosAbr })
    };
  }

  get custo() {
    return T20S.custoCirculo[this.circulo];
  }
}

export class PoderData extends ItemBaseData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      tipo: texto("geral", { choices: T20S.tiposPoder }),
      custo: inteiro(0, { min: 0 }),
      preRequisito: texto("")
    };
  }
}
