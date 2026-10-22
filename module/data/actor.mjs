import { T20S } from "../config.mjs";

const { SchemaField, NumberField, StringField, BooleanField, HTMLField } = foundry.data.fields;

const inteiro = (initial = 0, opts = {}) =>
  new NumberField({ required: true, nullable: false, integer: true, initial, ...opts });

const recurso = (max) =>
  new SchemaField({
    value: inteiro(max, { min: 0 }),
    max: inteiro(max, { min: 0 }),
    temp: inteiro(0, { min: 0 })
  });

/** Campos comuns a personagens e ameaças. */
class CriaturaData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const atributos = {};
    for (const key of Object.keys(T20S.atributos)) atributos[key] = new SchemaField({ valor: inteiro(0) });

    const pericias = {};
    for (const key of Object.keys(T20S.pericias)) {
      pericias[key] = new SchemaField({
        treinada: new BooleanField({ initial: false }),
        outros: inteiro(0)
      });
    }

    return {
      atributos: new SchemaField(atributos),
      pericias: new SchemaField(pericias),
      pv: recurso(10),
      pm: recurso(0),
      nivel: inteiro(1, { min: 1, max: 20 }),
      deslocamento: inteiro(9, { min: 0 })
    };
  }

  /** Metade do nível, arredondada para baixo. Para ameaças o "nível" funciona como ND. */
  get meioNivel() {
    return Math.floor(this.nivel / 2);
  }

  prepareDerivedData() {
    const treino = T20S.bonusTreino(this.nivel);
    for (const [key, cfg] of Object.entries(T20S.pericias)) {
      const pericia = this.pericias[key];
      pericia.label = cfg.label;
      pericia.atributo = cfg.atributo;
      pericia.somenteTreinada = !!cfg.somenteTreinada;
      pericia.total =
        this.meioNivel + this.atributos[cfg.atributo].valor + (pericia.treinada ? treino : 0) + pericia.outros;
    }
  }
}

export class PersonagemData extends CriaturaData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      xp: inteiro(0, { min: 0 }),
      defesa: new SchemaField({
        atributo: new StringField({ required: true, initial: "des", choices: T20S.atributosAbr }),
        outros: inteiro(0)
      }),
      detalhes: new SchemaField({
        raca: new StringField({ initial: "" }),
        classe: new StringField({ initial: "" }),
        origem: new StringField({ initial: "" }),
        divindade: new StringField({ initial: "" })
      }),
      biografia: new HTMLField({ initial: "" })
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    // Defesa = 10 + atributo + armadura/escudo equipados + outros
    const armaduras = this.parent.items.filter((i) => i.type === "armadura" && i.system.equipada);
    const bonusArmadura = armaduras.reduce((soma, a) => soma + a.system.defesa, 0);
    this.defesa.armadura = bonusArmadura;
    this.defesa.total = 10 + this.atributos[this.defesa.atributo].valor + bonusArmadura + this.defesa.outros;

    // Penalidade de armadura afeta Acrobacia, Furtividade e Ladinagem
    const penalidade = armaduras.reduce((soma, a) => soma + a.system.penalidade, 0);
    for (const key of ["acrobacia", "furtividade", "ladinagem"]) this.pericias[key].total -= penalidade;
  }
}

export class AmeacaData extends CriaturaData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      nd: new StringField({ initial: "1" }),
      defesa: new SchemaField({ total: inteiro(10) }),
      descricao: new HTMLField({ initial: "" })
    };
  }
}
