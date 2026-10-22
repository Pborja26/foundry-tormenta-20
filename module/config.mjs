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
 * Perícias: atributo-chave, se exige treinamento para usar, se sofre penalidade de armadura
 * e se recebe o modificador de tamanho.
 * A chave é usada nos caminhos de dados: system.pericias.<chave>.
 */
T20S.pericias = {
  acrobacia: { label: "Acrobacia", atributo: "des", penalidadeArmadura: true },
  adestramento: { label: "Adestramento", atributo: "car", somenteTreinada: true },
  atletismo: { label: "Atletismo", atributo: "for" },
  atuacao: { label: "Atuação", atributo: "car", somenteTreinada: true },
  cavalgar: { label: "Cavalgar", atributo: "des" },
  conhecimento: { label: "Conhecimento", atributo: "int", somenteTreinada: true },
  cura: { label: "Cura", atributo: "sab" },
  diplomacia: { label: "Diplomacia", atributo: "car" },
  enganacao: { label: "Enganação", atributo: "car" },
  fortitude: { label: "Fortitude", atributo: "con" },
  furtividade: { label: "Furtividade", atributo: "des", penalidadeArmadura: true, tamanho: true },
  guerra: { label: "Guerra", atributo: "int", somenteTreinada: true },
  iniciativa: { label: "Iniciativa", atributo: "des" },
  intimidacao: { label: "Intimidação", atributo: "car" },
  intuicao: { label: "Intuição", atributo: "sab" },
  investigacao: { label: "Investigação", atributo: "int" },
  jogatina: { label: "Jogatina", atributo: "car", somenteTreinada: true },
  ladinagem: { label: "Ladinagem", atributo: "des", somenteTreinada: true, penalidadeArmadura: true },
  luta: { label: "Luta", atributo: "for" },
  misticismo: { label: "Misticismo", atributo: "int", somenteTreinada: true },
  nobreza: { label: "Nobreza", atributo: "int", somenteTreinada: true },
  percepcao: { label: "Percepção", atributo: "sab" },
  pilotagem: { label: "Pilotagem", atributo: "des", somenteTreinada: true },
  pontaria: { label: "Pontaria", atributo: "des" },
  reflexos: { label: "Reflexos", atributo: "des" },
  religiao: { label: "Religião", atributo: "sab", somenteTreinada: true },
  sobrevivencia: { label: "Sobrevivência", atributo: "sab" },
  vontade: { label: "Vontade", atributo: "sab" }
};

/**
 * Ofício não é uma perícia fixa: cada personagem cadastra os seus (system.oficios).
 * Todos usam Inteligência por padrão e só podem ser usados treinados.
 */
T20S.oficio = { atributo: "int", somenteTreinada: true };

/** Sugestões mostradas ao digitar o nome de um ofício; o usuário pode escrever qualquer outro. */
T20S.sugestoesOficio = [
  "Alfaiate",
  "Alquimista",
  "Armeiro",
  "Artesão",
  "Carpinteiro",
  "Cozinheiro",
  "Escriba",
  "Ferreiro",
  "Joalheiro",
  "Engenhoqueiro",
  "Fazendeiro",
  "Minerador",
  "Pescador"
];

T20S.tamanhos = {
  minusculo: "Minúsculo",
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
  enorme: "Enorme",
  colossal: "Colossal"
};

/** Modificador de tamanho aplicado em Furtividade. */
T20S.modificadorTamanho = { minusculo: 5, pequeno: 2, medio: 0, grande: -2, enorme: -5, colossal: -10 };

T20S.tiposArmadura = { leve: "Leve", pesada: "Pesada", escudo: "Escudo" };

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

/* ---------- Equipamento ---------- */

T20S.proficiencias = { simples: "Simples", marcial: "Marcial", exotica: "Exótica", fogo: "Arma de fogo" };
T20S.empunhaduras = { leve: "Leve", uma: "Uma mão", duas: "Duas mãos" };

