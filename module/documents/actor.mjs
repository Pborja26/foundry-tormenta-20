import { rolarTeste } from "../dice/rolagens.mjs";

export class T20SActor extends Actor {
  async rolarPericia(key) {
    const pericia = this.system.pericias[key];
    if (!pericia) return null;
    if (pericia.somenteTreinada && !pericia.treinada) {
      ui.notifications.warn(`${pericia.label} só pode ser usada por quem é treinado.`);
      return null;
    }
    return rolarTeste(this, { titulo: pericia.label, bonus: pericia.total });
  }

  async rolarAtributo(key) {
    const valor = this.system.atributos[key]?.valor;
    if (valor === undefined) return null;
    return rolarTeste(this, { titulo: CONFIG.T20S.atributos[key], bonus: valor });
  }
}
