/**
 * Teixo Reviews AI — Robô Autônomo Multi-Lojas para Google Meu Negócio
 * Conecta via CDP ao Brave na conta oficial e responde 1 a 1 para qualquer estabelecimento.
 */

const readline = require("readline");
const { execSync, spawn } = require("child_process");
const { chromium } = require("playwright");

let GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

function getSmartFallbackReply(name, stars, index, businessName) {
  let firstName = (name || "Cliente").split(" ")[0].replace(/[^a-zA-ZÀ-ÿ]/g, "");
  
  const stopWords = (businessName || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (!firstName || stopWords.includes(firstName.toLowerCase())) {
    firstName = "Amigo(a)";
  }

  const bn = (businessName || "").toLowerCase();

  let bodies;
  let closings;

  if (bn.match(/cesta|alimento|hortifruti|mercado|distribuidora|mercearia|armazem/)) {
    // Nicho Cestas Básicas / Alimentos
    bodies = [
      `Separamos cada produto e cesta com o maior cuidado e qualidade para garantir a satisfação da sua família.`,
      `Nosso foco diário é entregar produtos frescos, de marcas nobres e com o melhor custo-benefício.`,
      `Ficamos muito felizes em poder atender você com agilidade, compromisso e dedicação em cada entrega.`,
      `Trabalhamos sempre para levar os melhores mantimentos e atendimento com carinho até a sua casa.`
    ];
    closings = [
      `Conte sempre com a gente para abastecer o seu lar! 🛒`,
      `Seja sempre muito bem-vindo e até o próximo pedido! ✨`,
      `Agradecemos a confiança na nossa qualidade! 📦`,
      `Precisando, é só chamar que entregamos com carinho! 🤝`
    ];
  } else if (bn.match(/pizza|pizzaria|hamburg|burger|lanche|pastel|acai|açai|acaiteria|restaurante|gastronomia|doceria|confeitaria/)) {
    // Nicho Gastronomia / Food Delivery
    bodies = [
      `Preparamos cada pedido com ingredientes selecionados e muito carinho para chegar quentinho e saboroso até você.`,
      `É um prazer enorme saber que você gostou da nossa comida e do nosso atendimento.`,
      `Nosso compromisso diário é entregar o melhor sabor e uma experiência gastronômica impecável.`,
      `Ficamos muito contentes que você aprovou o nosso sabor e a qualidade dos nossos pratos.`
    ];
    closings = [
      `Esperamos você em breve para o próximo pedido! 🍕`,
      `Será sempre um prazer preparar o seu pedido com muito carinho! 😋`,
      `Volte sempre que bater aquela fome! 🛵`,
      `Até a próxima com mais muito sabor! ✨`
    ];
  } else if (bn.match(/piscina|sitio|sítio|chacara|chácara|festa|espaco|espaço|salao|salão|buffet/)) {
    // Nicho Espaço de Festas / Piscinas
    bodies = [
      `Cuidamos com muita dedicação da nossa estrutura e de todo o espaço para que seu evento seja sempre memorável.`,
      `É sempre um prazer ver nossos clientes aproveitando a nossa estrutura e todo o espaço de festas com muito conforto.`,
      `Nosso compromisso diário é proporcionar a melhor experiência, lazer e diversão para você e todos os seus convidados.`,
      `Nosso espaço foi pensado em cada detalhe para proporcionar momentos especiais entre família e amigos.`
    ];
    closings = [
      `As portas estão sempre abertas para os seus próximos eventos! 🥳`,
      `Volte sempre que quiser comemorar em grande estilo! 🏊‍♂️`,
      `Esperamos vocês em breve para mais uma comemoração inesquecível! 🎉`,
      `Será sempre um enorme prazer receber você e sua família! ✨`,
      `Até a próxima festa! 🎈`
    ];
  } else {
    // Nicho Geral / Comércio e Serviços
    bodies = [
      `Nosso compromisso diário é oferecer o melhor atendimento, dedicação e serviços com a máxima qualidade para você.`,
      `Ficamos muito contentes em saber que você teve uma ótima experiência conosco e foi bem atendido.`,
      `Trabalhamos com carinho e seriedade todos os dias para superar as expectativas dos nossos clientes.`,
      `É gratificante demais receber seu reconhecimento pelo nosso trabalho e dedicação.`
    ];
    closings = [
      `Conte sempre conosco para o que precisar! 🤝`,
      `Será sempre um enorme prazer receber você! ✨`,
      `Seja sempre muito bem-vindo à nossa empresa! 🚀`,
      `Agradecemos a confiança e preferência! 👏`
    ];
  }

  const greetings = [
    `Muito obrigado pelo carinho e pela avaliação, ${firstName}!`,
    `Que alegria receber seu feedback positivo, ${firstName}!`,
    `Agradecemos de coração pela sua presença e avaliação, ${firstName}!`,
    `Obrigado pela preferência e por avaliar a gente, ${firstName}!`,
    `Ficamos muito felizes com a sua mensagem, ${firstName}!`
  ];

  const g = greetings[index % greetings.length];
  const b = bodies[index % bodies.length];
  const c = closings[index % closings.length];

  return `${g} ${b} ${c}`;
}

async function generateReply(author, stars, comment, index, businessName) {
  let firstName = (author || "Cliente").split(" ")[0].replace(/[^a-zA-ZÀ-ÿ]/g, "");
  const stopWords = (businessName || "").toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (!firstName || stopWords.includes(firstName.toLowerCase())) {
    firstName = "Amigo(a)";
  }

  const prompt = `Você é o proprietário do estabelecimento "${businessName}".
Escreva uma resposta curta, calorosa e humana para esta avaliação do Google Meu Negócio feita por ${firstName} (${stars} estrelas).
Regras:
1. Comece agradecendo e chamando pelo primeiro nome (${firstName}).
2. Faça uma frase curta citando a qualidade dos produtos/serviços ou o bom atendimento de ${businessName}.
3. Máximo 1 emoji.
4. Máximo de 2 frases. Seja acolhedor e natural. NUNCA use clichês corporativos como "sua opinião é importante".
Responda APENAS o texto puro da resposta.`;

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash-latest"];

  if (GEMINI_API_KEY) {
    for (const model of models) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text.trim();
      } catch (e) {}
    }
  }

  return getSmartFallbackReply(author, stars, index, businessName);
}

