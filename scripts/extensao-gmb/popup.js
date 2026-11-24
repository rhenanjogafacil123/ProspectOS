const businessInput = document.getElementById("businessName");
const authInput = document.getElementById("authInput");
const geminiInput = document.getElementById("geminiKey");
const btnNewTab = document.getElementById("btnNewTab");
const btnCurrentTab = document.getElementById("btnCurrentTab");
const btnStop = document.getElementById("btnStop");
const stateBadge = document.getElementById("stateBadge");
const statusText = document.getElementById("statusText");
const logsBox = document.getElementById("logsBox");

// Controles das Abas e Modo Gravação
const tabBtns = document.querySelectorAll(".segment-btn");
const tabPanels = document.querySelectorAll(".tab-panel");
const stealthToggle = document.getElementById("stealthToggle");
const dispBusiness = document.getElementById("dispBusiness");
const eyeButtons = document.querySelectorAll(".btn-toggle-eye");

let busy = false;

function switchTab(targetId) {
  tabBtns.forEach((b) => b.classList.toggle("active", b.getAttribute("data-tab") === targetId));
  tabPanels.forEach((p) => p.classList.toggle("active", p.id === targetId));
}

tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    switchTab(btn.getAttribute("data-tab"));
  });
});

function updateStealthMode(isStealth) {
  if (stealthToggle) stealthToggle.checked = isStealth;

  if (businessInput) businessInput.type = isStealth ? "password" : "text";
  if (authInput) authInput.type = isStealth ? "password" : "text";
  if (geminiInput) geminiInput.type = "password";

  if (dispBusiness) {
    const val = businessInput ? businessInput.value.trim() : "";
    if (!val) {
      dispBusiness.textContent = "Não configurada";
    } else if (isStealth) {
      dispBusiness.textContent = "••••••••••••";
    } else {
      dispBusiness.textContent = val;
    }
  }
}

if (stealthToggle) {
  stealthToggle.addEventListener("change", (e) => {
    const isStealth = e.target.checked;
    chrome.storage.local.set({ stealthMode: isStealth });
    updateStealthMode(isStealth);
  });
}

eyeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetInputId = btn.getAttribute("data-target");
    const input = document.getElementById(targetInputId);
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
  });
});

if (businessInput) {
  businessInput.addEventListener("input", () => {
    const isStealth = stealthToggle ? stealthToggle.checked : true;
    updateStealthMode(isStealth);
  });
}

function renderJob(job) {
  if (!job) {
    stateBadge.textContent = "Parado";
    stateBadge.classList.remove("active");
    btnStop.style.display = "none";
    return;
  }

  const isActive = Boolean(job.active);
  stateBadge.textContent = isActive ? "Rodando" : "Parado";
  stateBadge.classList.toggle("active", isActive);
  btnStop.style.display = isActive ? "block" : "none";

  statusText.textContent = job.statusText || "Pronto.";
  logsBox.textContent = Array.isArray(job.logs) ? job.logs.join("\n") : "";
  logsBox.scrollTop = logsBox.scrollHeight;
}

function setBusy(value) {
  busy = value;
  btnNewTab.disabled = value;
  btnCurrentTab.disabled = value;
}

async function loadSavedState() {
  const data = await chrome.storage.local.get([
    "job",
    "geminiKey",
    "lastBusiness",
    "lastAuth",
    "stealthMode"
  ]);
  if (data.lastBusiness) businessInput.value = data.lastBusiness;
  if (data.lastAuth) authInput.value = data.lastAuth;
  if (data.geminiKey) geminiInput.value = data.geminiKey;

  const isStealth = typeof data.stealthMode === "boolean" ? data.stealthMode : true;
  updateStealthMode(isStealth);

  renderJob(data.job);
}

function getPayload() {
  const businessName = businessInput.value.trim();
  if (!businessName) {
    statusText.textContent = "Configure o nome da empresa na aba Configurações.";
    switchTab("tab-config");
    businessInput.focus();
    return null;
  }

  const authValue = authInput.value.trim();
  const geminiKey = geminiInput.value.trim();

  // O robô já sabe nativamente responder com acolhimento a todas as avaliações
  const replyLowStars = true;

  chrome.storage.local.set({
    lastBusiness: businessName,
    lastAuth: authValue
  });

  return { businessName, authInput: authValue, geminiKey, replyLowStars };
}

function send(type, payload) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (res) => {
      if (chrome.runtime.lastError) {
        return resolve({ ok: false, error: chrome.runtime.lastError.message });
      }
      resolve(res || { ok: false, error: "Sem resposta do background." });
    });
  });
}

async function start(type) {
  if (busy) return;

  const payload = getPayload();
  if (!payload) return;

  setBusy(true);
  statusText.textContent = "Iniciando...";

  try {
    const res = await send(type, payload);
    if (!res.ok) {
      statusText.textContent = res.error || "Não foi possível iniciar.";
    }
  } catch (err) {
    statusText.textContent = `Falha ao iniciar: ${err?.message || err}`;
  } finally {
    setBusy(false);
  }
}

btnNewTab.addEventListener("click", () => start("START_NEW_TAB"));
btnCurrentTab.addEventListener("click", () => start("START_CURRENT_TAB"));

btnStop.addEventListener("click", async () => {
  btnStop.disabled = true;
  await send("STOP_JOB");
  btnStop.disabled = false;
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.job) renderJob(changes.job.newValue);
});

loadSavedState();