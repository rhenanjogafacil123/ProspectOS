/* Teixo GMB — content-search (v2.3)
 *
 * Abre o painel de avaliações a partir da busca do Google / página do perfil.
 *
 * Correções da auditoria v2.3:
 *  - reviewsPanelExists() não dá mais falso positivo na própria página de busca
 *    (antes checava "responder às avaliações" no body inteiro, parando antes de clicar).
 *  - Logs da fase de busca usam UPDATE_SEARCH_STATUS (antes eram descartados
 *    porque runnerFrameId ainda é null).
 *  - Suporta botões com aria-label, tiles "Avaliações" e links "X avaliações no Google",
 *    bloqueando rigorosamente "Receba mais avaliações" / "Peça avaliações".
 *  - Após clicar, confirma se o painel realmente abriu antes de encerrar.
 *  - Guard __teixoSearchLoaded evita duplicar timers quando reinjetado via executeScript.
 */

(function () {
  if (window.top !== window.self) return;
  if (window.__teixoSearchLoaded) return;
  window.__teixoSearchLoaded = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const MAX_ATTEMPTS = 60;

  let running = false;
  let lastAttemptAt = 0;

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

  function update(patch, log) {
    send({ type: "UPDATE_SEARCH_STATUS", patch, log });
  }

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function norm(text) {
    return String(text || "")
      .replace(/[\uE000-\uF8FF]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function labelsOf(el) {
    const raw = [
      el?.innerText,
      el?.getAttribute?.("aria-label"),
      el?.getAttribute?.("title"),
      el?.querySelector?.("[aria-label]")?.getAttribute("aria-label")
    ];
    return raw.map(norm).filter(Boolean);
  }

  function primaryLabel(el) {
    return labelsOf(el)[0] || "";
  }

  async function clickElement(el) {
    if (!el) return;
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
      return;
    }
    el.click();
  }

  function hasReviewsIframe() {
    const iframes = Array.from(
      document.querySelectorAll(
        "iframe[src*='/customers/reviews'], iframe[src*='/local/place/'], iframe[src*='business.google.com'], [role='dialog'] iframe"
      )
    );
    return iframes.some(isVisible);
  }

  function hasOpenReviewsDialog() {
    const dialogs = Array.from(document.querySelectorAll("[role='dialog']")).filter(isVisible);
    return dialogs.some((dlg) => {
      const hasStars = Boolean(
        dlg.querySelector("[aria-label*='estrela'], [aria-label*='Estrela'], [aria-label*='star'], [aria-label*='Star']")
      );
      if (!hasStars) return false;
      const text = norm(dlg.innerText).slice(0, 6000);
      return (
        text.includes("não respondid") ||
        text.includes("conferir mais avalia") ||
        text.includes("responder") ||
        text.includes("mais relevantes") ||
        text.includes("mais recentes")
      );
    });
  }

  function reviewsPanelExists() {
    if (hasReviewsIframe()) return true;
    if (hasOpenReviewsDialog()) return true;
    if (location.hostname === "business.google.com" && location.pathname.includes("review")) {
      return Boolean(
        document.querySelector("[aria-label*='estrela'], [aria-label*='star']")
      );
    }
    return false;
  }

  /* Rótulos do botão que abre o painel. NÃO confundir com o convite
   * "Receba mais avaliações", que serve para pedir avaliação ao cliente. */
  const OPEN_LABELS = [
    "responder às avaliações",
    "responder a avaliações",
    "responder avaliações",
    "ler avaliações",
    "gerenciar avaliações",
    "ver todas as avaliações",
    "ver as avaliações",
    "ver avaliações",
    "conferir mais avaliações",
    "avaliações no google",
    "avaliações do google",
    "read reviews",
    "manage reviews",
    "google reviews"
  ];

  const BLOCKED = [
    "receba",
    "receber",
    "peça",
    "peca",
    "solicit",
    "compartilh",
    "convidar",
    "convite",
    "enviar link",
    "consiga",
    "conseguir",
    "obtenha",
    "obter",
    "ganhe",
    "ganhar",
    "escrever uma avaliaç",
    "fazer uma avaliaç",
    "dê sua avaliaç",
    "get more reviews",
    "ask for reviews"
  ];

  function isBlockedLabel(allLabels) {
    return allLabels.some((lbl) => BLOCKED.some((bad) => lbl.includes(bad)));
  }

  function findReviewTrigger() {
    const all = Array.from(
      document.querySelectorAll(
        "button, a, div[role='button'], span[role='button'], [role='link'], [role='tab'], g-raised-button, [tabindex='0']"
      )
    ).filter((el) => isVisible(el) && !el.closest("[role='search'], [role='navigation'], header"));

    for (const want of OPEN_LABELS) {
      const found = all.find((el) => {
        const list = labelsOf(el);
        if (!list.length || isBlockedLabel(list)) return false;
        return list.some((lbl) => lbl.length <= 70 && (lbl === want || lbl.includes(want)));
      });
      if (found) return found;
    }

    // Fallback para tile do painel "Sua empresa no Google" rotulado apenas como "Avaliações" (ou "Avaliações 3").
    const tile = all.find((el) => {
      const list = labelsOf(el);
      if (!list.length || isBlockedLabel(list)) return false;
      return list.some((lbl) => /^(avalia[çc][õo]es|reviews)(\s+\d+(\s+novas?)?)?$/.test(lbl));
    });
    return tile || null;
  }

  async function tryOpenReviewsPanel() {
    if (running) return;
    running = true;
    lastAttemptAt = Date.now();

    try {
      let job = null;
      for (let i = 0; i < 20; i++) {
        const state = await checkShouldRun();
        if (state.allowed) {
          job = state.job;
          break;
        }
        if (state.state && state.state !== "no_job") return;
        await sleep(500);
      }
      if (!job) return;

      if (reviewsPanelExists()) {
        update({}, "Painel de avaliações já está aberto.");
        return;
      }

      update({ statusText: `Abrindo avaliações de "${job.businessName}"...` });

      let lastClickedEl = null;
      let lastClickTime = 0;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const state = await checkShouldRun();
        if (!state.allowed) return;

        if (reviewsPanelExists()) {
          update({ statusText: "Painel aberto. Carregando lista..." }, "Painel de avaliações detectado.");
          return;
        }

        const trigger = findReviewTrigger();
        const cooldownElapsed = Date.now() - lastClickTime > 5000;
        if (trigger && (trigger !== lastClickedEl || cooldownElapsed)) {
          const target = trigger.closest("a, button, [role='button'], [role='link'], g-raised-button") || trigger;
          const label = primaryLabel(target) || primaryLabel(trigger);
          lastClickedEl = trigger;
          lastClickTime = Date.now();

          await clickElement(target);
          update(
            { statusText: `Abrindo painel ("${label}")...` },
            `Clicado em "${label}" para abrir o painel.`
          );

          // Aguarda até 5s para o iframe ou diálogo aparecer após o clique.
          for (let w = 0; w < 10; w++) {
            await sleep(500);
            if (reviewsPanelExists()) {
              update({ statusText: "Painel aberto. Carregando lista..." }, "Painel de avaliações aberto.");
              return;
            }
          }
          continue;
        }

        if (attempt === 20) {
          update(
            { statusText: "Procurando o painel de avaliações nesta conta..." },
            "O botão ainda não apareceu; continuo tentando."
          );
        }

        await sleep(1000);
      }

      update(
        { statusText: "Botão de avaliações não encontrado nesta página." },
        "Não achei o gatilho do painel. Confira se a conta Google certa está logada e se a busca abriu o perfil da empresa."
      );
    } finally {
      running = false;
    }
  }

  window.__teixoTryOpenPanel = tryOpenReviewsPanel;

  if (!window.__teixoSearchListenerAdded) {
    window.__teixoSearchListenerAdded = true;
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "RUN_NOW") setTimeout(tryOpenReviewsPanel, 300);
    });
  }

  setTimeout(tryOpenReviewsPanel, 800);

  setInterval(() => {
    if (running) return;
    if (Date.now() - lastAttemptAt < 15000) return;
    checkShouldRun().then((state) => {
      if (state.allowed && !reviewsPanelExists()) tryOpenReviewsPanel();
    });
  }, 10000);
})();
