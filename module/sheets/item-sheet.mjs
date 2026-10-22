const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

const TEMPLATES = "systems/foundry-tormenta-20/templates/item";

/** Ficha de item. Armas, armaduras, magias e poderes usam o template geral; raças têm o seu. */
export class T20SItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["t20s", "sheet", "item"],
    position: { width: 520, height: 600 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      adicionarHabilidade: T20SItemSheet.#onAdicionarHabilidade,
      removerHabilidade: T20SItemSheet.#onRemoverHabilidade,
      criarEfeito: T20SItemSheet.#onCriarEfeito,
      editarEfeito: T20SItemSheet.#onEditarEfeito,
      apagarEfeito: T20SItemSheet.#onApagarEfeito,
      alternarEfeito: T20SItemSheet.#onAlternarEfeito,
      adicionarModificacao: T20SItemSheet.#onAdicionarModificacao,
      removerModificacao: T20SItemSheet.#onRemoverModificacao
    }
  };

  static PARTS = {
    form: { template: `${TEMPLATES}/item-sheet.hbs`, scrollable: [""] },
    raca: { template: `${TEMPLATES}/raca-sheet.hbs`, scrollable: [""] }
  };

  /** Renderiza só a parte do tipo do item. */
  _configureRenderParts(options) {
    const parts = super._configureRenderParts(options);
    if (this.document.type === "raca") delete parts.form;
    else delete parts.raca;
    return parts;
  }

  _initializeApplicationOptions(options) {
    options = super._initializeApplicationOptions(options);
    if (["raca", "arma", "armadura", "consumivel"].includes(options.document?.type))
      options.position.height = 760;
    return options;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    const system = item.system;
    Object.assign(context, {
      item,
      system,
      fields: system.schema.fields,
      config: CONFIG.T20S,
      editable: this.isEditable,
      descricaoEnriquecida: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        system.descricao,
        {
          relativeTo: item,
          secrets: item.isOwner
        }
      )
    });
    if (item.type === "raca") Object.assign(context, this.#contextoRaca());
    if (["arma", "armadura"].includes(item.type)) {
      const presets = item.type === "arma" ? CONFIG.T20S.modificacoesArma : CONFIG.T20S.modificacoesArmadura;
      Object.assign(context, {
        modificacoes: system.listaModificacoes,
        presetsMelhoria: presets.filter((p) => p.tipo === "melhoria"),
        presetsEncanto: presets.filter((p) => p.tipo === "encanto")
      });
    }
    if (item.type === "armadura") context.armaduraEfetiva = system.efetiva;
    context.efeitos = item.effects.contents;
    context.efeitosDica = {
      arma: "Valem enquanto a arma estiver equipada (ex.: Defensora, +2 na Defesa: system.defesa.outros).",
      armadura: "Valem enquanto a armadura estiver equipada.",
      consumivel:
        "Aplicados no alvo (ou em quem usa) ao usar o item. Ex.: Cosmético, +2 em perícias de Carisma."
    }[item.type];
    return context;
  }

  #contextoRaca() {
    const { system } = this.document;
    const abr = CONFIG.T20S.atributosAbr;
    const excluir = system.escolhas.excluir;
    return {
      atributosFixos: Object.entries(system.atributos).map(([key, valor]) => ({ key, abr: abr[key], valor })),
      opcoesExcluir: Object.entries(abr).map(([value, label]) => ({
        value,
        label,
        selected: excluir.has(value)
      })),
      opcoesEscolha: Object.entries(abr)
        .filter(([value]) => !excluir.has(value))
        .map(([value, label]) => ({ value, label, selected: system.escolhidos.has(value) })),
      noPersonagem: !!this.document.parent,
      escolhasExcedentes: system.escolhidos.size > system.escolhas.quantidade,
      habilidades: Object.entries(system.habilidades).map(([id, h]) => ({ id, ...h })),
      efeitos: this.document.effects.contents
    };
  }

  /* ---------- Ações ---------- */

  static #onAdicionarHabilidade() {
    return this.document.update({
      [`system.habilidades.${foundry.utils.randomID()}`]: { nome: "Nova habilidade" }
    });
  }

  static #onRemoverHabilidade(event, target) {
    const id = target.closest("[data-habilidade-id]").dataset.habilidadeId;
    return this.document.update({ [`system.habilidades.-=${id}`]: null });
  }

  static async #onCriarEfeito() {
    // Efeitos de item utilizável não passam para quem carrega o item; são aplicados ao usar.
    const transfer = this.document.type !== "consumivel";
    const [efeito] = await this.document.createEmbeddedDocuments("ActiveEffect", [
      { name: this.document.name, img: this.document.img, transfer, changes: [] }
    ]);
    efeito?.sheet.render(true);
  }

  /** Adiciona a modificação escolhida na lista (melhoria/encanto do livro) ou uma em branco. */
  static #onAdicionarModificacao(event, target) {
    const escolha = this.element.querySelector("select.t20s-preset-modificacao")?.value;
    const presets =
      this.document.type === "arma" ? CONFIG.T20S.modificacoesArma : CONFIG.T20S.modificacoesArmadura;
    const preset = presets.find((p) => p.nome === escolha);
    const dados = preset
      ? { ...preset, ativa: !preset.condicional }
      : { nome: "Nova modificação", tipo: "outro" };
    delete dados.condicional;
    return this.document.update({ [`system.modificacoes.${foundry.utils.randomID()}`]: dados });
  }

  static #onRemoverModificacao(event, target) {
    const id = target.closest("[data-modificacao-id]").dataset.modificacaoId;
    return this.document.update({ [`system.modificacoes.-=${id}`]: null });
  }

  static #onEditarEfeito(event, target) {
    return this.#getEfeito(target)?.sheet.render(true);
  }

  static #onApagarEfeito(event, target) {
    return this.#getEfeito(target)?.deleteDialog();
  }

  static #onAlternarEfeito(event, target) {
    const efeito = this.#getEfeito(target);
    return efeito?.update({ disabled: !efeito.disabled });
  }

  #getEfeito(target) {
    return this.document.effects.get(target.closest("[data-efeito-id]")?.dataset.efeitoId);
  }
}
