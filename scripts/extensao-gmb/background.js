/* Teixo GMB — background (service worker)
 *
 * Correções em relação à v1.1:
 *  - Grava o job ANTES de abrir a aba (fim da corrida que fazia o robô desistir).
 *  - Estado do job é mutado num único lugar, serializado por fila (fim do lost update).
 *  - Só o frame que ganhou o claim pode escrever status (fim do frame que sobrescreve).
 *  - Geração de resposta tem timeout e respeita a nota (fim do texto alegre em 1★).
 */

const JOB_IDLE_MS = 30 * 60 * 1000; // sem sinal do robô por 30 min = job morto
const GEMINI_TIMEOUT_MS = 20000;
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

let stateQueue = Promise.resolve();

/* Toda leitura+escrita do job passa por aqui, uma de cada vez. */
function serialize(task) {
  const next = stateQueue.then(task, task);
  stateQueue = next.catch(() => {});
  return next;
}

function getJob() {
  return chrome.storage.local.get("job").then((r) => r.job || null);
}

function mutateJob(mutator) {
  return serialize(async () => {
    const job = await getJob();
    if (!job) return null;
    const draft = JSON.parse(JSON.stringify(job));
    const returned = mutator(draft);
    const result = returned === undefined ? draft : returned;
    if (result) await chrome.storage.local.set({ job: result });
    return result;
  });
}

function isJobLive(job) {
  if (!job || !job.active) return false;
  // A pausa entre lotes é longa e legítima: o que expira o job é ficar sem sinal,
  // não a duração total. Cada sinal do robô atualiza lastSeenAt.
  if (!job.lastSeenAt) return true;
  return Date.now() - job.lastSeenAt < JOB_IDLE_MS;
}

function touchJob(job) {
  job.lastSeenAt = Date.now();
}

function pushLog(job, line) {
  if (!line) return;
  job.logs = Array.isArray(job.logs) ? job.logs.slice(-24) : [];
  job.logs.push(line);
}

/* ---------- Conta Google ---------- */

function resolveAuthUserIndex(input) {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return trimmed;

  const clean = trimmed.toLowerCase();
  if (clean.includes("padrao") || clean.includes("cesta") || clean.includes("margarida")) return "6";
  if (clean.includes("rhenanteixeira.rj")) return "1";
  if (clean.includes("rhenanteixeira06")) return "0";
  return null;
}

/* ---------- Texto de reserva (sem Gemini) ---------- */