async function connectOrRestartBrave() {
  const bravePath = "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe";

  try {
    console.log("🔌 Conectando na janela do Brave aberta (porta 9222)...");
    const browser = await chromium.connectOverCDP("http://localhost:9222", { timeout: 3000 });
    console.log("✓ Conectado diretamente na sua janela ativa do Brave!");
    return browser;
  } catch (e) {
    console.log("\n⚠️ Brave fechado ou sem a porta 9222 ativa.");
    console.log("🔄 Reabrindo o Brave com suas abas e login do Google preservados...");

    try {
      execSync("taskkill /F /IM brave.exe", { stdio: "ignore" });
    } catch (k) {}

    await sleep(1500);

    spawn(bravePath, ["--remote-debugging-port=9222", "--restore-last-session"], {
      detached: true,
      stdio: "ignore"
    }).unref();

    console.log("⏳ Aguardando o Brave carregar...");
    await sleep(4000);

    const browser = await chromium.connectOverCDP("http://localhost:9222", { timeout: 15000 });
    console.log("✓ Conectado com sucesso ao Brave!");
    return browser;
  }
}

async function findAuthUserIndex(page, targetEmail) {
  if (!targetEmail) return 0;

  if (/^\d+$/.test(targetEmail.trim())) {
    return parseInt(targetEmail.trim(), 10);
  }

  const clean = targetEmail.toLowerCase().trim();

  // Mapeamentos diretos das contas do seu Brave
  if (clean.includes("padrao") || clean.includes("cesta") || clean.includes("margarida")) {
    return 6;
  }
  if (clean.includes("rhenanteixeira.rj")) {
    return 1;
  }
  if (clean.includes("rhenanteixeira06")) {
    return 0;
  }

  // Varredura dinâmica para qualquer outra conta adicionada no futuro
  console.log(`🔍 Localizando a sessão de "${clean}" no Google...`);
  for (let i = 0; i <= 9; i++) {
    try {
      await page.goto(`https://www.google.com/search?q=teste&authuser=${i}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(600);
      const label = await page.locator("a[aria-label*='Google:'], a[href*='SignOutOptions']").first().getAttribute("aria-label").catch(() => "");
      if (label && label.toLowerCase().includes(clean)) {
        return i;
      }
    } catch (e) {}
  }

  return 0;
}

async function run() {
  console.log("=========================================================");
  console.log("            TEIXO AI — GESTÃO DE REPUTAÇÃO GOOGLE");
  console.log("=========================================================\n");

  let searchBusiness = process.argv[2];

  while (!searchBusiness) {
    searchBusiness = await askQuestion("[1/2] Digite o nome da empresa: ");
    if (!searchBusiness) {
      console.log("⚠️ Informe o nome da empresa para continuar.\n");
    }
  }

  let targetEmail = process.argv[3];
  if (!targetEmail) {
    targetEmail = await askQuestion("[2/2] Digite o e-mail do gestor (Google): ");
  }

  console.log(`\n[🚀] Estabelecimento: "${searchBusiness}"`);
  if (targetEmail) {
    console.log(`[📧] Perfil Autorizado: "${targetEmail}"`);
  }
  console.log("");

  const browser = await connectOrRestartBrave();
  const context = browser.contexts()[0];
  let pages = context.pages();

  if (pages.length === 0) {
    await context.newPage();
    pages = context.pages();
  }

  const searchWords = searchBusiness.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  let page = pages.find((p) => p.url().includes("google.com/search") && searchWords.some(w => p.url().toLowerCase().includes(encodeURIComponent(w))))
          || pages.find((p) => p.url().includes("google.com/search"))
          || pages.find((p) => p.url().includes("google.com"))
          || pages[pages.length - 1];

  await page.bringToFront();

  const authIndex = await findAuthUserIndex(page, targetEmail);
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchBusiness)}&authuser=${authIndex}`;

  console.log(`🌐 Buscando no Google por: "${searchBusiness}" [authuser=${authIndex}]...`);
  await page.goto(searchUrl, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  // Se o Google pedir login da conta informada
  if (page.url().includes("accounts.google.com") || page.url().includes("signin") || page.url().includes("ServiceLogin")) {
    console.log(`\n🔑 AVISO: Faça login com "${targetEmail}" na janela do Brave.`);
    console.log("   O robô detectará o login e continuará automaticamente...\n");
    await page.waitForURL((url) => url.toString().includes("google.com/search"), { timeout: 120000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }

  // Localiza ou aguarda o iframe de avaliações do Google Meu Negócio
  let reviewFrame = page.frames().find((f) => f !== page.mainFrame() && f.url().includes("/customers/reviews"));

  if (!reviewFrame) {
    console.log(`🔍 Procurando painel do Google Meu Negócio de "${searchBusiness}"...`);
    const reviewTriggers = [
      "button:has-text('Ler avaliações')",
      "button:has-text('Responder às avaliações')",
      "button:has-text('Responder a avaliações')",
      "div[role='button']:has-text('avaliações')",
      "a:has-text('avaliações do Google')",
      "span:has-text('avaliações')"
    ];

    for (const trigger of reviewTriggers) {
      try {
        const el = page.locator(trigger).first();
        if (await el.isVisible({ timeout: 1500 })) {
          await el.click();
          break;
        }
      } catch (e) {}
    }

    for (let i = 0; i < 15; i++) {
      reviewFrame = page.frames().find((f) => f !== page.mainFrame() && f.url().includes("/customers/reviews"));
      if (reviewFrame) break;
      await page.waitForTimeout(1000);
    }
  }

  if (!reviewFrame) {
    console.error(`\n❌ Não foi possível carregar o painel interno de avaliações para "${searchBusiness}".`);
    console.error("   Certifique-se de que sua conta do Google tem permissão de gerenciar esse perfil.");
    return;
  }

  console.log("✓ Painel de avaliações ativo!");
  await page.waitForTimeout(2000);

  // Garante que o filtro "Não respondido" está ativo
  try {
    const unrepliedTab = reviewFrame.locator("button:has-text('Não respondido'), [role='tab']:has-text('Não respondido')").first();
    if (await unrepliedTab.isVisible({ timeout: 2500 })) {
      console.log("🎯 Filtrando por avaliações 'Não respondido'...");
      await unrepliedTab.click();
      await page.waitForTimeout(2000);
    }
  } catch (e) {}

  console.log(`\n🚀 Iniciando respostas automáticas para: ${searchBusiness}...\n`);

  let totalResponded = 0;

  for (let step = 0; step < 50; step++) {
    // 1. Verifica se já tem uma textarea aberta ou se precisa clicar em 'Responder' no próximo card
    const cardInfo = await reviewFrame.evaluate((businessWords) => {
      let ta = document.querySelector("textarea");

      // Se a textarea não estiver aberta, clica no primeiro botão 'Responder' de card disponível
      if (!ta) {
        const cardButtons = Array.from(document.querySelectorAll("button.mUIrbf-LgbsSe"))
          .filter((b) => b.innerText.trim() === "Responder");

        if (cardButtons.length === 0) {
          return { done: true };
        }

        cardButtons[0].scrollIntoView({ behavior: "smooth", block: "center" });
        cardButtons[0].click();
        return { clickedOpen: true };
      }

      // Se já está aberta, acha o card pai para extrair o nome do autor
      let card = ta.parentElement;
      for (let i = 0; i < 8; i++) {
        if (card.innerText.includes("avaliações •") || card.innerText.includes("avaliação •")) break;
        if (card.parentElement) card = card.parentElement;
      }

      const lines = card.innerText.split("\n").map((l) => l.trim()).filter(Boolean);
      const authorLine = lines.find((l) => {
        const lower = l.toLowerCase();
        if (l.includes("open_in_new")) return true;
        if (l.length < 2 || l.length > 40) return false;
        if (lower.includes("star") || lower.includes("responder") || lower.includes("cancelar") || 
            lower.includes("há ") || lower.includes("ontem") || lower.includes("novo") || 
            lower.includes("avaliaç") || lower.includes("comentário")) return false;
        if (businessWords.some((w) => lower.includes(w))) return false;
        return true;
      });

      const rawName = (authorLine || "Cliente").replace(/open_in_new/gi, "").trim();

      return {
        hasTextarea: true,
        authorName: rawName
      };
    }, searchWords);

    if (cardInfo.done) {
      console.log("🎉 Todas as avaliações pendentes foram respondidas!");
      break;
    }

    if (cardInfo.clickedOpen) {
      await page.waitForTimeout(1500);
      continue;
    }

    const author = cardInfo.authorName || "Cliente";
    console.log(`👤 [${totalResponded + 1}] Respondendo para: ${author}`);
    const replyText = await generateReply(author, 5, "", totalResponded, searchBusiness);
    console.log(`💬 Resposta: "${replyText}"`);

    // 2. Preenche a textarea instantaneamente disparando eventos nativos (imune a foco de tela)
    await reviewFrame.evaluate((text) => {
      const ta = document.querySelector("textarea");
      if (ta) {
        ta.focus();
        ta.value = text;
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        ta.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, replyText);

    await page.waitForTimeout(1000);

    // 3. Clica no botão de submissão do formulário (button.UywwFc-LgbsSe)
    const submitted = await reviewFrame.evaluate(() => {
      const submitBtn = Array.from(document.querySelectorAll("button.UywwFc-LgbsSe"))
        .find((b) => b.innerText.trim() === "Responder");

      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
        return true;
      }
      return false;
    });

    if (submitted) {
      totalResponded++;
      console.log(`✅ [${totalResponded}] Resposta enviada com sucesso para ${author}!`);
    } else {
      console.log("Tentando confirmação de envio alternativa...");
      await reviewFrame.locator("button.UywwFc-LgbsSe:text-is('Responder')").click().catch(() => {});
      totalResponded++;
    }

    // Pausa de 3 segundos simulando ritmo humano com contagem regressiva no terminal
    console.log("⏳ Aguardando confirmação do Google...");
    await page.waitForTimeout(1000);

    for (let sec = 3; sec > 0; sec--) {
      process.stdout.write(`⏱️  Pausa de segurança: próxima resposta em ${sec}s...   \r`);
      await sleep(1000);
    }
    console.log("⏱️  Pausa concluída! Indo para a próxima...\n");
  }

  console.log(`=========================================================`);
  console.log(`🎉 SUCESSO TOTAL!`);
  console.log(`Todas as ${totalResponded} avaliações de "${searchBusiness}" foram respondidas!`);
  console.log(`=========================================================\n`);
}

run().catch((err) => {
  console.error("\n❌ Erro durante a execução:", err.message);
});
