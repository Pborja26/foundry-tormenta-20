import { descreverPartes, montarFormulaDano } from "../regras.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const TEMPLATES = "systems/foundry-tormenta-20/templates/actor";

/** Ficha de personagem (ApplicationV2). A ficha de ameaça herda desta. */
export class PersonagemSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["t20s", "sheet", "actor"],
    position: { width: 760, height: 820 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rolarPericia: PersonagemSheet.#onRolarPericia,
      rolarAtributo: PersonagemSheet.#onRolarAtributo,
      editarPontuacao: PersonagemSheet.#onEditarPontuacao,
      rolarOficio: PersonagemSheet.#onRolarOficio,
      adicionarOficio: PersonagemSheet.#onAdicionarOficio,
      removerOficio: PersonagemSheet.#onRemoverOficio,
      mostrarHabilidade: PersonagemSheet.#onMostrarHabilidade,
      usarItem: PersonagemSheet.#onUsarItem,
      editarItem: PersonagemSheet.#onEditarItem,
      apagarItem: PersonagemSheet.#onApagarItem,
      criarItem: PersonagemSheet.#onCriarItem,
      equipar: PersonagemSheet.#onEquipar,
      alterarQuantidade: PersonagemSheet.#onAlterarQuantidade,
      editarImagem: PersonagemSheet.#onEditarImagem
    }
  };

  static PARTS = {
    header: { template: `${TEMPLATES}/header.hbs` },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    principal: { template: `${TEMPLATES}/tab-principal.hbs`, scrollable: [""] },
    inventario: { template: `${TEMPLATES}/tab-inventario.hbs`, scrollable: [""] },
    magias: { template: `${TEMPLATES}/tab-magias.hbs`, scrollable: [""] },
    biografia: { template: `${TEMPLATES}/tab-biografia.hbs`, scrollable: [""] }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "principal", label: "Ficha", icon: "fa-solid fa-scroll" },
        { id: "inventario", label: "Inventário", icon: "fa-solid fa-sack-xmark" },
        { id: "magias", label: "Magias e Poderes", icon: "fa-solid fa-hat-wizard" },
        { id: "biografia", label: "Biografia", icon: "fa-solid fa-book" }
      ],
      initial: "principal"
    }
  };

  /** Caminho do campo HTML da aba de texto (personagem: biografia; ameaça: descrição). */
  static CAMPO_TEXTO = "biografia";

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const system = actor.system;

    Object.assign(context, {
      actor,
      system,
      config: CONFIG.T20S,
      editable: this.isEditable,
      tabs: this._prepareTabs("primary"),
      atributos: Object.entries(system.atributos).map(([key, a]) => ({
        key,
        abr: CONFIG.T20S.atributosAbr[key],
        pontuacao: a.pontuacao,
        pontuacaoTotal: a.pontuacaoTotal,
        racial: a.racial,
        total: a.total
      })),
      raca: system.raca,
      habilidadesRaca: Object.entries(system.raca?.system.habilidades ?? {}).map(([id, h]) => ({ id, ...h })),
      pericias: Object.entries(system.pericias).map(([key, p]) => ({ key, ...p })),
      oficios: Object.values(system.oficios).sort((a, b) => a.nome.localeCompare(b.nome)),
      pvPct: pct(system.pv.value, system.pv.max),
      pmPct: pct(system.pm.value, system.pm.max),
      armas: actor.itemTypes.arma.map((arma) => this.#resumoArma(arma)),
      armaduras: actor.itemTypes.armadura.map((item) => ({
        id: item.id,
        name: item.name,
        img: item.img,
        system: item.system,
        efetiva: item.system.efetiva,
        mods: item.system.listaModificacoes.filter((m) => m.ativa).length
      })),
      consumiveis: actor.itemTypes.consumivel,
      magias: actor.itemTypes.magia.sort((a, b) => a.system.circulo - b.system.circulo),
      poderes: actor.itemTypes.poder,
      textoCampo: this.constructor.CAMPO_TEXTO,
      textoEnriquecido: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        system[this.constructor.CAMPO_TEXTO],
        { relativeTo: actor, secrets: actor.isOwner }
      )
    });
    return context;
  }

  /** Dados prontos para a lista de ataques: bônus final, dano e crítico com modificações. */
  #resumoArma(arma) {
    const calc = this.document.dadosArma(arma);
    const formula = montarFormulaDano({
      dano: arma.system.dano,
      bonusDano: calc.bonusDano,
      extras: calc.extras
    });
    return {
      id: arma.id,
      name: arma.name,
      img: arma.img,
      system: arma.system,
      ataque: calc.ataque.total,
      ataqueDetalhe: descreverPartes(calc.ataque.partes, calc.ataque.total),
      dano: formula,
      critico: calc.critico,
      mods: calc.modificacoes.map((m) => m.nome).join(", ")
    };
  }

  async _preparePartContext(partId, context, options) {
    context = await super._preparePartContext(partId, context, options);
    if (context.tabs?.[partId]) context.tab = context.tabs[partId];
    return context;
  }

  /* ---------- Ações ---------- */

  static #onRolarPericia(event, target) {
    return this.document.rolarPericia(target.dataset.pericia);
  }

  static #onRolarAtributo(event, target) {
    return this.document.rolarAtributo(target.dataset.atributo);
  }

  static async #onEditarPontuacao(event, target) {
    const key = target.dataset.atributo;
    const atributo = this.document.system.atributos[key];
    if (!atributo) return;

    const minimo = Math.max(1, atributo.racial + 1);
    const resultado = await foundry.applications.api.DialogV2.input({
      window: { title: `Pontuação bruta de ${CONFIG.T20S.atributosAbr[key]}` },
      content: `<label>Pontuação bruta<input name="pontuacao" type="number" min="${minimo}" step="1" value="${atributo.pontuacaoTotal}" autofocus></label>`,
      ok: { label: "Salvar" },
      rejectClose: false
    });
    if (!resultado) return;

    const pontuacaoBruta = Number(resultado.pontuacao);
    if (!Number.isInteger(pontuacaoBruta) || pontuacaoBruta < minimo) return;
    return this.document.update({ [`system.atributos.${key}.pontuacao`]: pontuacaoBruta - atributo.racial });
  }

  static #onRolarOficio(event, target) {
    return this.document.rolarOficio(target.closest("[data-oficio-id]").dataset.oficioId);
  }

  static #onAdicionarOficio() {
    return this.document.adicionarOficio();
  }

  static async #onRemoverOficio(event, target) {
    const id = target.closest("[data-oficio-id]").dataset.oficioId;
    const oficio = this.document.system.oficios[id];
    const confirmado = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Remover ofício" },
      content: `<p>Remover <strong>${oficio.label}</strong>?</p>`
    });
    if (confirmado) return this.document.removerOficio(id);
  }

  static #onMostrarHabilidade(event, target) {
    return this.document.system.raca?.mostrarHabilidade(
      target.closest("[data-habilidade-id]").dataset.habilidadeId
    );
  }

  static #onUsarItem(event, target) {
    return this._getItem(target)?.usar();
  }

  static #onEditarItem(event, target) {
    return this._getItem(target)?.sheet.render(true);
  }

  static #onApagarItem(event, target) {
    return this._getItem(target)?.deleteDialog();
  }

  static #onEquipar(event, target) {
    const item = this._getItem(target);
    return item?.update({ "system.equipada": !item.system.equipada });
  }

  static #onAlterarQuantidade(event, target) {
    const item = this._getItem(target);
    const delta = Number(target.dataset.delta);
    return item?.update({ "system.quantidade": Math.max(0, item.system.quantidade + delta) });
  }

  static #onCriarItem(event, target) {
    const { type } = target.dataset;
    const name = game.i18n.localize(`TYPES.Item.${type}`);
    return this.document.createEmbeddedDocuments("Item", [{ name, type }]);
  }

  static #onEditarImagem(event, target) {
    const fp = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current: this.document.img,
      callback: (path) => this.document.update({ img: path })
    });
    return fp.browse();
  }

  _getItem(target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    return this.document.items.get(id);
  }
}

/** Ameaça: mesma estrutura, outro cabeçalho e Defesa fixa. */
export class AmeacaSheet extends PersonagemSheet {
  static DEFAULT_OPTIONS = {
    classes: ["ameaca"],
    position: { width: 680, height: 760 }
  };

  static PARTS = {
    ...PersonagemSheet.PARTS,
    header: { template: `${TEMPLATES}/header-ameaca.hbs` }
  };

  static CAMPO_TEXTO = "descricao";
}

function pct(value, max) {
  if (!max) return 0;
  return Math.clamp(Math.round((value / max) * 100), 0, 100);
}
