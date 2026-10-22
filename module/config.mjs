/** Constantes de regra. Tudo que é "tabela do livro" fica aqui. */
export const T20S = {};

T20S.atributos = {
  for: "Força",
  des: "Destreza",
  con: "Constituição",
  int: "Inteligência",
  sab: "Sabedoria",
  car: "Carisma"
};

T20S.atributosAbr = {
  for: "FOR",
  des: "DES",
  con: "CON",
  int: "INT",
  sab: "SAB",
  car: "CAR"
};

/**
 * Perícias: atributo-chave e se exige treinamento para usar.
 * A chave é usada nos caminhos de dados: system.pericias.<chave>.
 */
T20S.pericias = {
  acrobacia: { label: "Acrobacia", atributo: "des" },
  adestramento: { label: "Adestramento", atributo: "car", somenteTreinada: true },
  atletismo: { label: "Atletismo", atributo: "for" },
  atuacao: { label: "Atuação", atributo: "car", somenteTreinada: true },
  cavalgar: { label: "Cavalgar", atributo: "des" },
  conhecimento: { label: "Conhecimento", atributo: "int", somenteTreinada: true },
  cura: { label: "Cura", atributo: "sab" },
  diplomacia: { label: "Diplomacia", atributo: "car" },
  enganacao: { label: "Enganação", atributo: "car" },
  fortitude: { label: "Fortitude", atributo: "con" },
  furtividade: { label: "Furtividade", atributo: "des" },
  guerra: { label: "Guerra", atributo: "int", somenteTreinada: true },
  iniciativa: { label: "Iniciativa", atributo: "des" },
  intimidacao: { label: "Intimidação", atributo: "car" },
  intuicao: { label: "Intuição", atributo: "sab" },
  investigacao: { label: "Investigação", atributo: "int" },
  jogatina: { label: "Jogatina", atributo: "car", somenteTreinada: true },
  ladinagem: { label: "Ladinagem", atributo: "des", somenteTreinada: true },
  luta: { label: "Luta", atributo: "for" },
  misticismo: { label: "Misticismo", atributo: "int", somenteTreinada: true },
  nobreza: { label: "Nobreza", atributo: "int", somenteTreinada: true },
  oficio: { label: "Ofício", atributo: "int", somenteTreinada: true },
  percepcao: { label: "Percepção", atributo: "sab" },
  pilotagem: { label: "Pilotagem", atributo: "des", somenteTreinada: true },
  pontaria: { label: "Pontaria", atributo: "des" },
  reflexos: { label: "Reflexos", atributo: "des" },
  religiao: { label: "Religião", atributo: "sab", somenteTreinada: true },
  sobrevivencia: { label: "Sobrevivência", atributo: "sab" },
  vontade: { label: "Vontade", atributo: "sab" }
};

/** Bônus de treinamento por nível de personagem. */
T20S.bonusTreino = (nivel) => (nivel >= 15 ? 6 : nivel >= 7 ? 4 : 2);

/** Custo base em PM de cada círculo de magia. */
T20S.custoCirculo = { 1: 1, 2: 3, 3: 6, 4: 10, 5: 15 };

T20S.tiposDano = {
  corte: "Corte",
  impacto: "Impacto",
  perfuracao: "Perfuração",
  acido: "Ácido",
  eletricidade: "Eletricidade",
  fogo: "Fogo",
  frio: "Frio",
  luz: "Luz",
  trevas: "Trevas",
  psiquico: "Psíquico",
  essencia: "Essência"
};

T20S.tiposMagia = { arcana: "Arcana", divina: "Divina", universal: "Universal" };

T20S.tiposPoder = {
  classe: "Classe",
  geral: "Geral",
  racial: "Racial",
  origem: "Origem",
  concedido: "Concedido"
};

T20S.periciasAtaque = { luta: "Luta", pontaria: "Pontaria" };
