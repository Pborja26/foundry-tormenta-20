/**
 * Raças do livro básico (Tormenta20 — Edição Jogo do Ano), conferidas com o PDF do livro.
 *
 * Só a MECÂNICA está aqui: modificadores de atributo, tamanho, deslocamento, o NOME das habilidades
 * e a página do livro. As descrições ficam vazias de propósito; o texto é da Jambô Editora.
 * Preencha no Foundry (ficha da raça), para uso na sua mesa.
 *
 * Campos:
 *   atributos   modificadores fixos           { for, des, con, int, sab, car }
 *   escolhas    atributos de livre escolha    { quantidade, valor, excluir: [] }
 *   tamanho     minusculo | pequeno | medio | grande | enorme | colossal
 *   habilidades nomes das habilidades de raça
 *   efeitos     Active Effects aplicados automaticamente (modo 2 = Adicionar)
 *   pagina      página do Livro Básico
 *
 * Depois de editar, rode `npm run build:packs`.
 */
export default [
  {
    name: "Humano",
    pagina: 19,
    escolhas: { quantidade: 3, valor: 1 },
    habilidades: ["Versátil"]
  },
  {
    name: "Anão",
    pagina: 20,
    atributos: { con: 2, sab: 1, des: -1 },
    deslocamento: 6,
    habilidades: ["Conhecimento das Rochas", "Devagar e Sempre", "Duro como Pedra", "Tradição de Heredrimm"]
  },
  {
    name: "Dahllan",
    pagina: 21,
    atributos: { sab: 2, des: 1, int: -1 },
    habilidades: ["Amiga das Plantas", "Armadura de Allihanna", "Empatia Selvagem"]
  },
  {
    name: "Elfo",
    pagina: 22,
    atributos: { int: 2, des: 1, con: -1 },
    deslocamento: 12,
    habilidades: ["Graça de Glórienn", "Sangue Mágico", "Sentidos Élficos"],
    efeitos: [
      {
        name: "Sentidos Élficos",
        changes: [
          { key: "system.pericias.misticismo.outros", mode: 2, value: "2" },
          { key: "system.pericias.percepcao.outros", mode: 2, value: "2" }
        ]
      }
    ]
  },
  {
    name: "Goblin",
    pagina: 23,
    atributos: { des: 2, int: 1, car: -1 },
    tamanho: "pequeno",
    habilidades: ["Engenhoso", "Espelunqueiro", "Peste Esguia", "Rato das Ruas"],
    efeitos: [{ name: "Rato das Ruas", changes: [{ key: "system.pericias.fortitude.outros", mode: 2, value: "2" }] }]
  },
  {
    name: "Lefou",
    pagina: 24,
    atributos: { car: -1 },
    escolhas: { quantidade: 3, valor: 1, excluir: ["car"] },
    habilidades: ["Cria da Tormenta", "Deformidade"]
  },
  {
    name: "Minotauro",
    pagina: 25,
    atributos: { for: 2, con: 1, sab: -1 },
    habilidades: ["Chifres", "Couro Rígido", "Faro", "Medo de Altura"],
    efeitos: [{ name: "Couro Rígido", changes: [{ key: "system.defesa.outros", mode: 2, value: "1" }] }]
  },
  {
    name: "Qareen",
    pagina: 26,
    atributos: { car: 2, int: 1, sab: -1 },
    habilidades: ["Desejos", "Resistência Elemental", "Tatuagem Mística"]
  },
  {
    name: "Golem",
    pagina: 27,
    atributos: { for: 2, con: 1, car: -1 },
    deslocamento: 6,
    habilidades: ["Chassi", "Criatura Artificial", "Fonte Elemental", "Propósito de Criação"],
    // Chassi também dá penalidade de armadura −2 fixa; isso ainda não é automatizado.
    efeitos: [{ name: "Chassi", changes: [{ key: "system.defesa.outros", mode: 2, value: "2" }] }]
  },
  {
    name: "Hynne",
    pagina: 28,
    atributos: { des: 2, car: 1, for: -1 },
    tamanho: "pequeno",
    deslocamento: 6,
    habilidades: ["Arremessador", "Pequeno e Rechonchudo", "Sorte Salvadora"]
  },
  {
    name: "Kliren",
    pagina: 28,
    atributos: { int: 2, car: 1, for: -1 },
    habilidades: ["Híbrido", "Engenhosidade", "Ossos Frágeis", "Vanguardista"]
  },
  {
    name: "Medusa",
    pagina: 29,
    atributos: { des: 2, car: 1 },
    habilidades: ["Cria de Megalokk", "Natureza Venenosa", "Olhar Atordoante"]
  },
  {
    name: "Osteon",
    pagina: 29,
    atributos: { con: -1 },
    escolhas: { quantidade: 3, valor: 1, excluir: ["con"] },
    habilidades: ["Armadura Óssea", "Memória Póstuma", "Natureza Esquelética", "Preço da Não Vida"]
  },
  {
    name: "Sereia/Tritão",
    pagina: 30,
    escolhas: { quantidade: 3, valor: 1 },
    habilidades: ["Canção dos Mares", "Mestre do Tridente", "Transformação Anfíbia"]
  },
  {
    name: "Sílfide",
    pagina: 30,
    atributos: { car: 2, des: 1, for: -2 },
    tamanho: "minusculo",
    habilidades: ["Asas de Borboleta", "Espírito da Natureza", "Magia das Fadas"]
  },
  {
    name: "Suraggel (Aggelus)",
    pagina: 30,
    atributos: { sab: 2, car: 1 },
    habilidades: ["Herança Divina", "Luz Sagrada"],
    efeitos: [
      {
        name: "Luz Sagrada",
        changes: [
          { key: "system.pericias.diplomacia.outros", mode: 2, value: "2" },
          { key: "system.pericias.intuicao.outros", mode: 2, value: "2" }
        ]
      }
    ]
  },
  {
    name: "Suraggel (Sulfure)",
    pagina: 30,
    atributos: { des: 2, int: 1 },
    habilidades: ["Herança Divina", "Sombras Profanas"],
    efeitos: [
      {
        name: "Sombras Profanas",
        changes: [
          { key: "system.pericias.enganacao.outros", mode: 2, value: "2" },
          { key: "system.pericias.furtividade.outros", mode: 2, value: "2" }
        ]
      }
    ]
  },
  {
    name: "Trog",
    pagina: 31,
    atributos: { con: 2, for: 1, int: -1 },
    habilidades: ["Mau Cheiro", "Mordida", "Reptiliano", "Sangue Frio"]
  }
];