function firstNameOf(author, businessName) {
  let firstName = (author || "Cliente").split(" ")[0].replace(/[^a-zA-ZÀ-ÿ]/g, "");
  const stopWords = (businessName || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (!firstName || stopWords.includes(firstName.toLowerCase())) return "Amigo(a)";
  return firstName;
}

function getSmartFallbackReply({ author, stars, starKnown, index, businessName }) {
  const firstName = firstNameOf(author, businessName);
  const rating = Number(stars) || 5;
  const known = starKnown !== false;
  const bn = (businessName || "").toLowerCase();

  let sector = "geral";
  if (bn.match(/cesta|alimento|hortifruti|mercado|distribuidora|mercearia|armazem|armazém/)) {
    sector = "cesta";
  } else if (bn.match(/pizza|pizzaria|hamburg|burger|lanche|pastel|acai|açaí|acaiteria|restaurante|gastronomia|doceria|confeitaria|sorvet/)) {
    sector = "alimentacao";
  } else if (bn.match(/piscina|sitio|sítio|chacara|chácara|festa|espaco|espaço|salao|salão|buffet|hostel/)) {
    sector = "espaco";
  }

  const elogio = {
    geral: [
      ["Nosso compromisso diário é oferecer um atendimento atencioso e um serviço bem feito.", "Trabalhamos com dedicação todos os dias para entregar o melhor resultado possível."],
      ["Ficamos contentes em saber que você teve uma ótima experiência conosco.", "É muito bom receber seu reconhecimento pelo nosso trabalho."]
    ],
    alimentacao: [
      ["Preparamos cada pedido com ingredientes selecionados para chegar quentinho e saboroso até você.", "Nosso compromisso diário é entregar comida bem feita e caprichada."],
      ["É muito bom saber que você gostou do sabor e do nosso atendimento.", "Ficamos contentes que você aprovou a qualidade dos nossos pratos."]
    ],
    cesta: [
      ["Separamos cada produto e cesta com cuidado e qualidade para atender bem a sua família.", "Nosso foco diário é entregar produtos frescos, de boas marcas e com ótimo custo-benefício."],
      ["Ficamos felizes em atender você com agilidade e dedicação em cada entrega.", "Trabalhamos todos os dias para levar bons mantimentos e atendimento atencioso até sua casa."]
    ],
    espaco: [
      ["Cuidamos com dedicação de cada detalhe do espaço para que seu momento aqui seja especial.", "Nosso compromisso é oferecer lazer, cuidado e bom atendimento para você e seus convidados."],
      ["É ótimo ver nossos clientes aproveitando toda a estrutura com conforto e tranquilidade.", "Preparamos o ambiente com atenção para receber bem famílias e amigos."]
    ]
  };

  const cuidado = {
    geral: [
      "Sentimos muito que sua experiência não tenha sido como esperávamos. Já estamos olhando o que aconteceu para corrigir.",
      "Obrigado por nos contar o que não funcionou. Vamos usar o seu retorno para melhorar o atendimento."
    ],
    alimentacao: [
      "Sentimos muito pelo problema com o seu pedido. Já estamos revendo o preparo e a entrega para não repetir.",
      "Obrigado por nos contar. Vamos cuidar do preparo e do envio para que o pedido chegue como deveria."
    ],
    cesta: [
      "Sentimos muito pelo ocorrido com a sua entrega. Já estamos revendo a separação e o envio para não repetir.",
      "Obrigado por nos avisar. Vamos corrigir os itens e a entrega para que na próxima tudo chegue certo."
    ],
    espaco: [
      "Sentimos muito que algo não tenha saído como deveria. Já estamos revendo os detalhes do espaço e do atendimento.",
      "Obrigado por nos contar. Vamos corrigir o que apontou para receber você melhor na próxima visita."
    ]
  };

  const fechamento = {
    elogio: ["Conte sempre conosco! 🙏", "Será sempre um prazer atender você! 😊", "Agradecemos a confiança! 👏", "Volte sempre! 🤩"],
    cuidado: ["Conte conosco para resolver! 🙏", "Queremos ter a chance de acertar com você. 😔", "Agradecemos a sinceridade. 🙏", "Vamos trabalhar para merecer sua confiança de volta! 💪"]
  };

  const idx = Math.abs(Number(index) || 0);
  const isPraise = known && rating >= 4;

  // Nota desconhecida: agradecimento neutro. Nunca elogia às cegas.
  const greeting = !known
    ? [`Muito obrigado pela sua avaliação, ${firstName}!`, `Agradecemos por avaliar o nosso trabalho, ${firstName}!`][idx % 2]
    : isPraise
      ? [`Muito obrigado pela avaliação, ${firstName}!`, `Que bom receber seu retorno, ${firstName}!`, `Agradecemos de coração pela avaliação, ${firstName}!`][idx % 3]
      : [`Obrigado por dividir sua experiência, ${firstName}.`, `Agradecemos por nos contar, ${firstName}.`, `${firstName}, obrigado pela sinceridade.`][idx % 3];

  if (!known) {
    const neutro = [
      `Seguimos trabalhando para oferecer um atendimento bem feito em cada pedido.`,
      `Cada retorno nos ajuda a melhorar o serviço que entregamos.`
    ];
    const fecho = ["Conte sempre conosco! 🙏", "Será sempre um prazer atender você! 😊"][idx % 2];
    return `${greeting} ${neutro[idx % neutro.length]} ${fecho}`;
  }

  const pool = isPraise ? elogio[sector].flat() : cuidado[sector];
  const body = pool[idx % pool.length];
  const close = (isPraise ? fechamento.elogio : fechamento.cuidado)[idx % 4];

  return `${greeting} ${body} ${close}`;
}

/* ---------- Gemini ---------- */

function buildPrompt({ author, stars, starKnown, comment, businessName }) {
  const firstName = firstNameOf(author, businessName);
  const rating = Number(stars) || 5;
  const known = starKnown !== false;
  const commentLine = comment
    ? `Comentário do cliente: "${comment}"`
    : "O cliente deu apenas a nota em estrelas, sem texto.";

  const tone = !known
    ? `A nota em estrelas não pôde ser lida. Agradeça de forma neutra, sem afirmar que o cliente gostou nem que houve problema.`
    : rating >= 4
      ? `O cliente ficou satisfeito (${rating} estrelas). Agradeça e reforce o cuidado com o que foi elogiado.`
      : `O cliente ficou insatisfeito (${rating} estrelas). NUNCA diga que ficou feliz ou que ele "gostou". Reconheça o problema pelo que ele descreveu, peça desculpa de forma sóbria e diga que vai corrigir. Não invente fatos nem ofereça desconto.`;

  return `Você responde pelo estabelecimento "${businessName}" no Google Meu Negócio.
Escreva uma resposta curta, humana e natural em português do Brasil para a avaliação de ${firstName}.
${tone}
${commentLine}
Regras:
1. Cite o primeiro nome (${firstName}) e agradeça de forma natural.
2. Escreva 1 frase concreta ligando ao que foi citado na avaliação.
3. Máximo de 2 frases no total.
4. No máximo 1 emoji no final.
5. Nunca use clichês como "sua opinião é muito importante", "estamos sempre à disposição" ou "agradecemos a preferência".
6. Nunca prometa prazos, reembolsos ou descontos.
Responda apenas com o texto final da resposta.`;
}

async function callGemini(model, prompt, key) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 220, temperature: 0.85 }
        })
      }
    );
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { error: `HTTP ${res.status} ${detail.slice(0, 180)}` };
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return { error: "Resposta vazia do Gemini." };
    return { text: text.trim() };
  } catch (e) {
    return { error: e?.name === "AbortError" ? "Gemini demorou demais (20s)." : String(e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}

async function generateReply(payload, geminiKey, tabId) {
  if (geminiKey) {
    const prompt = buildPrompt(payload);
    const errors = [];
    for (const model of GEMINI_MODELS) {
      const { text, error } = await callGemini(model, prompt, geminiKey);
      if (text) return text;
      errors.push(`${model}: ${error}`);
    }
    await logToTab(tabId, `Gemini falhou (${errors.join(" | ")}). Usando texto de reserva.`);
  }
  return getSmartFallbackReply(payload);
}

async function logToTab(tabId, log) {
  if (!tabId) return;
  await mutateJob((job) => {
    if (job.tabId !== tabId || !job.active) return null;
    pushLog(job, log);
  });
}

/* ---------- Message router ---------- */

function newJobBase(payload) {
  return {
    active: true,
    tabId: null,
    runnerFrameId: null,
    businessName: payload.businessName,
    authInput: payload.authInput || "",
    replyLowStars: payload.replyLowStars !== false,
    respondedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    startedAt: Date.now(),
    lastSeenAt: Date.now(),
    statusText: "Iniciando...",
    logs: []
  };
}

async function startNewTab(payload) {
  const job = newJobBase(payload);
  await serialize(() =>
    chrome.storage.local.set({ job: null, geminiKey: payload.geminiKey || "" })
  );

  const authIdx = resolveAuthUserIndex(payload.authInput);
  const authParam = authIdx !== null ? `&authuser=${authIdx}` : "";
  const url = `https://www.google.com/search?q=${encodeURIComponent(payload.businessName)}${authParam}`;

  const tab = await chrome.tabs.create({ url, active: true });

  // Grava o job INTEIRO de uma vez, já com o tabId. Nunca passar por mutateJob aqui:
  // o job acabou de ser zerado, então mutateJob leria null e desistiria sem gravar.
  job.tabId = tab.id;
  job.statusText = "Aba aberta. Procurando o painel de avaliações...";
  pushLog(job, `Aba aberta para "${payload.businessName}".`);

  await serialize(() => chrome.storage.local.set({ job }));
  return { ok: true, tabId: tab.id };
}

async function startCurrentTab(payload) {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) return { ok: false, error: "Nenhuma aba ativa encontrada." };

  const job = newJobBase(payload);
  job.tabId = activeTab.id;
  job.statusText = "Iniciando na aba atual...";
  pushLog(job, `Executando na aba atual para "${payload.businessName}".`);

  await serialize(() => chrome.storage.local.set({ job, geminiKey: payload.geminiKey || "" }));

  // Cobre abas que já estavam abertas antes de recarregar a extensão.
  try {
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id, allFrames: true },
      files: ["content-search.js", "content-reviews.js"]
    });
  } catch (e) {
    // Falha esperada em páginas protegidas (chrome://, Web Store); o RUN_NOW abaixo cobre o resto.
  }

  try {
    await chrome.tabs.sendMessage(activeTab.id, { type: "RUN_NOW" });
  } catch (e) {
    await mutateJob((current) => {
      current.active = false;
      current.statusText = "Não foi possível falar com esta página. Recarregue-a e tente de novo.";
      pushLog(current, "sendMessage falhou: a página não tem o content script ativo.");
    });
    return { ok: false, error: "Recarregue a página e tente de novo." };
  }

  return { ok: true, tabId: activeTab.id };
}

