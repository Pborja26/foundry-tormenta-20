import { lancarMagia, rolarAtaque, usarConsumivel, usarPoder } from "../dice/rolagens.mjs";

export class T20SItem extends Item {
  /** Ação principal do item: atacar, lançar, usar. Itens sem ação apenas mostram a descrição. */
  async usar() {
    const actor = this.actor;
    if (!actor) return null;
    switch (this.type) {
      case "arma":
        return rolarAtaque(actor, this);
      case "magia":
        return lancarMagia(actor, this);
      case "poder":
        return usarPoder(actor, this);
      case "consumivel":
        return usarConsumivel(actor, this);
      default:
        return ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<h3>${this.name}</h3>${this.system.descricao ?? ""}`
        });
    }
  }

  /** Mostra no chat uma habilidade racial. */
  async mostrarHabilidade(id) {
    const habilidade = this.system.habilidades?.[id];
    if (!habilidade) return null;
    const descricao = await foundry.applications.ux.TextEditor.implementation.enrichHTML(habilidade.descricao, {
      relativeTo: this
    });
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="t20s-chat"><header><img src="${this.img}" alt="" /><div><h3>${habilidade.nome}</h3>
        <span class="t20s-chat-sub">${this.name}</span></div></header>
        <div class="t20s-chat-descricao">${descricao || "<em>Sem descrição.</em>"}</div></div>`
    });
  }

  /**
   * Ao entrar numa ficha, a raça substitui a anterior e copia tamanho e deslocamento.
   * Só o usuário que criou o item executa, para não repetir em todos os clientes.
   */
  async _onCreate(data, options, userId) {
    await super._onCreate(data, options, userId);
    if (this.type !== "raca" || !this.parent || userId !== game.user.id) return;

    const actor = this.parent;
    const antigas = actor.itemTypes.raca.filter((r) => r.id !== this.id).map((r) => r.id);
    if (antigas.length) await actor.deleteEmbeddedDocuments("Item", antigas);

    await actor.update({
      "system.tamanho": this.system.tamanho,
      "system.deslocamento": this.system.deslocamento
    });

    if (this.system.escolhasPendentes > 0) {
      ui.notifications.info(
        `${this.name}: escolha ${this.system.escolhasPendentes} atributo(s) para o bônus racial na ficha da raça.`
      );
      this.sheet.render(true);
    }
  }
}
