import { T20S } from "../config.mjs";
import {
  calcularBonusRacial,
  calcularDefesa,
  calcularDeslocamento,
  calcularPericia,
  descreverPartes,
  meioNivel,
  modificadorAtributo,
  valorAtributoDeModificador
} from "../regras.mjs";

const { SchemaField, NumberField, StringField, BooleanField, HTMLField, TypedObjectField } =
  foundry.data.fields;

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
    for (const key of Object.keys(T20S.atributos))
      atributos[key] = new SchemaField({ pontuacao: inteiro(10, { min: 1 }) });

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
      /** Ofícios cadastrados pelo usuário, indexados por um id aleatório. */
      oficios: new TypedObjectField(
        new SchemaField({
          nome: new StringField({ required: true, initial: "Ofício" }),
          atributo: new StringField({
            required: true,
            initial: T20S.oficio.atributo,
            choices: T20S.atributosAbr
          }),
          treinada: new BooleanField({ initial: false }),
          outros: inteiro(0)
        })
      ),
      pv: recurso(10),
      pm: recurso(0),
      nivel: inteiro(1, { min: 1, max: 20 }),
      tamanho: new StringField({ required: true, initial: "medio", choices: T20S.tamanhos }),
      deslocamento: inteiro(9, { min: 0 })
    };
  }

  /** A perícia fixa "oficio" virou a lista system.oficios; leva o que havia nela para um ofício. */
  static migrateData(source) {
    const antigo = source.pericias?.oficio;
    if (antigo && !source.oficios && (antigo.treinada || antigo.outros)) {
      source.oficios = {
        [foundry.utils.randomID()]: {
          nome: "Ofício",
          atributo: "int",
          treinada: antigo.treinada,
          outros: antigo.outros
        }
      };
    }

    for (const [key, atributo] of Object.entries(source.atributos ?? {})) {
      if (atributo.pontuacao !== undefined || atributo.valor === undefined) continue;
      atributo.pontuacao = valorAtributoDeModificador(Number(atributo.valor));
      delete atributo.valor;
    }
    return super.migrateData(source);
  }

  /** Metade do nível, arredondada para baixo. Para ameaças o "nível" funciona como ND. */
  get meioNivel() {
    return meioNivel(this.nivel);
  }

  /** Penalidade de armadura aplicada nas perícias. Personagens calculam pelos itens equipados. */
  get penalidadeArmadura() {
    return 0;
  }

  /** Item de raça do personagem (no máximo um). */
  get raca() {
    return this.parent.itemTypes.raca?.[0] ?? null;
  }

  prepareDerivedData() {
    // O jogador define a pontuação; regras usam o modificador após aplicar a raça.
    const bonusRacial = this.raca?.system.bonus ?? {};
    for (const [key, atr] of Object.entries(this.atributos)) {
      atr.racial = bonusRacial[key] ?? 0;
      atr.pontuacaoTotal = atr.pontuacao + atr.racial;
      atr.total = modificadorAtributo(atr.pontuacaoTotal);
    }

    this.prepararDefesa?.();

    const atributos = Object.fromEntries(Object.entries(this.atributos).map(([k, a]) => [k, a.total]));
    for (const [key, cfg] of Object.entries(T20S.pericias)) {
      const pericia = this.pericias[key];
      const { total, partes } = calcularPericia({
        key,
        nivel: this.nivel,
        atributos,
        treinada: pericia.treinada,
        outros: pericia.outros,
        penalidadeArmadura: this.penalidadeArmadura,
        tamanho: this.tamanho
      });
      Object.assign(pericia, {
        label: cfg.label,
        atributo: cfg.atributo,
        somenteTreinada: !!cfg.somenteTreinada,
        total,
        detalhe: descreverPartes(partes, total)
      });
    }

    for (const [id, oficio] of Object.entries(this.oficios)) {
      const { total, partes } = calcularPericia({
        cfg: { atributo: oficio.atributo },
        nivel: this.nivel,
        atributos,
        treinada: oficio.treinada,
        outros: oficio.outros
      });
      Object.assign(oficio, {
        id,
        label: `Ofício (${oficio.nome})`,
        somenteTreinada: T20S.oficio.somenteTreinada,
        total,
        detalhe: descreverPartes(partes, total)
      });
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
        classe: new StringField({ initial: "" }),
        origem: new StringField({ initial: "" }),
        divindade: new StringField({ initial: "" })
      }),
      biografia: new HTMLField({ initial: "" })
    };
  }

  get penalidadeArmadura() {
    return this.defesa.penalidade ?? 0;
  }

  prepararDefesa() {
    const equipadas = this.parent.items
      .filter((i) => i.type === "armadura" && i.system.equipada)
      .map((i) => i.system.paraCalculo());
    const { total, partes, penalidade, pesada } = calcularDefesa({
      atributo: this.atributos[this.defesa.atributo].total,
      atributoChave: this.defesa.atributo,
      equipadas,
      outros: this.defesa.outros
    });
    Object.assign(this.defesa, { total, penalidade, pesada, detalhe: descreverPartes(partes, total) });
    this.deslocamentoTotal = calcularDeslocamento(this.deslocamento, pesada);
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

  prepareDerivedData() {
    super.prepareDerivedData();
    this.deslocamentoTotal = this.deslocamento;
  }
}
