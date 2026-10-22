# Tormenta20 — Sistema Próprio (Foundry VTT v13)

Sistema para Foundry VTT v13 com as regras de Tormenta20 implementadas do zero.
Não depende do sistema Tormenta20 do Vizael.

> Só a **mecânica** está implementada aqui. Os textos dos livros (descrições de magias, poderes, raças) são
> da Jambô Editora: cadastre-os no seu mundo para uso na mesa, mas não distribua.

## Começando

1. Abra a pasta no VS Code e instale as extensões recomendadas (o VS Code oferece ao abrir).
2. Ligue o sistema ao Foundry:

   ```bash
   npm run link -- "/caminho/dos/dados/do/FoundryVTT"
   ```

   O caminho aparece no Foundry em **Configuration → User Data Path**. No Mac costuma ser
   `~/Library/Application Support/FoundryVTT`.

3. Reinicie o Foundry, crie um mundo com o sistema **Tormenta20 — Sistema Próprio**.
4. Depois de editar arquivos, recarregue o Foundry (F5). Mudanças em `system.json` exigem voltar ao menu e reabrir o mundo.

`npm run check` valida JSON e sintaxe dos `.mjs` sem abrir o Foundry.
`npm test` testa os cálculos de regra (`module/regras.mjs`) sem abrir o Foundry.
`npm run build:packs` gera os compêndios em `packs/` a partir de `packs/_source/` (com o Foundry fechado).

## Compêndios

Gerados a partir do Livro Básico (Edição Jogo do Ano). Contêm **só a mecânica** e a página do livro;
as descrições ficam para você preencher (o texto é da Jambô Editora).

**Raças (18):** modificadores de atributo, tamanho, deslocamento, nomes das habilidades e efeitos
automáticos para os bônus simples (Elfo +2 Misticismo/Percepção, Goblin +2 Fortitude, Minotauro +1 Defesa,
Golem +2 Defesa, Aggelus +2 Diplomacia/Intuição, Sulfure +2 Enganação/Furtividade).

- Arraste a raça para a ficha: ela substitui a anterior e copia tamanho e deslocamento.
- Raças com atributos à escolha (Humano, Lefou, Osteon, Sereia/Tritão) abrem a ficha da raça para você marcar
  os atributos; até lá o cabeçalho mostra um aviso.
- Na ficha, o atributo mostra o total (base + raça); o campo pequeno é o valor base.
- Habilidades aparecem na aba Ficha; clicar mostra a descrição no chat.
- Ainda manuais: PV/PM por nível (Anão, Elfo) e a penalidade de armadura fixa do Golem.

**Magias (198):** tipo, círculo, escola, execução, alcance, alvo/área/efeito, duração, resistência e página.
O atributo da CD vem como INT (arcanas/universais) ou SAB (divinas); troque na ficha da magia conforme a classe.
Aprimoramentos ainda não estão no sistema.

**Armas (40):** tabela 3-3 completa: dano, crítico, alcance, tipo, espaços, proficiência, empunhadura e
corpo a corpo/distância. Marcadas como ágeis (Chicote, Cimitarra, Corrente de espinhos, Florete, Katana)
e de arremesso (Adaga, Azagaia, Lança, Machadinha, Tridente; Funda também soma Força).

**Armaduras e Escudos (12):** tabela 3-5: bônus na Defesa, penalidade, espaços e categoria.

**Itens (69):** alquímicos, venenos, comidas e munições com efeito mecânico ao usar (ex.: Bálsamo cura 2d4,
Essência de mana +1d4 PM, Ácido 2d4 com Reflexos CD DES, Cosmético +2 em perícias de Carisma), e as 38 poções,
óleos e granadas da Tabela 8-12. Automatizadas: Curar Ferimentos (2d8+2 a 11d8+11), Vitalidade Fantasma
(2d10 PV temporários), Bola de Fogo (6d6/10d6), Escudo da Fé, Proteção Divina, Primor Atlético e Físico Divino
(três atributos). As outras dizem qual magia contêm e a página dela.

