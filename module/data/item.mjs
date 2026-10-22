import { T20S } from "../config.mjs";
import { armaduraEfetiva, calcularBonusRacial, modificacoesAtivas } from "../regras.mjs";

const { NumberField, StringField, BooleanField, HTMLField, SchemaField, SetField, TypedObjectField } =
  foundry.data.fields;

const inteiro = (initial = 0, opts = {}) =>
  new NumberField({ required: true, nullable: false, integer: true, initial, ...opts });
const texto = (initial = "", opts = {}) => new StringField({ required: true, initial, ...opts });

/** Melhoria ou encanto aplicado a uma arma. Os campos numéricos zerados não fazem nada. */
const modificacaoArma = () =>
  new SchemaField({
    nome: texto("Modificação"),
    tipo: texto("melhoria", { choices: { melhoria: "Melhoria", encanto: "Encanto", outro: "Outro" } }),
    ativa: new BooleanField({ initial: true }),
    ataque: inteiro(0),
    dano: inteiro(0),
    dadosExtras: texto(""),
    tipoExtra: texto(""),
    margem: inteiro(0),
    margemDobrada: new BooleanField({ initial: false }),
    multiplicador: inteiro(0),
    danoCritico: inteiro(0),
    substitui: texto(""),
    descricao: texto("")
  });

/** Melhoria ou encanto aplicado a uma armadura ou escudo. */
const modificacaoArmadura = () =>
  new SchemaField({
    nome: texto("Modificação"),
    tipo: texto("melhoria", { choices: { melhoria: "Melhoria", encanto: "Encanto", outro: "Outro" } }),
    ativa: new BooleanField({ initial: true }),
    defesa: inteiro(0),
    penalidade: inteiro(0),
    atributoMax: inteiro(0, { min: 0 }),
    substitui: texto(""),
    descricao: texto("")
  });

/** Lista de modificações com o id, na ordem em que foram criadas, e marcando as substituídas. */
function listarModificacoes(registro) {
  const lista = Object.entries(registro).map(([id, m]) => ({ id, ...m }));
  const valem = new Set(modificacoesAtivas(lista).map((m) => m.id));
  return lista.map((m) => ({ ...m, substituida: m.ativa && !valem.has(m.id) }));
}

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
      alcance: texto(""),
      /** Armas de arremesso (e a funda) somam Força no dano mesmo à distância. */
      arremesso: new BooleanField({ initial: false }),
      /** Atributo do ataque no lugar do da perícia (ex.: DES com Acuidade com Arma). Vazio = o da perícia. */
      atributoAtaque: texto("", { choices: { "": "Da perícia", ...T20S.atributosAbr } }),
      proficiencia: texto("simples", { choices: T20S.proficiencias }),
      empunhadura: texto("uma", { choices: T20S.empunhaduras }),
      agil: new BooleanField({ initial: false }),
      /** Segundo valor de dano da tabela (ex.: 1d10/1d12 da espada bastarda). Só informativo. */
      danoAlternativo: texto(""),
      /** Habilidades da arma (Alongada, Dupla, Versátil...), em texto. */
      habilidades: texto(""),
      modificacoes: new TypedObjectField(modificacaoArma())
    };
  }

  /** Crítico da tabela, sem modificações. Na ficha do personagem aparece o valor final. */
  get critico() {
    return `${this.margem < 20 ? `${this.margem}/` : ""}x${this.multiplicador}`;
  }

  get listaModificacoes() {
    return listarModificacoes(this.modificacoes);
  }
}

export class ArmaduraData extends EquipamentoData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      tipo: texto("leve", { choices: T20S.tiposArmadura }),
      defesa: inteiro(0, { min: 0 }),
      /** Valor positivo; a tabela do livro mostra com sinal de menos. */
      penalidade: inteiro(0, { min: 0 }),
      modificacoes: new TypedObjectField(modificacaoArmadura())
    };
  }

  get listaModificacoes() {
    return listarModificacoes(this.modificacoes);
  }

  /** Defesa e penalidade com as modificações aplicadas. */
  get efetiva() {
    return armaduraEfetiva(this.paraCalculo());
  }

  /** Objeto simples para as funções de regras.mjs. */
  paraCalculo() {
    const { tipo, defesa, penalidade } = this;
    return { tipo, defesa, penalidade, modificacoes: Object.values(this.modificacoes) };
  }
}