async function stopJob() {
  return mutateJob((job) => {
    job.active = false;
    job.runnerFrameId = null;
    job.statusText = "Interrompido.";
    pushLog(job, "Robô interrompido pelo usuário.");
  });
}

/* state diz ao content script POR QUE foi recusado:
 *  - "no_job":  ainda não existe job (aba recém-aberta) -> pode esperar
 *  - "stopped": o usuário parou / expirou        -> desistir de vez
 *  - "other_tab": job é de outra aba             -> desistir de vez
 *  - "ok":      pode rodar
 */
async function checkMyJob(senderTabId) {
  return serialize(async () => {
    const job = await getJob();
    if (!job) return { allowed: false, state: "no_job" };
    if (!isJobLive(job)) {
      if (job.active) {
        const expired = JSON.parse(JSON.stringify(job));
        expired.active = false;
        expired.runnerFrameId = null;
        expired.statusText = "Parado por inatividade (30 min). Inicie de novo.";
        pushLog(expired, "Job expirado por inatividade.");
        await chrome.storage.local.set({ job: expired });
      }
      return { allowed: false, state: "stopped" };
    }
    if (!senderTabId || job.tabId !== senderTabId) return { allowed: false, state: "other_tab" };

    const seen = JSON.parse(JSON.stringify(job));
    touchJob(seen);
    await chrome.storage.local.set({ job: seen });
    return { allowed: true, job: seen };
  });
}

