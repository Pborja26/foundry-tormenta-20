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

## O que já funciona

| Área | Regras |
| --- | --- |
| Atributos | FOR, DES, CON, INT, SAB, CAR (o valor é o próprio modificador) |
| Perícias | ½ nível + atributo + treino (+2 / +4 no 7º / +6 no 15º) + outros. Perícias só treinadas (*) bloqueiam o teste |
| Defesa | 10 + atributo (DES por padrão) + armaduras/escudos equipados + outros |
| Armadura | Penalidade subtrai de Acrobacia, Furtividade e Ladinagem |
| Ataque | 1d20 + Luta/Pontaria + bônus da arma. Na margem de ameaça, **os dados** de dano são multiplicados |
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
```

## Próximos passos sugeridos

- Aprimoramentos de magia (pagar PM extra ao lançar) com diálogo de escolha
- Botões no cartão do chat: aplicar dano/cura no token alvo, teste de resistência
- Condições (Abalado, Caído, Fatigado…) como Active Effects
- Itens de Raça, Classe e Origem que calculam PV/PM e concedem poderes
- Carga (espaços × Força) e dinheiro
- Compêndios com o conteúdo da sua mesa