/** Itens utilizáveis: alquímicos, venenos, comidas, munição, poções. */
export class ConsumivelData extends ItemBaseData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      categoria: texto("geral", { choices: T20S.categoriasConsumivel }),
      quantidade: inteiro(1, { min: 0 }),
      espacos: new NumberField({ required: true, initial: 0.5, min: 0 }),
      preco: texto(""),
      execucao: texto("Padrão"),
      alcance: texto(""),
      /** Some uma unidade a cada uso. */
      consumir: new BooleanField({ initial: true }),
      efeito: new SchemaField({
        tipo: texto("nenhum", { choices: T20S.efeitosConsumivel }),
        formula: texto(""),
        tipoDano: texto("", { choices: { "": "—", ...T20S.tiposDano } }),
        /** Teste de resistência, ex.: "Reflexos reduz à metade". */
        resistencia: texto(""),
        /** Atributo de quem usa na CD (10 + ½ nível + atributo), ex.: DES para o ácido. Vazio = sem CD calculada. */
        atributoCd: texto("", { choices: { "": "—", ...T20S.atributosAbr } }),
        /** Duração em rodadas para perda de PV contínua (venenos); 0 = uma vez. */
        rodadas: inteiro(0, { min: 0 })
      })
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

/**
 * Raça. Os modificadores de atributo e o tamanho/deslocamento entram na ficha automaticamente;
 * habilidades com efeito mecânico simples usam Active Effects no próprio item.
 */
export class RacaData extends ItemBaseData {
  static defineSchema() {
    const atributos = {};
    for (const key of Object.keys(T20S.atributos)) atributos[key] = inteiro(0);
    const atributoChave = () => new StringField({ required: true, blank: false, choices: T20S.atributosAbr });

    return {
      ...super.defineSchema(),
      atributos: new SchemaField(atributos),
      /** Atributos de livre escolha: quantos, de quanto, e quais não podem ser escolhidos. */
      escolhas: new SchemaField({
        quantidade: inteiro(0, { min: 0, max: 6 }),
        valor: inteiro(1),
        excluir: new SetField(atributoChave())
      }),
      /** Escolhas feitas pelo jogador (só faz sentido no item dentro de um personagem). */
      escolhidos: new SetField(atributoChave()),
      tamanho: texto("medio", { choices: T20S.tamanhos }),
      deslocamento: inteiro(9, { min: 0 }),
      habilidades: new TypedObjectField(
        new SchemaField({
          nome: texto("Habilidade"),
          descricao: texto("")
        })
      )
    };
  }

  prepareDerivedData() {
    const { bonus, validos, pendentes } = calcularBonusRacial({
      atributos: this.atributos,
      escolhas: { ...this.escolhas, excluir: [...this.escolhas.excluir] },
      escolhidos: [...this.escolhidos]
    });
    this.bonus = bonus;
    this.escolhasValidas = validos;
    this.escolhasPendentes = pendentes;
  }

  /** Texto curto dos modificadores: "CON +2, SAB +1, DES −1" ou "+1 em 3 atributos". */
  get resumo() {
    const fixos = Object.entries(this.atributos)
      .filter(([, v]) => v)
      .map(([k, v]) => `${T20S.atributosAbr[k]} ${v > 0 ? "+" : "−"}${Math.abs(v)}`);
    if (this.escolhas.quantidade) {
      const exceto = [...this.escolhas.excluir].map((k) => T20S.atributosAbr[k]).join(", ");
      fixos.unshift(
        `+${this.escolhas.valor} em ${this.escolhas.quantidade} atributos${exceto ? ` (exceto ${exceto})` : ""}`
      );
    }
    return fixos.join(", ");
  }
}
