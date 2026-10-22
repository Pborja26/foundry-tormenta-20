const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/** Ficha única para todos os tipos de item; o template mostra os campos de cada tipo. */
export class T20SItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["t20s", "sheet", "item"],
    position: { width: 520, height: 600 },
    window: { resizable: true },
    form: { submitOnChange: true }
  };

  static PARTS = {
    form: { template: "systems/t20-sistema/templates/item/item-sheet.hbs", scrollable: [".descricao"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    Object.assign(context, {
      item,
      system: item.system,
      fields: item.system.schema.fields,
      config: CONFIG.T20S,
      editable: this.isEditable,
      descricaoEnriquecida: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        item.system.descricao,
        { relativeTo: item, secrets: item.isOwner }
      )
    });
    return context;
  }
}
