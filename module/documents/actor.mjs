import { rolarTeste } from "../dice/rolagens.mjs";
import { calcularArma } from "../regras.mjs";

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

  async rolarOficio(id) {
    const oficio = this.system.oficios[id];
    if (!oficio) return null;
    if (oficio.somenteTreinada && !oficio.treinada) {
      ui.notifications.warn(`${oficio.label} só pode ser usado por quem é treinado.`);
      return null;
    }
    return rolarTeste(this, { titulo: oficio.label, bonus: oficio.total });
  }

  /** Cria um ofício novo; devolve o id dele. */
  async adicionarOficio(nome = "Novo ofício") {
    const id = foundry.utils.randomID();
    await this.update({ [`system.oficios.${id}`]: { nome } });
    return id;
  }

  async removerOficio(id) {
    return this.update({ [`system.oficios.-=${id}`]: null });
  }

  /** Ataque, margem, multiplicador e dano de uma arma deste personagem, com modificações. */
  dadosArma(arma) {
    const sys = arma.system;
    const atributos = Object.fromEntries(Object.entries(this.system.atributos).map(([k, a]) => [k, a.total]));
    return calcularArma({
      arma: { ...sys.toObject(), modificacoes: Object.values(sys.modificacoes) },
      pericia: this.system.pericias[sys.pericia],
      atributos
    });
  }

  async rolarAtributo(key) {
    const valor = this.system.atributos[key]?.total;
    if (valor === undefined) return null;
    return rolarTeste(this, { titulo: CONFIG.T20S.atributos[key], bonus: valor });
  }
}