T20S.categoriasConsumivel = {
  alquimico: "Alquímico",
  veneno: "Veneno",
  alimento: "Alimentação",
  municao: "Munição",
  magico: "Poção/óleo",
  geral: "Geral"
};

/** O que acontece quando um item utilizável é usado. */
T20S.efeitosConsumivel = {
  nenhum: "Só descrição",
  cura: "Recupera PV",
  mana: "Recupera PM",
  pvTemp: "PV temporários",
  pmTemp: "PM temporários",
  dano: "Causa dano",
  perdaPv: "Perda de PV (veneno)"
};

/**
 * Melhorias (Tabela 3-8) e encantos (Tabela 8-8) com efeito numérico, para adicionar a armas com um clique.
 * Campos: ataque, dano (bônus fixo), dadosExtras + tipoExtra, margem (+faixa), margemDobrada,
 * multiplicador, danoCritico (fixo só no crítico), substitui (nome da modificação que esta substitui),
 * condicional (começa desativada; ligue quando se aplicar, ex.: contra devotos do Mal).
 */
T20S.modificacoesArma = [
  { nome: "Certeira", tipo: "melhoria", ataque: 1 },
  { nome: "Pungente", tipo: "melhoria", ataque: 2, substitui: "Certeira" },
  { nome: "Cruel", tipo: "melhoria", dano: 1 },
  { nome: "Atroz", tipo: "melhoria", dano: 2, substitui: "Cruel" },
  { nome: "Precisa", tipo: "melhoria", margem: 1 },
  { nome: "Maciça", tipo: "melhoria", multiplicador: 1 },
  { nome: "Equilibrada", tipo: "melhoria", descricao: "+2 em testes de manobras." },
  { nome: "Harmonizada", tipo: "melhoria", descricao: "Custo de habilidades de ataque −1 PM." },
  { nome: "Mira telescópica", tipo: "melhoria", descricao: "Aumenta o alcance da arma." },
  { nome: "Ameaçadora", tipo: "encanto", margemDobrada: true },
  { nome: "Congelante", tipo: "encanto", dadosExtras: "1d6", tipoExtra: "frio" },
  { nome: "Corrosiva", tipo: "encanto", dadosExtras: "1d6", tipoExtra: "acido" },
  { nome: "Elétrica", tipo: "encanto", dadosExtras: "1d6", tipoExtra: "eletricidade" },
  { nome: "Flamejante", tipo: "encanto", dadosExtras: "1d6", tipoExtra: "fogo" },
  { nome: "Tumular", tipo: "encanto", dadosExtras: "1d8", tipoExtra: "trevas" },
  { nome: "Formidável", tipo: "encanto", ataque: 2, dano: 2 },
  { nome: "Magnífica", tipo: "encanto", ataque: 4, dano: 4, substitui: "Formidável" },
  { nome: "Dilacerante", tipo: "encanto", danoCritico: 10 },
  { nome: "Sagrada", tipo: "encanto", dadosExtras: "2d8", condicional: true, descricao: "Contra devotos do Mal." },
  { nome: "Profana", tipo: "encanto", dadosExtras: "2d8", condicional: true, descricao: "Contra devotos do Bem." }
];

/** Melhorias (Tabela 3-8) e encantos (Tabela 8-10) para armaduras e escudos. */
T20S.modificacoesArmadura = [
  { nome: "Ajustada", tipo: "melhoria", penalidade: -1 },
  { nome: "Sob Medida", tipo: "melhoria", penalidade: -2, substitui: "Ajustada" },
  { nome: "Reforçada", tipo: "melhoria", defesa: 1, penalidade: 1 },
  { nome: "Delicada", tipo: "melhoria", atributoMax: 1, descricao: "Só armaduras pesadas: soma até 1 de DES." },
  { nome: "Polida", tipo: "melhoria", descricao: "+5 na Defesa na primeira rodada." },
  { nome: "Defensor", tipo: "encanto", defesa: 2 }
];