Para mudar um compêndio, edite `packs/_source/racas.mjs` ou `packs/_source/magias.json` e rode
`npm run build:packs` (com o Foundry fechado).

## O que já funciona

| Área      | Regras                                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Atributos | FOR, DES, CON, INT, SAB, CAR: pontuação convertida em modificador pela tabela do livro, após aplicar a raça |

- Na ficha, o atributo mostra o modificador calculado; o campo pequeno é a pontuação base, antes da raça.
  | Raças | Item de raça: modificadores fixos e de livre escolha, tamanho, deslocamento, habilidades e efeitos automáticos |
  | Perícias | ½ nível + atributo + treino (+2 / +4 no 7º / +6 no 15º) + outros. Perícias só treinadas (\*) bloqueiam o teste. Tooltip no total mostra a conta |
  | Ofícios | Lista livre na ficha (botão +): nome, atributo (INT por padrão), treino e outros. Só treinados podem rolar |
  | Tamanho | Modificador em Furtividade (Minúsculo +5, Pequeno +2, Grande −2, Enorme −5, Colossal −10) |
  | Defesa | 10 + atributo (DES por padrão) + 1 armadura + 1 escudo + outros. Armadura pesada não soma o atributo |
  | Armadura | Penalidade (armadura + escudo) subtrai de Acrobacia, Furtividade e Ladinagem. Pesada: −3m de deslocamento |
  | Ataque | 1d20 + Luta/Pontaria + bônus da arma + melhorias/encantos. Atributo do ataque pode ser trocado (Acuidade com Arma). Dano soma o atributo em Luta e Força em arremesso. No crítico só **os dados da arma** multiplicam; bônus e dados extras não |
  | Melhorias e encantos | Na ficha da arma/armadura: lista do livro (Certeira, Pungente, Cruel, Atroz, Precisa, Maciça, Flamejante, Ameaçadora, Formidável, Magnífica, Dilacerante, Ajustada, Sob Medida, Reforçada, Delicada, Defensor…) ou personalizada. Pungente/Atroz/Magnífica/Sob Medida substituem a anterior. Sagrada/Profana começam desligadas |
  | Itens utilizáveis | Quantidade, gasta ao usar, rola o efeito e aplica cura/PM/PV ou PM temporários e Active Effects nos alvos marcados (ou em quem usa). Dano e venenos só rolam |
  | Magias | Custo por círculo (1/3/6/10/15 PM), gasta PM, mostra CD = 10 + ½ nível + atributo |
  | Poderes | Gasta PM quando têm custo e mostram a descrição no chat |
  | Ameaças | Mesma ficha, com ND e Defesa fixa |
  | Iniciativa | 1d20 + Iniciativa |

## Estrutura

```
system.json                 manifesto: tipos de ator e item
t20-sistema.mjs             ponto de entrada (hook init)
module/config.mjs           tabelas de regra: perícias, custos, tipos de dano…
module/data/actor.mjs       campos e cálculos de Personagem e Ameaça
module/data/item.mjs        campos de Arma, Armadura, Magia, Poder
module/documents/           Actor/Item com métodos rolarPericia, rolarAtributo, usar
module/dice/rolagens.mjs    lógica das rolagens e cartões no chat
module/sheets/              fichas (ApplicationV2)
templates/                  Handlebars das fichas e do chat
styles/t20-sistema.css      visual
lang/pt-BR.json             nomes dos tipos
packs/_source/              dados das raças e magias (fonte dos compêndios)
packs/<nome>/               compêndios gerados (não editar à mão)
test/                       testes dos cálculos (npm test)
```

## Próximos passos sugeridos

- Aprimoramentos de magia (pagar PM extra ao lançar) com diálogo de escolha
- Botões no cartão do chat: aplicar dano/cura no token alvo, teste de resistência
- Condições (Abalado, Caído, Fatigado…) como Active Effects
- Itens de Classe e Origem que calculam PV/PM e concedem poderes
- Habilidades raciais com PV/PM por nível (Anão, Elfo) automatizadas
- Carga (espaços × Força) e dinheiro
- Compêndios com o conteúdo da sua mesa
