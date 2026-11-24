# Envio 1 a 1 pelo WhatsApp

Manda as abordagens de prospecção uma por vez, do seu próprio número, com intervalo aleatório e indicador de "digitando". Roda e encerra: não fica nada em segundo plano.

**Não é disparo em massa.** Cada mensagem é escrita pra aquele dono, sai uma por vez, e você aprova a fila antes.

## Como funciona

Você escaneia um QR code uma única vez. O WhatsApp guarda a sessão em `~/.teixo-zap/`, fora do projeto. Depois disso, é só rodar quando quiser enviar.

## Passo a passo

**1. Instalar as dependências (só na primeira vez):**

```
cd scripts/whatsapp
npm install
```

**2. Revisar a fila sem enviar nada:**

```
node enviar.js <caminho>/fila.json --conferir
```

Isso imprime todos os textos. Leia. Nada sai até você usar `--confirmar`.

**3. Enviar:**

```
node enviar.js <caminho>/fila.json --confirmar --limite 3
```

O `--limite 3` manda só as 3 primeiras. É o jeito mais seguro de começar.

## Opções

| Opção | Pra quê | Padrão |
|---|---|---|
| `--conferir` | Revisa a fila, não envia | — |
| `--confirmar` | Envia de verdade | — |
| `--limite N` | No máximo N nesta rodada | sem limite |
| `--pular N` | Pula as N primeiras | 0 |
| `--min-segundos N` | Intervalo mínimo | 90 |
| `--max-segundos N` | Intervalo máximo | 240 |
| `--sem-digitando` | Não simula "digitando" | simula |

## Formato da fila

```json
[
  {
    "id": "01-empresa",
    "nome": "Nome da Empresa",
    "telefone": "5521984643185",
    "texto": "Oi, aqui é o Rhenan. Vi a ..."
  }
]
```

`telefone` é só dígitos, com `55`. O `id` é o que marca a mensagem como já enviada.

## O que o script recusa sozinho

Antes de enviar qualquer coisa, ele para e mostra o problema se:

- o telefone não estiver no formato `55` + DDD + número
- o texto estiver vazio ou passar de 900 caracteres
- o texto tiver travessão (o padrão Teixo não usa)
- o texto citar preço sem `"permitePreco": true`

Também confere no WhatsApp se cada número existe de verdade, e pula os que não têm conta.

## Controle de repetição

`enviados.json` fica ao lado da fila e registra o que já saiu. Rodar a fila de novo não reenvia ninguém. Para mandar de novo pra alguém, apague a entrada dessa pessoa.

## Conversa automática (`conversar.js`)

Responde as respostas dos leads. **Não usa modelo de linguagem** e por isso não inventa nada.

A ideia é simples: se o script não tem a resposta escrita em `config-conversa.json`, ele não responde. Marca a conversa em `precisa-de-voce.json` e deixa pra você. Ficar sem responder é sempre melhor do que prometer errado.

**O que ele responde sozinho:**

| Assunto | Precisa de |
|---|---|
| Preço | `preco` e `entrega` no config |
| Endereço | `endereco` no config |
| Horário | `horario` no config |
| Saudação ("oi", "boa tarde") | sempre |
| Resposta sobre de onde vem o cliente | `respostaQualificacao` |

**O que ele NUNCA responde** (vai direto pra você): desconto, prazo, garantia, contrato, nota fiscal, parcelamento, portfólio, reunião, resultado, vendas. E qualquer pergunta com `?` que não seja preço, endereço ou horário.

**Teto:** 10 conversas por dia (`tetoDiario`). Bateu o teto, ele para e passa tudo pra você.

**Rodar:**

```
node conversar.js <pasta-da-rodada> --conferir    simula, não conecta
node conversar.js <pasta-da-rodada> --rodar       conecta e responde
```

O `--conferir` mostra o que ele faria com 13 frases reais de lead, incluindo as que ele deve recusar. Use antes de rodar de verdade.

**Arquivos gerados na pasta da rodada:**

- `precisa-de-voce.json` — conversas esperando sua resposta
- `transcricoes.json` — histórico de cada conversa
- `estado-conversa.json` — controle de teto e de mensagens já vistas

## Aviso

Usa a API **não-oficial** do WhatsApp (Baileys). Isso viola os Termos de Serviço da Meta, e o risco de restrição do número é de quem usa.

O risco cresce com volume de contatos novos por dia, mensagens iguais pra várias pessoas, e número novo ou sem histórico. Não cresce com o "digitando" — isso é cosmético.

Com 10 conversas por dia, texto único pra cada e uma conta com uso normal, o risco de restrição é baixo. Em volume alto, o caminho é a **WhatsApp Business Cloud API** da Meta, que é oficial e não tem esse risco.

## Limite deste script

Ele responde por regra, não por compreensão. Não negocia, não contorna objeção e não improvisa. Se o lead escrever algo que não bate com nenhuma regra, a conversa para e espera você.

Isso é proposital. Um bot que improvisa numa oferta de escopo fechado acaba prometendo o que você não vende, e pelo CDC o que o seu preposto fala te obriga.
