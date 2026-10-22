import { T20S } from "./module/config.mjs";
import { AmeacaData, PersonagemData } from "./module/data/actor.mjs";
import { ArmaData, ArmaduraData, MagiaData, PoderData } from "./module/data/item.mjs";
import { T20SActor } from "./module/documents/actor.mjs";
import { T20SItem } from "./module/documents/item.mjs";
import { AmeacaSheet, PersonagemSheet } from "./module/sheets/actor-sheet.mjs";
import { T20SItemSheet } from "./module/sheets/item-sheet.mjs";

const SYSTEM_ID = "t20-sistema";

Hooks.once("init", () => {
  console.log(`${SYSTEM_ID} | Inicializando`);

  CONFIG.T20S = T20S;
  game.t20s = { config: T20S };

  // Documentos
  CONFIG.Actor.documentClass = T20SActor;
  CONFIG.Item.documentClass = T20SItem;

  // Modelos de dados por tipo (os tipos são declarados em system.json)
  Object.assign(CONFIG.Actor.dataModels, {
    personagem: PersonagemData,
    ameaca: AmeacaData
  });
  Object.assign(CONFIG.Item.dataModels, {
    arma: ArmaData,
    armadura: ArmaduraData,
    magia: MagiaData,
    poder: PoderData
  });

  // Fichas
  const { Actors, Items } = foundry.documents.collections;
  Actors.registerSheet(SYSTEM_ID, PersonagemSheet, {
    types: ["personagem"],
    makeDefault: true,
    label: "Ficha de Personagem"
  });
  Actors.registerSheet(SYSTEM_ID, AmeacaSheet, {
    types: ["ameaca"],
    makeDefault: true,
    label: "Ficha de Ameaça"
  });
  Items.registerSheet(SYSTEM_ID, T20SItemSheet, { makeDefault: true, label: "Ficha de Item" });
});
