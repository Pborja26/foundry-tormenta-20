export class T20SActiveEffect extends ActiveEffect {
  /** Efeitos de armas e armaduras só valem com o item equipado (ex.: encanto Defensora). */
  get isSuppressed() {
    const item = this.parent;
    if (item instanceof Item && ["arma", "armadura"].includes(item.type)) return !item.system.equipada;
    return super.isSuppressed;
  }
}
