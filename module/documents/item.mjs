import { lancarMagia, rolarAtaque, usarPoder } from "../dice/rolagens.mjs";

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
      default:
        return ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `<h3>${this.name}</h3>${this.system.descricao ?? ""}`
        });
    }
  }
}
