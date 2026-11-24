# Teixo GMB — Extensão para Brave (sem fechar o navegador)

Extensão local para responder avaliações pendentes do Google Meu Negócio abrindo apenas uma **nova aba** no seu Brave já aberto e já logado.

## Como instalar (1 única vez)

1. No Brave, abra `brave://extensions`
2. Ative o **Modo do desenvolvedor** (canto superior direito)
3. Clique em **Carregar sem compactação** e selecione esta pasta:
   `c:\Users\rhena\Downloads\TeixoOS\scripts\extensao-gmb`
4. Fixe o ícone da extensão na barra do Brave (ícone do quebra-cabeça).

## Como usar

1. Clique no ícone **Teixo GMB — Avaliações**
2. Digite o nome da empresa (ex: `Pizza do Juca`) e, se quiser, o índice da conta Google (`0`, `1`, `6` ou e-mail)
3. Clique em **Abrir nova aba e responder** (ou abra você mesmo a aba com o painel de avaliações e clique em **Responder na aba atual**)
4. Ele filtra por **Não respondido** (quando o filtro existe no painel), preenche e envia as respostas uma a uma
5. Avaliações de 3 estrelas ou menos recebem resposta com **tom de cuidado** (reconhece o problema, pede desculpa, sem elogio)

## Ritmo de envio

- **Lotes de 25 avaliações.** Ao fechar um lote, o robô pausa **15 minutos** (com contagem no popup) e retoma sozinho de onde parou.
- **Intervalo entre envios:** ciclo de 10, 17, 12, 19, 13, 20, 23, 8 e 14 segundos, repetindo do início a cada lote.
- **Parar robô** interrompe até a contagem da pausa; o estado fica registrado no popup.

## Onde mexer no ritmo

Tudo em `content-reviews.js`, no topo:

```js
const SEND_DELAYS_SEC = [10, 17, 12, 19, 13, 20, 23, 8, 14];
const BATCH_SIZE = 25;
const BATCH_PAUSE_MS = 15 * 60 * 1000;
```