async function claimRunner(senderTabId, frameId) {
  return mutateJob((job) => {
    if (!isJobLive(job) || senderTabId !== job.tabId) return null;
    const holder = job.runnerFrameId;
    if (holder === null || holder === undefined || holder === frameId) {
      job.runnerFrameId = frameId;
      touchJob(job);
      return job;
    }
    return null;
  }).then((claimed) => ({ ok: Boolean(claimed), frameId: claimed ? frameId : null }));
}

async function releaseRunner(senderTabId, frameId) {
  return mutateJob((job) => {
    if (senderTabId !== job.tabId) return null;
    if (job.runnerFrameId === frameId) {
      job.runnerFrameId = null;
      touchJob(job);
      return job;
    }
    return null;
  });
}

const handlers = {
  START_NEW_TAB: (msg) => startNewTab(msg.payload),
  START_CURRENT_TAB: (msg) => startCurrentTab(msg.payload),
  STOP_JOB: () => stopJob(),

  CHECK_MY_JOB: (msg, sender) => checkMyJob(sender.tab?.id),

  CLAIM_REVIEWS_RUNNER: (msg, sender) => claimRunner(sender.tab?.id, sender.frameId ?? 0),

  RELEASE_REVIEWS_RUNNER: (msg, sender) => releaseRunner(sender.tab?.id, sender.frameId ?? 0),

  UPDATE_SEARCH_STATUS: (msg, sender) =>
    mutateJob((job) => {
      const senderTab = sender.tab?.id;
      const senderFrame = sender.frameId ?? 0;
      if (senderTab !== job.tabId || !job.active) return null;
      // Só escreve enquanto nenhum frame de avaliações assumiu o controle.
      if (senderFrame !== 0 || job.runnerFrameId !== null) return null;
      Object.assign(job, msg.patch || {});
      touchJob(job);
      pushLog(job, msg.log);
    }),

  UPDATE_JOB_STATUS: (msg, sender) =>
    mutateJob((job) => {
      const senderTab = sender.tab?.id;
      const senderFrame = sender.frameId ?? 0;
      const isRunner = job.runnerFrameId !== null && senderFrame === job.runnerFrameId;
      const isOwnerTab = senderTab === job.tabId;
      // Só o frame dono do claim escreve o job; os outros frames ficam de fora.
      if (!isOwnerTab || !isRunner) return null;
      Object.assign(job, msg.patch || {});
      touchJob(job);
      pushLog(job, msg.log);
    }),

  GENERATE_REPLY: async (msg, sender) => {
    const { geminiKey } = await chrome.storage.local.get("geminiKey");
    const text = await generateReply(msg.payload, geminiKey, sender.tab?.id);
    return { text };
  }
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = handlers[message?.type];
  if (!handler) return false;

  handler(message, sender)
    .then((result) => sendResponse(result))
    .catch((err) => sendResponse({ ok: false, error: String(err?.message || err) }));

  return true;
});
