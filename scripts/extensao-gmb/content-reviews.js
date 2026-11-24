/* Teixo GMB — content-reviews (v2.3)
 *
 * Correções da auditoria v2.3:
 *  - hasReviewsPanel() não dá mais falso positivo na página de busca (antes
 *    window.top roubava o claimRunner e encerrava o job antes de o iframe abrir).
 *  - Escopo isolado no painel/diálogo/iframe correto: nunca toca em elementos
 *    da busca do Google (como barra de busca textarea[name="q"] ou "Receba mais avaliações").
 *  - labelsOf() trata innerText e aria-label separadamente para não quebrar regex
 *    exatas dos botões "Responder" e "Publicar".
 *  - tryGrowList() mede altura real dos containers roláveis + total de cards com
 *    estrelas, rola até revelar "Conferir mais avaliações", clica com precisão e
 *    nunca clica em "Receba mais avaliações".
 *  - Contadores respondedCount / failedCount não acumulam em dobro.
 *  - Guard __teixoReviewsLoaded evita duplicação ao reinjetar via executeScript.
 */

(function () {
  if (window.__teixoReviewsLoaded) return;
  window.__teixoReviewsLoaded = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const MAX_ACTIONS = 400;
  const ICON_FONT = /[\uE000-\uF8FF]/g;

  /* Ritmo entre envios, em segundos. Reinicia o ciclo a cada 9 envios. */
  const SEND_DELAYS_SEC = [10, 17, 12, 19, 13, 20, 23, 8, 14];
  const BATCH_SIZE = 25;
  const BATCH_PAUSE_MS = 15 * 60 * 1000;

  let running = false;
  const attempted = new Set();

  async function waitChecking(delayMs, onTick) {
    const deadline = Date.now() + delayMs;
    while (Date.now() < deadline) {
      const { allowed } = await checkShouldRun();
      if (!allowed) return "cancelled";
      await sleep(Math.min(1000, Math.max(0, deadline - Date.now())));
      if (onTick) onTick(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }
    return "done";
  }

  /* ---------------- Comunicação ---------------- */

  function send(msg) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (res) => {
          if (chrome.runtime.lastError) return resolve(null);
          resolve(res);
        });
      } catch (e) {
        resolve(null);
      }
    });
  }

  const checkShouldRun = () => send({ type: "CHECK_MY_JOB" }).then((r) => r || { allowed: false });

  async function claimRunner() {
    const res = await send({ type: "CLAIM_REVIEWS_RUNNER" });
    return Boolean(res?.ok);
  }

  function releaseRunner() {
    send({ type: "RELEASE_REVIEWS_RUNNER" });
  }

  function update(patch, log) {
    send({ type: "UPDATE_JOB_STATUS", patch, log });
  }

  async function requestReply(payload) {
    const res = await Promise.race([
      send({ type: "GENERATE_REPLY", payload }),
      sleep(50000).then(() => null)
    ]);
    return res?.text || null;
  }

  /* ---------------- Utilitários de DOM ---------------- */

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function norm(text) {
    return String(text || "")
      .replace(ICON_FONT, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function labelsOf(el) {
    if (!el) return [];
    const raw = [
      el.innerText,
      el.getAttribute?.("aria-label"),
      el.getAttribute?.("title"),
      el.querySelector?.("[aria-label]")?.getAttribute("aria-label")
    ];
    const seen = new Set();
    const out = [];
    for (const part of raw) {
      const cleaned = norm(part);
      if (cleaned && !seen.has(cleaned)) {
        seen.add(cleaned);
        out.push(cleaned);
      }
    }
    if (!out.length && el.textContent) {
      const fallback = norm(el.textContent);
      if (fallback) out.push(fallback);
    }
    return out;
  }

  function primaryLabel(el) {
    return labelsOf(el)[0] || "";
  }

  async function clickElement(el) {
    if (!el) return false;
    try {
      el.scrollIntoView({ behavior: "auto", block: "center" });
      await sleep(150);
    } catch (e) {}
    const opts = { bubbles: true, cancelable: true, view: window };
    try {
      el.dispatchEvent(new PointerEvent("pointerdown", opts));
      el.dispatchEvent(new MouseEvent("mousedown", opts));
      el.dispatchEvent(new PointerEvent("pointerup", opts));
      el.dispatchEvent(new MouseEvent("mouseup", opts));
      el.dispatchEvent(new MouseEvent("click", opts));
    } catch (e) {
      el.click();
      return true;
    }
    el.click();
    return true;
  }

  async function waitFor(fn, timeoutMs = 8000, interval = 250) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const value = fn();
      if (value) return value;
      await sleep(interval);
    }
    return null;
  }

  function starElement(root) {
    return (
      root?.querySelector?.(
        "[aria-label*='estrela'], [aria-label*='Estrela'], [aria-label*='star'], [aria-label*='Star']"
      ) || null
    );
  }

  function countStarElements(root = document) {
    return (root || document).querySelectorAll(
      "[aria-label*='estrela'], [aria-label*='Estrela'], [aria-label*='star'], [aria-label*='Star']"
    ).length;
  }

  function getPanelRoot() {
    if (window.top !== window.self) return document;

    // Se há iframe de avaliações visível na busca (ou dentro de um diálogo), o controle pertence ao iframe.
    const reviewIframe = Array.from(
      document.querySelectorAll(
        "iframe[src*='/customers/reviews'], iframe[src*='/local/place/'], iframe[src*='business.google.com'], [role='dialog'] iframe"
      )
    ).find(isVisible);
    if (reviewIframe) return null;

    // Se abriu diálogo modal inline no window.top, restringe a busca a esse diálogo.
    const dialogs = Array.from(document.querySelectorAll("[role='dialog']")).filter(isVisible);
    const reviewsDialog = dialogs.find((dlg) => {
      if (starElement(dlg)) return true;
      const t = norm(dlg.innerText).slice(0, 4000);
      return t.includes("não respondid") || t.includes("conferir mais avalia");
    });
    if (reviewsDialog) return reviewsDialog;

    return document;
  }

  function candidates(root = document) {
    return Array.from(
      (root || document).querySelectorAll(
        "button, a, div[role='button'], span[role='button'], [role='link'], [role='tab'], [role='radio'], [role='option'], [role='menuitem'], label, g-raised-button"
      )
    ).filter(isVisible);
  }

  /* ---------------- Editor de resposta ---------------- */

  function isSearchField(el) {
    if (!el) return true;
    if (el.closest("[role='search'], form[action='/search'], header")) return true;
    if (el.getAttribute("name") === "q") return true;
    return false;
  }

  function findEditor(root = document) {
    const scope = root || document;
    const ta = Array.from(scope.querySelectorAll("textarea")).find(
      (el) => isVisible(el) && !isSearchField(el)
    );
    if (ta) return { el: ta, type: "textarea" };

    const editable = Array.from(
      scope.querySelectorAll("[contenteditable='true'], [contenteditable=''], [role='textbox']")
    ).find((el) => isVisible(el) && !isSearchField(el));
    if (editable) return { el: editable, type: "contenteditable" };

    return null;
  }

  function setEditorValue(editor, value) {
    const { el, type } = editor;

    if (type === "textarea") {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
      if (setter) setter.call(el, value);
      else el.value = value;
      el.focus();
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    el.focus();
    try {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      const ok = document.execCommand("insertText", false, value);
      if (ok && norm(el.innerText).length > 10) return true;
    } catch (e) {}

    el.textContent = value;
    el.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  /* ---------------- Cards de avaliação ---------------- */

  function cardForButton(btn) {
    let el = btn?.parentElement;
    for (let i = 0; i < 12 && el; i++) {
      if (starElement(el) && (el.innerText || "").length > 15) return el;
      el = el.parentElement;
    }
    return btn?.parentElement?.parentElement?.parentElement || btn?.parentElement;
  }

  function cardKey(card) {
    return (card?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 140);
  }

  const REPLY_LABEL = /^(responder|responder avaliação|responder avaliação do cliente|reply)$/;

  function isReplyTrigger(el) {
    const list = labelsOf(el);
    if (!list.length) return false;
    // Ignora botões de abertura de painel ("Responder às avaliações") ou de convite.
    if (list.some((l) => /responder [àa]s? avalia[çc][õo]es|receba|receber|pe[çc]a|solicit|compartilh/.test(l))) {
      return false;
    }
    return list.some((l) => REPLY_LABEL.test(l));
  }

  function findReplyButtons(root = document) {
    const all = candidates(root).filter(
      (el) => isReplyTrigger(el) && !el.disabled && el.getAttribute("aria-disabled") !== "true"
    );
    const withStars = all.filter((el) => starElement(cardForButton(el)));
    return withStars.length ? withStars : all;
  }

  /* ---------------- Painel / filtro ---------------- */

  function isReviewsIframe() {
    if (window.top === window.self) return false;
    const href = location.href.toLowerCase();
    return (
      href.includes("/customers/reviews") ||
      href.includes("/local/place/rap") ||
      href.includes("business.google.com")
    );
  }

  function hasReviewsPanel() {
    const root = getPanelRoot();
    if (!root) return false;

    if (findReplyButtons(root).length > 0) return true;
    if (findUnrepliedFilter(root)) return true;

    // No window.top sem diálogo nem filtro nem botão de resposta, não reivindica a busca do Google.
    if (window.top === window.self && root === document && location.hostname !== "business.google.com") {
      return false;
    }

    if (findEditor(root)) return true;
    if (isReviewsIframe() && countStarElements(root) > 0) return true;
    if (root !== document && starElement(root)) return true;

    return false;
  }

  function findUnrepliedFilter(root = document) {
    return (
      candidates(root).find((el) => {
        const list = labelsOf(el);
        return list.some(
          (l) =>
            l.length <= 60 &&
            /n[ãa]o respondid|sem resposta|unanswered|not answered|awaiting reply|sem avaliar/.test(l)
        );
      }) || null
    );
  }

  function filterIsActive(el) {
    return (
      el.getAttribute("aria-selected") === "true" ||
      el.getAttribute("aria-checked") === "true" ||
      el.getAttribute("aria-pressed") === "true" ||
      el.getAttribute("data-active") === "true"
    );
  }

  async function applyUnrepliedFilter(root) {
    const filter = findUnrepliedFilter(root);
    if (!filter) return false;
    if (filterIsActive(filter)) return true;

    const before = findReplyButtons(root).map((b) => cardKey(cardForButton(b))).join("|");
    await clickElement(filter);
    await sleep(1800);

    if (filterIsActive(filter)) return true;

    const after = findReplyButtons(root).map((b) => cardKey(cardForButton(b))).join("|");
    return after !== before || after.length > 0;
  }

  /* ---------------- "Conferir mais avaliações" e rolagem ---------------- */

  /* Botão que PEDE avaliações ("Receba mais avaliações", "Peça avaliações",
   * "Compartilhe para avaliar") abre o link de convite e NUNCA carrega a lista. */
  const LOAD_MORE_BLOCKED = [
    "receba",
    "receber",
    "peça",
    "peca",
    "solicit",
    "convite",
    "convidar",
    "compartilh",
    "enviar link",
    "pedir avaliaç",
    "consiga",
    "conseguir",
    "obtenha",
    "obter",
    "ganhe",
    "ganhar",
    "aument",
    "escrever",
    "fazer uma avaliaç",
    "dê sua avaliaç",
    "get more reviews",
    "ask for reviews",
    "write a review",
    "share"
  ];

  /* Só estes textos carregam mais avaliações já enviadas pelos clientes. */
  const LOAD_MORE_ALLOWED = [
    "conferir mais avaliações",
    "ver mais avaliações",
    "mostrar mais avaliações",
    "carregar mais avaliações",
    "mais avaliações",
    "mais comentários",
    "ver todas as avaliações",
    "more reviews",
    "show more reviews",
    "see all reviews"
  ];

  function hasBlockedContext(el) {
    let cur = el;
    for (let i = 0; i < 3 && cur; i++) {
      const list = labelsOf(cur);
      if (list.some((l) => l.length <= 120 && LOAD_MORE_BLOCKED.some((bad) => l.includes(bad)))) {
        return true;
      }
      cur = cur.parentElement;
    }
    return false;
  }

  function isSafeLoadMoreCandidate(el) {
    if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return false;
    const rect = el.getBoundingClientRect();
    if (rect.height > 140) return false;
    const list = labelsOf(el);
    if (!list.length) return false;
    if (list.some((l) => LOAD_MORE_BLOCKED.some((bad) => l.includes(bad)))) return false;
    if (list.some((l) => l.includes("responder"))) return false;
    if (hasBlockedContext(el)) return false;
    return true;
  }

  function findLoadMoreButton(root = document) {
    const scope = root || document;
    const interactive = Array.from(
      scope.querySelectorAll(
        "button, a, div[role='button'], span[role='button'], [role='link'], g-raised-button, [jsaction]"
      )
    ).filter(isVisible);

    // 1ª passada: rótulo conhecido (priorizando "conferir mais avaliações").
    for (const want of LOAD_MORE_ALLOWED) {
      const found = interactive.find((el) => {
        if (!isSafeLoadMoreCandidate(el)) return false;
        return labelsOf(el).some((l) => l.length <= 70 && (l === want || l.includes(want)));
      });
      if (found) return found;
    }

    // 2ª passada: elemento de texto direto dentro de um alvo clicável (caso o Google use <span> sem role).
    const textLeaves = Array.from(scope.querySelectorAll("span, div, p")).filter((el) => {
      if (!isVisible(el) || el.children.length > 2) return false;
      const t = norm(el.innerText);
      if (!t || t.length > 60) return false;
      return LOAD_MORE_ALLOWED.some((want) => t === want || t.includes(want));
    });
    for (const leaf of textLeaves) {
      const clickable =
        leaf.closest("button, a, [role='button'], [role='link'], g-raised-button") ||
        leaf.closest("[jsaction]") ||
        leaf;
      if (isVisible(clickable) && isSafeLoadMoreCandidate(clickable)) return clickable;
    }

    // 3ª passada: padrão mais/mostrar/carregar + avaliações, sempre fora da lista de bloqueio.
    return (
      interactive.find((el) => {
        if (!isSafeLoadMoreCandidate(el)) return false;
        return labelsOf(el).some(
          (l) =>
            l.length <= 60 &&
            /(conferir|mais|mostrar|carregar|ver todas|show|more|see all)/.test(l) &&
            /avalia|coment|review/.test(l)
        );
      }) || null
    );
  }

  function scrollableContainers(root = document) {
    const scope = root || document;
    const list = [];
    if (scope !== document && isVisible(scope)) list.push(scope);
    list.push(...Array.from(scope.querySelectorAll("div, main, section")).filter(isVisible));

    return list
      .filter((el) => {
        const style = getComputedStyle(el);
        return /auto|scroll|overlay/.test(style.overflowY) && el.scrollHeight > el.clientHeight + 40;
      })
      .sort((a, b) => {
        // Prioriza containers que contêm cards de avaliação ou o botão "Conferir mais avaliações".
        const aHas = starElement(a) ? 1 : 0;
        const bHas = starElement(b) ? 1 : 0;
        if (aHas !== bHas) return bHas - aHas;
        return b.scrollHeight - a.scrollHeight;
      });
  }

  function maxScrollHeight(root = document) {
    let max = document.scrollingElement?.scrollHeight || document.body?.scrollHeight || 0;
    for (const c of scrollableContainers(root)) {
      if (c.scrollHeight > max) max = c.scrollHeight;
    }
    return max;
  }

  async function scrollAllToBottom(root = document) {
    for (const container of scrollableContainers(root)) {
      container.scrollTop = container.scrollHeight;
      await sleep(250);
    }
    if (root === document && document.scrollingElement) {
      document.scrollingElement.scrollTop = document.scrollingElement.scrollHeight;
      await sleep(300);
    }
  }

  async function tryGrowList(root = document) {
    const beforeReply = findReplyButtons(root).length;
    const beforeStars = countStarElements(root);
    const beforeMaxH = maxScrollHeight(root);

    await scrollAllToBottom(root);
    await sleep(400);

    const more = findLoadMoreButton(root);
    if (more) {
      const label = primaryLabel(more);
      await clickElement(more);
      update({}, `Clicado em "${label}" para carregar mais avaliações.`);

      // Aguarda até 4s pela chegada de novos cards ou aumento da altura rolável.
      const deadline = Date.now() + 4000;
      await sleep(1400);
      while (Date.now() < deadline) {
        const nowReply = findReplyButtons(root).length;
        const nowStars = countStarElements(root);
        const nowMaxH = maxScrollHeight(root);
        if (
          nowReply > beforeReply ||
          nowStars > beforeStars ||
          Math.abs(nowMaxH - beforeMaxH) > 40
        ) {
          break;
        }
        await sleep(400);
      }
      await scrollAllToBottom(root);
    } else {
      await sleep(1200);
    }

    const afterReply = findReplyButtons(root).length;
    const afterStars = countStarElements(root);
    const afterMaxH = maxScrollHeight(root);

    return (
      afterReply > beforeReply ||
      afterStars > beforeStars ||
      Math.abs(afterMaxH - beforeMaxH) > 40
    );
  }

  /* ---------------- Extração ---------------- */

  function parseStars(card) {
    const el = card && starElement(card);
    if (!el) return null;
    const label = el.getAttribute("aria-label") || "";
    const match = label.match(/(\d)\s*(?:de\s*5|out of|estrela|\/\s*5)/i) || label.match(/(\d)/);
    if (!match) return null;
    const value = parseInt(match[1], 10);
    return value >= 1 && value <= 5 ? value : null;
  }

  function parseAuthor(lines, businessWords, card) {
    const blocked = /^(local guide|guia local|novo|new)$/i;

    const byLine = lines.find((line) => {
      const lower = line.toLowerCase();
      if (lower.includes("open_in_new")) return true;
      if (line.length < 2 || line.length > 45) return false;
      if (blocked.test(line.trim())) return false;
      if (
        lower.includes("star") ||
        lower.includes("estrela") ||
        lower.includes("responder") ||
        lower.includes("cancelar") ||
        lower.includes("exibir avaliação") ||
        lower.includes("avaliaç") ||
        lower.includes("comentário") ||
        lower.includes("fotos") ||
        /^\d+$/.test(line) ||
        /\b(há|ontem|hoje|semana|mês|mes|ano)\b/.test(lower)
      ) {
        return false;
      }
      if (businessWords.some((w) => lower.includes(w))) return false;
      return true;
    });

    if (byLine) return byLine.replace(/open_in_new/gi, "").trim();

    const link = card?.querySelector("a[href*='/maps/contrib/'], a[data-href*='/maps/contrib/']");
    const linkText = (link?.innerText || "").trim();
    if (linkText && linkText.length <= 45) return linkText;

    return "";
  }

  function extractReview(anchor, businessName, fallbackCard = null) {
    let card = cardForButton(anchor);
    if (!starElement(card) && fallbackCard) card = fallbackCard;

    const businessWords = norm(businessName).split(/\s+/).filter((w) => w.length > 2);
    const lines = (card?.innerText || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const author = parseAuthor(lines, businessWords, card) || "Cliente";
    const stars = parseStars(card);

    const skip = (line) => {
      const lower = line.toLowerCase();
      if (line === author) return true;
      if (line.length < 6) return true;
      if (lower.includes("open_in_new")) return true;
      return (
        lower.includes("avaliações •") ||
        lower.includes("avaliação •") ||
        lower.includes("responder") ||
        lower.includes("cancelar") ||
        lower.includes("exibir avaliação") ||
        lower.startsWith("há ") ||
        lower === "novo" ||
        /^local guide\b/i.test(line)
      );
    };

    return {
      author,
      stars,
      comment: lines.filter((l) => !skip(l)).join(" ").slice(0, 400),
      card,
      key: cardKey(card)
    };
  }

  /* ---------------- Envio ---------------- */

  const SUBMIT_LABEL = /^(publicar|enviar|responder|publicar resposta|enviar resposta|post|send|submit|reply)$/;
  const CANCEL_LABEL = /^(cancelar|cancel)$/;

  function findActionButtons(editor) {
    const dialog = editor.el.closest("[role='dialog'], form, [role='presentation']") || editor.el;
    const scopes = [dialog];

    let parent = dialog;
    for (let i = 0; i < 8 && parent?.parentElement; i++) {
      parent = parent.parentElement;
      // Para antes de subir para a lista inteira (evita clicar no "Responder" do card seguinte).
      if (countStarElements(parent) > 1 && parent.getAttribute("role") !== "dialog") break;
      scopes.push(parent);
    }

    const isSubmit = (b) =>
      labelsOf(b).some((l) => SUBMIT_LABEL.test(l)) &&
      Boolean(editor.el.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

    const isCancel = (b) => labelsOf(b).some((l) => CANCEL_LABEL.test(l));

    for (const scope of scopes) {
      const buttons = Array.from(scope.querySelectorAll("button, div[role='button']")).filter(
        (b) => isVisible(b) && !b.disabled && b.getAttribute("aria-disabled") !== "true"
      );
      if (!buttons.length) continue;

      const cancel = buttons.find(isCancel) || null;
      const submit = buttons.find(isSubmit) || null;
      if (submit && cancel) return { submit, cancel };
    }

    for (const scope of scopes) {
      const buttons = Array.from(scope.querySelectorAll("button, div[role='button']")).filter(
        (b) => isVisible(b) && !b.disabled && b.getAttribute("aria-disabled") !== "true"
      );
      const submit = buttons.find(isSubmit);
      if (submit) return { submit, cancel: buttons.find(isCancel) || null };
    }

    return {
      submit: null,
      cancel:
        Array.from(document.querySelectorAll("button, div[role='button']"))
          .filter(isVisible)
          .find(isCancel) || null
    };
  }

  /* ---------------- Loop principal ---------------- */

  function diagnose() {
    const root = getPanelRoot() || document;
    const replyBtns = findReplyButtons(root).length;
    const textareas = Array.from(root.querySelectorAll("textarea")).filter(
      (el) => isVisible(el) && !isSearchField(el)
    ).length;
    const editables = Array.from(
      root.querySelectorAll("[contenteditable='true']")
    ).filter((el) => isVisible(el) && !isSearchField(el)).length;
    const chips = candidates(root)
      .map(primaryLabel)
      .filter((l) => l && l.length < 40 && /respond|avalia|todas/.test(l))
      .slice(0, 6);
    const hasMore = Boolean(findLoadMoreButton(root));
    return `diagnóstico — respond-btn:${replyBtns} textarea:${textareas} editável:${editables} mais:${hasMore} filtros:[${chips.join(" / ")}]`;
  }

  async function processReviewsLoop() {
    if (running) return;
    running = true;
    attempted.clear();
    let claimed = false;

    try {
      let panelReady = false;
      let missingJobRounds = 0;

      for (let i = 0; i < 90; i++) {
        const state = await checkShouldRun();

        if (!state.allowed && state.state === "no_job") {
          missingJobRounds++;
          if (missingJobRounds > 40) break;
          await sleep(500);
          continue;
        }
        if (!state.allowed) return;

        if (hasReviewsPanel()) {
          panelReady = true;
          break;
        }
        await sleep(1000);
      }

      if (!panelReady) {
        update(
          { statusText: "Não achei avaliações nesta página." },
          `Painel não apareceu. ${diagnose()}`
        );
        return;
      }

      if (!(await claimRunner())) return;
      claimed = true;

      const initState = await checkShouldRun();
      if (!initState.allowed || !initState.job) return;

      const baseResponded = initState.job.respondedCount || 0;
      const baseFailed = initState.job.failedCount || 0;

      let responded = 0;
      let failed = 0;
      let dryRounds = 0;
      let sentInBatch = 0;
      let delayIndex = 0;
      let lastClickedCard = null;
      let lastClickedClosedKey = "";

      let root = getPanelRoot() || document;

      update({ statusText: "Painel detectado. Aplicando filtro..." }, `Painel detectado. ${diagnose()}`);

      const filtered = await applyUnrepliedFilter(root);
      update(
        { statusText: filtered ? "Filtro aplicado. Respondendo..." : "Filtro não encontrado; seguindo na lista completa." },
        filtered ? 'Filtro "Não respondido" aplicado.' : 'Chip "Não respondido" não encontrado; usando a lista inteira.'
      );
      await sleep(1200);

      for (let action = 0; action < MAX_ACTIONS; action++) {
        const state = await checkShouldRun();
        if (!state.allowed) return;
        const job = state.job;

        root = getPanelRoot() || document;
        let editor = findEditor(root);
        let current = null;

        if (editor) {
          current = extractReview(editor.el, job.businessName, lastClickedCard);
        } else {
          const buttons = findReplyButtons(root).filter((btn) => {
            const card = cardForButton(btn);
            if (card?.dataset?.teixoAttempted === "1") return false;
            return !attempted.has(cardKey(card));
          });

          if (!buttons.length) {
            const grew = await tryGrowList(root);
            dryRounds = grew ? 0 : dryRounds + 1;

            if (dryRounds === 1) {
              update({ statusText: "Carregando mais avaliações..." }, "Rolando a lista para buscar mais avaliações.");
            }
            if (dryRounds >= 4) {
              const totalResponded = baseResponded + responded;
              const totalFailed = baseFailed + failed;
              update(
                {
                  active: false,
                  runnerFrameId: null,
                  respondedCount: totalResponded,
                  failedCount: totalFailed,
                  statusText:
                    totalResponded > 0 || totalFailed > 0
                      ? `Concluído: ${totalResponded} respondida(s), ${totalFailed} com falha.`
                      : `Nenhuma avaliação pendente encontrada. ${diagnose()}`
                },
                `Fim do ciclo: ${totalResponded} respondida(s), ${totalFailed} falha(s).`
              );
              return;
            }
            continue;
          }

          dryRounds = 0;
          const target = buttons[0];
          lastClickedCard = cardForButton(target);
          lastClickedClosedKey = cardKey(lastClickedCard);
          await clickElement(target);
          await sleep(700);

          editor = await waitFor(() => findEditor(getPanelRoot() || document), 7000);
          if (!editor) {
            if (lastClickedClosedKey) attempted.add(lastClickedClosedKey);
            if (lastClickedCard?.dataset) lastClickedCard.dataset.teixoAttempted = "1";
            failed++;
            update({ failedCount: baseFailed + failed }, "Campo de resposta não abriu; seguindo para a próxima.");
            await sleep(1200);
            continue;
          }
          current = extractReview(editor.el, job.businessName, lastClickedCard);
        }

        const { author, stars, comment, card, key } = current;
        const cardAlreadyAttempted =
          card?.dataset?.teixoAttempted === "1" ||
          (lastClickedCard?.dataset?.teixoAttempted === "1" && card === lastClickedCard);
        if (!key || attempted.has(key) || cardAlreadyAttempted) {
          if (lastClickedClosedKey) attempted.add(lastClickedClosedKey);
          if (card?.dataset) card.dataset.teixoAttempted = "1";
          const { cancel } = findActionButtons(editor);
          if (cancel) await clickElement(cancel);
          await sleep(800);
          continue;
        }
        attempted.add(key);
        if (lastClickedClosedKey) attempted.add(lastClickedClosedKey);
        if (card?.dataset) card.dataset.teixoAttempted = "1";
        if (lastClickedCard?.dataset) lastClickedCard.dataset.teixoAttempted = "1";

        const unknownStar = stars === null;
        const lowStar = !unknownStar && stars <= 3;

        if (lowStar && job.replyLowStars === false) {
          const { cancel } = findActionButtons(editor);
          if (cancel) await clickElement(cancel);
          update(
            { statusText: `Pulada avaliação de ${author} (${stars}★).` },
            `Pulada por nota baixa: ${author} (${stars}★)`
          );
          await sleep(1200);
          continue;
        }

        const starLabel = unknownStar ? "nota não lida" : `${stars}★`;
        update({ statusText: `Gerando resposta para ${author} (${starLabel})...` });

        const reply = await requestReply({
          author,
          stars: stars ?? 5,
          starKnown: !unknownStar,
          comment,
          index: baseResponded + responded,
          businessName: job.businessName
        });

        if (!reply) {
          failed++;
          const { cancel } = findActionButtons(editor);
          if (cancel) await clickElement(cancel);
          update(
            { failedCount: baseFailed + failed, statusText: `Sem resposta gerada para ${author}; seguindo.` },
            `Falha ao gerar texto para ${author}.`
          );
          await sleep(1200);
          continue;
        }

        if (!editor.el.isConnected) editor = findEditor(getPanelRoot() || document);
        if (!editor) {
          failed++;
          update({ failedCount: baseFailed + failed }, "Editor sumiu antes de enviar; seguindo.");
          continue;
        }

        setEditorValue(editor, reply);
        await sleep(900);

        const { submit, cancel } = findActionButtons(editor);
        if (!submit) {
          failed++;
          if (cancel) await clickElement(cancel);
          update(
            { failedCount: baseFailed + failed, statusText: `Botão de envio indisponível para ${author}; seguindo.` },
            `⚠️ Sem botão de envio para ${author}. ${diagnose()}`
          );
          await sleep(1200);
          continue;
        }

        await clickElement(submit);

        const closed = await waitFor(() => !editor.el.isConnected || !isVisible(editor.el), 10000, 500);

        if (closed) {
          responded++;
          sentInBatch++;
          update(
            {
              respondedCount: baseResponded + responded,
              statusText: `Respondida ${baseResponded + responded}: ${author} (${starLabel})`
            },
            `✅ ${author} (${starLabel}): "${reply}"`
          );
        } else {
          failed++;
          update(
            { failedCount: baseFailed + failed },
            `Aviso: envio de ${author} não confirmado (o editor continuou aberto).`
          );
        }

        if (sentInBatch >= BATCH_SIZE) {
          sentInBatch = 0;
          delayIndex = 0;
          const waitMinutes = BATCH_PAUSE_MS / 60000;
          update(
            { statusText: `Lote de ${BATCH_SIZE} concluído. Pausa de ${waitMinutes} min...` },
            `⏸ Lote de ${BATCH_SIZE} fechado. Pausando ${waitMinutes} minutos.`
          );

          const outcome = await waitChecking(BATCH_PAUSE_MS, (remaining) => {
            const m = Math.floor(remaining / 60);
            const s = String(remaining % 60).padStart(2, "0");
            update({ statusText: `Lote de ${BATCH_SIZE} concluído. Retomo em ${m}:${s}.` });
          });

          if (outcome === "cancelled") return;
          update({ statusText: "Retomando o próximo lote..." }, "▶️ Pausa encerrada, retomando.");
          continue;
        }

        const delaySec = SEND_DELAYS_SEC[delayIndex % SEND_DELAYS_SEC.length];
        delayIndex++;
        update({ statusText: `Aguardando ${delaySec}s para o próximo envio...` });

        const waited = await waitChecking(delaySec * 1000, (remaining) => {
          update({ statusText: `Aguardando ${remaining}s para o próximo envio...` });
        });
        if (waited === "cancelled") return;
      }

      const finalState = await checkShouldRun();
      if (finalState.allowed && finalState.job) {
        update(
          {
            active: false,
            runnerFrameId: null,
            respondedCount: baseResponded + responded,
            failedCount: baseFailed + failed,
            statusText: `Ciclo encerrado: ${baseResponded + responded} respondida(s), ${baseFailed + failed} falha(s).`
          },
          "Ciclo encerrado pelo limite de ações."
        );
      }
    } catch (err) {
      update({ statusText: `Erro: ${err?.message || err}` }, `Erro no loop: ${err?.message || err}`);
    } finally {
      if (claimed) releaseRunner();
      running = false;
    }
  }

  window.addEventListener("pagehide", () => {
    if (running) releaseRunner();
  });

  if (!window.__teixoReviewsListenerAdded) {
    window.__teixoReviewsListenerAdded = true;
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "RUN_NOW") setTimeout(processReviewsLoop, 400);
    });
  }

  setTimeout(processReviewsLoop, 1200);

  setInterval(() => {
    if (running) return;
    checkShouldRun().then((state) => {
      if (state.allowed && hasReviewsPanel()) processReviewsLoop();
    });
  }, 10000);
})();
