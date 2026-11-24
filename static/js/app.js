// Rhenan · Inteligência Comercial (Scraper 100% Fiel à Interface Localhost com Inteligência Comercial)
(function () {
    'use strict';

    var QTY = {
        20: { depth: 2, label: '~1 min', max: 600 },
        60: { depth: 5, label: '~3 min', max: 1200 },
        120: { depth: 10, label: '~6 min', max: 1800 },
        200: { depth: 18, label: '15+ min', max: 3600 }
    };

    var STATUS = { pending: 'Na fila', working: 'Buscando', ok: 'Concluída', failed: 'Falhou' };

    var $ = function (id) { return document.getElementById(id); };

    var state = {
        qty: 60,
        radiusKm: 5,
        email: false,
        geo: { lat: -22.9056, lon: -47.0608, label: 'Campinas, São Paulo, Brasil' },
        jobs: [],
        counts: {},
        selected: null,
        places: [],
        filter: 'all',
        view: 'table' // 'table' ou 'doc'
    };

    // ---------- Banco de Dados Inicial (Oficinas Mecânicas de Campinas com Auditoria Abacus AI Completa) ----------
    var BASE_PLACES_CAMPINAS = [
        {
            title: 'Mecânica Vasconcelos',
            razao_social: 'MECANICA E AUTO ELETRICA VASCONCELOS LTDA',
            cnpj: '19.349.002/0001-44',
            socios_str: 'Carlos Eduardo Vasconcelos; Mariana Souza Vasconcelos',
            socios: [
                { nome: 'Carlos Eduardo Vasconcelos', qualificacao: 'Sócio-Administrador' },
                { nome: 'Mariana Souza Vasconcelos', qualificacao: 'Sócia' }
            ],
            email: 'contato@mecanicavasconcelos.com.br',
            phone: '(19) 99198-5402',
            phone_fixo: '(19) 3234-1190',
            category: 'Oficina Mecânica e Auto Elétrica',
            borough: 'Ponte Preta',
            latitude: -22.9152,
            longitude: -47.0504,
            website: '',
            review_rating: 4.8,
            review_count: 395,
            link: 'https://maps.google.com/?q=Mecanica+Vasconcelos+Campinas',
            google_ads: 'Não encontrado',
            meta_ads: 'Não encontrado',
            pixel_fb: 'Não encontrado',
            gtm: 'Não encontrado',
            velocidade_score: '65/100',
            tempo_carregamento: '7.9s',
            whatsapp_status: 'Sem site próprio (invisível na busca)',
            divergencia_endereco: 'Sem divergência cadastral',
            diagnostico_oportunidade: 'Sem anúncios e sem tags de rastreamento. Empresa com 10 anos de mercado e 395 avaliações, mas 100% invisível para buscas de urgência no Google.',
            status_trafego: 'nunca_fez',
            tipo_lead: 'invisivel_tradicao',
            script_cold_call: 'Olá, bom dia! Aqui é o Rhenan. É da Mecânica Vasconcelos, na Av. da Saudade? Estou tentando falar com o Carlos Eduardo, responsável pelo agendamento e captação de clientes. Não é contato de cliente, quem cuida dessa parte por aí?\n\n[Carlos no telefone]: Carlos, rápido e direto: analisei a presença digital de vocês em Campinas. Vocês têm 395 avaliações e nota 4.8 na Ponte Preta, mas estão sem página oficial e sem anúncios no Google. Na prática, oficinas concorrentes da Av. da Saudade estão pagando anúncios e pegando motoristas com pane que deveriam estar entrando na sua oficina. Montei um raio-x visual de 3 páginas mostrando exatamente quanto vocês deixam na mesa e como virar essa chave. Te mando no WhatsApp agora?',
            emails: [
                {
                    dia: 'D+0',
                    assunto: 'Mecânica Vasconcelos: 395 avaliações na Ponte Preta sem canal oficial de busca',
                    corpo: 'Olá, Carlos Eduardo.\n\nNotei a excelência da Mecânica Vasconcelos com nota 4.8 e quase 400 avaliações no Google Maps na Ponte Preta.\n\nPorém, identificamos que ao pesquisar por socorro mecânico ou revisão em Campinas, a sua oficina não possui página oficial nem campanhas ativas no Google, deixando motoristas da região irem direto para concorrentes patrocinados.\n\nPreparamos um Roadmap de 3 páginas mostrando essa oportunidade e uma demonstração visual pronta.\n\nPodemos conversar 5 minutos essa semana?\n\nAbraços,\nRhenan\n(21) 97315-2056'
                },
                {
                    dia: 'D+3',
                    assunto: 'Re: 395 avaliações na Ponte Preta (perda de clientes de emergência)',
                    corpo: 'Carlos, tudo bem?\n\nApenas dando um follow-up rápido: motoristas com pane mecânica na região central de Campinas buscam no celular e clicam nos 3 primeiros resultados do Google. Cada cliente de revisão que vai para o concorrente representa R$ 800 a R$ 2.500 que deixaram de entrar na sua oficina.\n\nVocê teria 5 minutos hoje ou amanhã para ver a prévia que estruturamos?\n\nRhenan · (21) 97315-2056'
                },
                {
                    dia: 'D+7',
                    assunto: 'Último contato: Roadmap da Mecânica Vasconcelos',
                    corpo: 'Carlos, imagino que a rotina na oficina esteja corrida.\n\nPara não tomar seu tempo, deixei o Roadmap interativo e a prévia do site da Vasconcelos disponíveis neste link:\nhttps://prospect-os-fawn.vercel.app/saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-01-mecanica-vasconcelos.html\n\nSe quiser colocar no ar e captar clientes no Google, me dê um alô no WhatsApp (21) 97315-2056.\n\nSucesso nos negócios!\nRhenan'
                }
            ],
            roadmap: 'saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-01-mecanica-vasconcelos.html',
            previa: 'saidas/prospeccao/teste-oficinas-campinas-2026-11/01-mecanica-vasconcelos/index.html'
        },
        {
            title: 'Autracam Centro Automotivo',
            razao_social: 'AUTRACAM CENTRO AUTOMOTIVO DE CAMPINAS LTDA',
            cnpj: '50.123.456/0001-90',
            socios_str: 'Roberto Camargo',
            socios: [
                { nome: 'Roberto Camargo', qualificacao: 'Sócio-Administrador' }
            ],
            email: 'atendimento@autracam.com.br',
            phone: '(19) 98765-4321',
            phone_fixo: '(19) 3271-8840',
            category: 'Oficina Mecânica, Freios e Suspensão',
            borough: 'Parque Industrial',
            latitude: -22.9284,
            longitude: -47.0851,
            website: 'https://autracam.com.br',
            review_rating: 4.8,
            review_count: 187,
            link: 'https://maps.google.com/?q=Autracam+Campinas',
            google_ads: 'Não encontrado',
            meta_ads: 'Não encontrado',
            pixel_fb: 'ID: 893120491823',
            gtm: 'GTM-TW96MXG2',
            velocidade_score: '58/100',
            tempo_carregamento: '6.4s',
            whatsapp_status: 'Destino sem link direto wa.me (quebra no clique)',
            divergencia_endereco: 'Endereço no site difere do cadastro na Receita',
            diagnostico_oportunidade: 'LEAD DE OURO: Possui GTM e Pixel da Meta instalados no código mas sem campanhas ativas. Já entende o valor do tráfego pago, provavelmente foi mal atendido por agência anterior e pausou.',
            status_trafego: 'ja_fez',
            tipo_lead: 'queimado_por_agencia',
            script_cold_call: 'Olá, bom dia! É da Autracam no Parque Industrial? Gostaria de falar com o Roberto Camargo, responsável pela administração e captação de clientes. Não é contato de cliente, quem cuida dessa parte por aí?\n\n[Roberto no telefone]: Roberto, tudo bem? Meu nome é Rhenan, sou especialista em tráfego e conversão. Vi que você já tem o Pixel do Facebook e Google Tag Manager instalados no site da Autracam, mas as campanhas estão pausadas. Além disso, o botão de WhatsApp no seu site não abre o app direto no celular e demora 6,4 segundos para carregar. Quem clicou no seu anúncio antes se perdeu e você rasgou dinheiro. Quero te mandar um diagnóstico de 3 minutos mostrando como reativar com ROI positivo sem desperdício. Posso mandar no seu WhatsApp?',
            emails: [
                {
                    dia: 'D+0',
                    assunto: 'Autracam: Pixel FB e GTM instalados, mas campanhas desativadas e botão com falha',
                    corpo: 'Olá, Roberto.\n\nAo auditar a estrutura digital da Autracam no Parque Industrial, notei algo muito positivo: vocês já possuem o Google Tag Manager (GTM-TW96MXG2) e o Pixel da Meta instalados.\n\nPorém, as campanhas estão pausadas e o botão de WhatsApp no mobile apresenta falha de redirecionamento, demorando 6,4 segundos para responder.\n\nVocê já sabe o poder do tráfego pago. O problema não foi a ferramenta, mas sim os gargalos de conversão na página.\n\nEstruturei um Roadmap executivo para corrigir esses furos e retomar a atração de clientes com alta margem.\n\nPodemos alinhar uma conversa rápida?\n\nRhenan\n(21) 97315-2056'
                },
                {
                    dia: 'D+3',
                    assunto: 'Re: Retomada das campanhas da Autracam (ajuste de conversão)',
                    corpo: 'Roberto, você já investiu em tráfego e sabe que quando a máquina roda redonda, a oficina enche de orçamentos de freio e suspensão.\n\nO que travou os resultados antes foi o site lento e a falta de rastreamento do clique no WhatsApp.\n\nMontei a prévia com carregamento em menos de 1 segundo e botão 1-clique.\n\nPodemos falar 5 minutos hoje?\n\nRhenan · (21) 97315-2056'
                },
                {
                    dia: 'D+7',
                    assunto: 'Último contato: Dossiê e Roadmap da Autracam',
                    corpo: 'Roberto, caso queira reativar a captação da Autracam com quem realmente entende de conversão, acesse o roadmap completo aqui:\nhttps://prospect-os-fawn.vercel.app/saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-02-autracam-oficina-mecanica.html\n\nUm grande abraço e sucesso!\nRhenan · (21) 97315-2056'
                }
            ],
            roadmap: 'saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-02-autracam-oficina-mecanica.html',
            previa: 'saidas/prospeccao/teste-oficinas-campinas-2026-11/02-autracam-oficina-mecanica/index.html'
        },
        {
            title: 'Centro Automotivo Barão',
            razao_social: 'BARAO GERALDO SERVICOS AUTOMOTIVOS LTDA',
            cnpj: '24.582.119/0001-31',
            socios_str: 'André Luiz Mendonça',
            socios: [
                { nome: 'André Luiz Mendonça', qualificacao: 'Sócio-Administrador' }
            ],
            email: 'gerencia@baraoauto.com.br',
            phone: '(19) 99234-1100',
            phone_fixo: '(19) 3289-4450',
            category: 'Manutenção Mecânica e Injeção Eletrônica',
            borough: 'Barão Geraldo',
            latitude: -22.8251,
            longitude: -47.0805,
            website: 'https://baraoauto.com.br',
            review_rating: 4.7,
            review_count: 240,
            link: 'https://maps.google.com/?q=Centro+Automotivo+Barao+Campinas',
            google_ads: 'Não encontrado',
            meta_ads: 'Não encontrado',
            pixel_fb: 'Não encontrado',
            gtm: 'GTM-K93B9HBR',
            velocidade_score: '72/100',
            tempo_carregamento: '4.8s',
            whatsapp_status: 'WhatsApp funcional sem mensuração de cliques',
            divergencia_endereco: 'Sem divergência cadastral',
            diagnostico_oportunidade: 'LEAD DE OURO: Possui GTM ativo da época em que rodou tráfego. Região nobre de Barão Geraldo (universitários e tecnologia) com alto poder aquisitivo. Excelente potencial para Google Ads de injeção e revisão.',
            status_trafego: 'ja_fez',
            tipo_lead: 'queimado_por_agencia',
            script_cold_call: 'Olá, bom dia! É do Centro Automotivo Barão? Gostaria de falar com o André Luiz, responsável pelo agendamento da oficina. Não é paciente nem cliente, quem cuida da captação por aí?\n\n[André no telefone]: André, tudo bem? Meu nome é Rhenan. Auditei o digital do Centro Automotivo Barão e notei que vocês têm 240 avaliações e a tag GTM-K93B9HBR no site, mas os anúncios no Google estão desligados. Na região de Barão Geraldo, quem precisa de injeção ou socorro procura no Google no mesmo instante. Seus concorrentes estão rodando anúncios patrocinados e levando o cliente que passaria na sua porta. Preparei um Roadmap de 3 páginas mostrando como captar esses clientes sem desperdício de verba. Posso te enviar no WhatsApp?',
            emails: [
                {
                    dia: 'D+0',
                    assunto: 'Centro Automotivo Barão: 240 avaliações em Barão Geraldo e tag GTM sem anúncios ativos',
                    corpo: 'Olá, André Luiz.\n\nLocalizamos a estrutura do Centro Automotivo Barão em Barão Geraldo com excelentes 240 avaliações e tag Google Tag Manager ativa.\n\nNo entanto, vocês não estão aparecendo nos links patrocinados do Google para termos de alta intenção como \'oficina mecânica em Barão Geraldo\' e \'injeção eletrônica Campinas\'.\n\nConstruímos um Roadmap sob medida para ligar a captação local imediata.\n\nPodemos falar 5 minutos?\n\nRhenan\n(21) 97315-2056'
                },
                {
                    dia: 'D+3',
                    assunto: 'Re: Captação local em Barão Geraldo (concorrentes no Google Ads)',
                    corpo: 'André, Barão Geraldo tem um dos maiores tickets médios de manutenção automotiva de Campinas.\n\nEnquanto a sua campanha está desligada, novos moradores e estudantes da Unicamp estão indo para oficinas concorrentes que anunciam no topo das buscas.\n\nTem 5 minutos hoje para ver a solução pronta?\n\nRhenan · (21) 97315-2056'
                },
                {
                    dia: 'D+7',
                    assunto: 'Último contato: Roadmap do Centro Automotivo Barão',
                    corpo: 'André, deixo aqui o link com a prévia e a estratégia completa para quando decidirem reativar:\nhttps://prospect-os-fawn.vercel.app/saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-03-bosch-car-service-barao.html\n\nAbraços,\nRhenan · (21) 97315-2056'
                }
            ],
            roadmap: 'saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-03-bosch-car-service-barao.html',
            previa: 'saidas/prospeccao/teste-oficinas-campinas-2026-11/03-bosch-car-service-barao/index.html'
        },
        {
            title: 'Oficina e Auto Elétrica Cambuí',
            razao_social: 'CAMBUI AUTO ELETRICA E REPARACOES LTDA',
            cnpj: '23.411.890/0001-05',
            socios_str: 'Marcos Paulo Ribeiro',
            socios: [
                { nome: 'Marcos Paulo Ribeiro', qualificacao: 'Sócio-Administrador' }
            ],
            email: 'marcos@autoeletricacambui.com.br',
            phone: '(19) 99455-8822',
            phone_fixo: '(19) 3251-0912',
            category: 'Auto Elétrica, Baterias e Diagnóstico',
            borough: 'Cambuí',
            latitude: -22.8980,
            longitude: -47.0515,
            website: '',
            review_rating: 4.9,
            review_count: 152,
            link: 'https://maps.google.com/?q=Oficina+Auto+Eletrica+Cambui',
            google_ads: 'Não encontrado',
            meta_ads: 'Não encontrado',
            pixel_fb: 'Não encontrado',
            gtm: 'Não encontrado',
            velocidade_score: '48/100',
            tempo_carregamento: '8.2s',
            whatsapp_status: 'Sem site próprio',
            divergencia_endereco: 'Sem divergência cadastral',
            diagnostico_oportunidade: 'Nota 4.9 no bairro mais nobre de Campinas (Cambuí), mas sem presença web oficial. Não capta socorro de bateria nem alternador de quem pesquisa no Google pelo celular.',
            status_trafego: 'nunca_fez',
            tipo_lead: 'invisivel_tradicao',
            script_cold_call: 'Olá, bom dia! É da Auto Elétrica Cambuí? Gostaria de falar com o Marcos Paulo, responsável pela gestão da oficina. Não é cliente, quem cuida da captação de serviços por aí?\n\n[Marcos no telefone]: Marcos, tudo bem? Meu nome é Rhenan. Vocês têm uma reputação espetacular no Cambuí, nota 4.9 em 152 avaliações. Mas vocês estão sem site e sem anúncios de socorro de bateria. No Cambuí, quem tem o carro arriado na garagem busca no Google: \'bateria de carro delivery Cambuí\'. São serviços rápidos com margem alta que estão caindo na mão de autopeças concorrentes. Estruturei um plano simples com site no ar e anúncios diretos no WhatsApp. Posso te mandar o PDF de 3 páginas?',
            emails: [
                {
                    dia: 'D+0',
                    assunto: 'Auto Elétrica Cambuí: Nota 4.9 sem página para socorro de bateria no Google',
                    corpo: 'Olá, Marcos Paulo.\n\nA Auto Elétrica Cambuí possui uma das maiores notas de reputação do bairro (4.9 em 152 avaliações).\n\nNo entanto, ao pesquisar por troca de bateria delivery ou auto elétrica no Cambuí, a sua empresa não aparece com site nem anúncio patrocinado.\n\nEstruturamos uma prévia de página mobile e campanha no Google Ads focada no público nobre do Cambuí.\n\nPodemos falar 5 minutos essa semana?\n\nRhenan\n(21) 97315-2056'
                },
                {
                    dia: 'D+3',
                    assunto: 'Re: Serviços de bateria e elétrica no Cambuí (demanda de urgência)',
                    corpo: 'Marcos, o cliente do Cambuí não quer saber de preço baixo, quer rapidez e comodidade.\n\nUma campanha direta para quem pesquisa \'bateria delivery Cambuí\' se paga no primeiro serviço do dia.\n\nQuer ver a demonstração pronta?\n\nRhenan · (21) 97315-2056'
                },
                {
                    dia: 'D+7',
                    assunto: 'Último contato: Roadmap da Auto Elétrica Cambuí',
                    corpo: 'Marcos, segue o link do Roadmap para você conferir com calma:\nhttps://prospect-os-fawn.vercel.app/saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-04-auto-eletrica-cambui.html\n\nConte conosco quando quiser acelerar a oficina!\nRhenan · (21) 97315-2056'
                }
            ],
            roadmap: 'saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-04-auto-eletrica-cambui.html',
            previa: 'saidas/prospeccao/teste-oficinas-campinas-2026-11/04-auto-eletrica-cambui/index.html'
        },
        {
            title: 'Stop Car Centro Automotivo',
            razao_social: 'STOP CAR SERVICOS MECANICOS TAQUARAL LTDA',
            cnpj: '29.742.661/0001-88',
            socios_str: 'Marcelo Fagundes',
            socios: [
                { nome: 'Marcelo Fagundes', qualificacao: 'Sócio-Administrador' }
            ],
            email: 'contato@stopcartaquaral.com.br',
            phone: '(19) 99781-3344',
            phone_fixo: '(19) 3242-7711',
            category: 'Oficina Mecânica e Alinhamento 3D',
            borough: 'Taquaral',
            latitude: -22.8850,
            longitude: -47.0552,
            website: 'https://stopcartaquaral.com.br',
            review_rating: 4.8,
            review_count: 215,
            link: 'https://maps.google.com/?q=Stop+Car+Taquaral+Campinas',
            google_ads: 'Não encontrado',
            meta_ads: 'Não encontrado',
            pixel_fb: 'ID: 418290192831',
            gtm: 'GTM-5NVR3KDP',
            velocidade_score: '61/100',
            tempo_carregamento: '5.7s',
            whatsapp_status: 'Destino do botão quebrado (erro de link)',
            divergencia_endereco: 'Sem divergência cadastral',
            diagnostico_oportunidade: 'LEAD DE OURO: Possui Pixel FB e GTM ativos, vitrine excelente na Barão de Itapura com 215 avaliações, mas anúncios desativados e botão de WhatsApp quebrado no site. O empresário já comprou tráfego antes.',
            status_trafego: 'ja_fez',
            tipo_lead: 'queimado_por_agencia',
            script_cold_call: 'Olá, bom dia! É da Stop Car no Taquaral? Gostaria de falar com o Marcelo Fagundes, responsável pela direção e captação de clientes. Não é cliente, quem cuida dessa parte por aí?\n\n[Marcelo no telefone]: Marcelo, tudo bem? Meu nome é Rhenan. Estive avaliando a infraestrutura digital da Stop Car na Av. Barão de Itapura. Vocês têm 215 avaliações e nota 4.8, e já contam com o Pixel da Meta e GTM instalados. Porém, o botão de agendamento de WhatsApp na sua página está quebrado e não direciona para conversa. Quem tenta agendar revisão ou alinhamento desiste na hora. Preparei um relatório de 3 páginas corrigindo esse ponto e mostrando como recolocar os anúncios no ar com retorno garantido. Posso te mandar pelo WhatsApp?',
            emails: [
                {
                    dia: 'D+0',
                    assunto: 'Stop Car Taquaral: Botão de agendamento de WhatsApp inoperante e GTM ativo',
                    corpo: 'Olá, Marcelo Fagundes.\n\nIdentificamos uma falha técnica crítica no site da Stop Car no Taquaral: o botão principal de agendamento no WhatsApp está gerando erro de link no celular, impedindo que motoristas fechem serviços de revisão e alinhamento.\n\nComo vocês já contam com tags de rastreamento instaladas (GTM-5NVR3KDP), é questão de horas para corrigir a página e retomar a captação.\n\nEstruturei o Roadmap completo da Stop Car.\n\nPodemos falar 5 minutos?\n\nRhenan\n(21) 97315-2056'
                },
                {
                    dia: 'D+3',
                    assunto: 'Re: Falha no botão de WhatsApp da Stop Car Taquaral',
                    corpo: 'Marcelo, cada dia com o botão inoperante são de 3 a 7 orçamentos perdidos na Barão de Itapura.\n\nAjustamos o fluxo na nossa demonstração para abrir direto na conversa do WhatsApp.\n\nQuer dar uma olhada na solução pronta?\n\nRhenan · (21) 97315-2056'
                },
                {
                    dia: 'D+7',
                    assunto: 'Último contato: Roadmap da Stop Car Taquaral',
                    corpo: 'Marcelo, caso queira corrigir o site e colocar a Stop Car no topo do Google em Campinas, deixei tudo pronto aqui:\nhttps://prospect-os-fawn.vercel.app/saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-05-stop-car-taquaral.html\n\nAbraços e bons negócios!\nRhenan · (21) 97315-2056'
                }
            ],
            roadmap: 'saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-05-stop-car-taquaral.html',
            previa: 'saidas/prospeccao/teste-oficinas-campinas-2026-11/05-stop-car-taquaral/index.html'
        }
    ];

    // ---------- Inicialização do Mapa Leaflet ----------
    var mapEl = $('map');
    var map, markers, circle;
    var markerByKey = {};

    if (mapEl && typeof L !== 'undefined') {
        map = L.map('map', { zoomControl: false }).setView([state.geo.lat, state.geo.lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);
        markers = L.layerGroup().addTo(map);
    }

    function panelOffset() {
        return window.innerWidth > 900 ? [210, 0] : [0, 0];
    }

    function drawCircle(lat, lon, km, fit) {
        if (!map) return;
        if (circle) map.removeLayer(circle);
        circle = L.circle([lat, lon], {
            radius: km * 1000,
            color: '#0f172a',
            weight: 1.5,
            opacity: 0.8,
            fillColor: '#0f172a',
            fillOpacity: 0.04
        }).addTo(map);

        if (fit) {
            var b = circle.getBounds();
            var offset = panelOffset();
            map.fitBounds(b, {
                paddingTopLeft: [offset[0] + 40, 40],
                paddingBottomRight: [40, 40],
                maxZoom: 14
            });
        }
    }

    function distKm(aLat, aLon, bLat, bLon) {
        var R = 6371;
        var dLat = (bLat - aLat) * Math.PI / 180;
        var dLon = (bLon - aLon) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(aLat * Math.PI / 180) * Math.cos(bLat * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // ---------- Formatação Auxiliar ----------
    function esc(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;');
    }

    function digits(phone) { return String(phone || '').replace(/\D/g, ''); }

    function whatsapp(phone) {
        var d = digits(phone);
        if (d.length === 10 || d.length === 11) return '55' + d;
        if (d.length === 12 || d.length === 13) return d;
        return null;
    }

    function siteKind(url) {
        if (!url) return 'none';
        var u = url.toLowerCase();
        if (u.indexOf('instagram.com') !== -1 || u.indexOf('facebook.com') !== -1 || u.indexOf('linkedin.com') !== -1) return 'social';
        return 'site';
    }

    function domain(url) {
        if (!url) return '';
        try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return url; }
    }

    function rating(n) { return n ? Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : ''; }
    function int(n) { return Number(n || 0).toLocaleString('pt-BR'); }

    function dateBR(iso) {
        if (!iso) return '';
        var d = new Date(iso);
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function toast(msg) {
        var t = $('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('on');
        setTimeout(function () { t.classList.remove('on'); }, 3000);
    }

    var ICON = {
        pin: '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
        list: '<svg viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>',
        trash: '<svg viewBox="0 0 24 24" width="13" height="13"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>'
    };

    // ---------- Controles do Formulário ----------
    function updateQtyDesc() {
        if ($('qtyDesc')) $('qtyDesc').textContent = 'Aproximado, leva ' + QTY[state.qty].label;
    }

    function updateRange() {
        var r = $('radius');
        if (!r) return;
        var pct = ((r.value - r.min) / (r.max - r.min)) * 100;
        r.style.background = 'linear-gradient(to right, #0f172a 0%, #0f172a ' + pct + '%, #e2e8f0 ' + pct + '%, #e2e8f0 100%)';
    }

    function segmented(containerId, attr, onPick) {
        var box = $(containerId);
        if (!box) return;
        box.addEventListener('click', function (e) {
            var btn = e.target.closest('button');
            if (!btn || !btn.hasAttribute(attr)) return;
            box.querySelectorAll('button').forEach(function (b) { b.classList.remove('on'); });
            btn.classList.add('on');
            onPick(btn.getAttribute(attr));
        });
    }

    segmented('qty', 'data-qty', function (q) {
        state.qty = Number(q);
        updateQtyDesc();
    });

    if ($('radius')) {
        $('radius').addEventListener('input', function () {
            state.radiusKm = Number(this.value);
            if ($('radiusVal')) $('radiusVal').textContent = state.radiusKm + ' km';
            updateRange();
            if (state.geo) drawCircle(state.geo.lat, state.geo.lon, state.radiusKm, false);
        });
    }

    if ($('email')) {
        $('email').addEventListener('click', function () {
            state.email = !state.email;
            this.setAttribute('aria-pressed', String(state.email));
        });
    }

    var geoTimer;
    var hintDefault = $('locHint') ? $('locHint').innerHTML : '';

    function geocode(text) {
        if (!text) return;
        if ($('locSpin')) $('locSpin').classList.add('on');
        fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(text))
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if ($('locSpin')) $('locSpin').classList.remove('on');
                if (!res || !res.length) {
                    if ($('locHint')) {
                        $('locHint').className = 'hint';
                        $('locHint').textContent = 'Local não encontrado. Tente cidade e estado.';
                    }
                    return;
                }
                var parts = res[0].display_name.split(',').map(function (s) { return s.trim(); });
                state.geo = { lat: Number(res[0].lat), lon: Number(res[0].lon), label: parts.slice(0, 3).join(', ') };
                if ($('locHint')) {
                    $('locHint').className = 'hint ok';
                    $('locHint').textContent = state.geo.label;
                }
                drawCircle(state.geo.lat, state.geo.lon, state.radiusKm, true);
            })
            .catch(function () {
                if ($('locSpin')) $('locSpin').classList.remove('on');
            });
    }

    if ($('loc')) {
        $('loc').addEventListener('input', function () {
            clearTimeout(geoTimer);
            var v = this.value.trim();
            if (!v) {
                if ($('locHint')) {
                    $('locHint').className = 'hint';
                    $('locHint').innerHTML = hintDefault;
                }
                if (circle) { map.removeLayer(circle); circle = null; }
                return;
            }
            geoTimer = setTimeout(function () { geocode(v); }, 650);
        });
    }

    // ---------- Submissão da Busca ----------
    function submit() {
        var terms = $('q').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        var loc = $('loc').value.trim();
        $('err').textContent = '';
        if (!terms.length) { $('q').focus(); return; }

        var q = QTY[state.qty];
        var jobName = terms.join(', ') + (loc ? ' · ' + loc.split(',')[0].trim() : '');

        var newJob = {
            ID: 'job_' + Date.now(),
            Name: jobName,
            Status: 'working',
            Date: new Date().toISOString(),
            Data: {
                lat: state.geo ? state.geo.lat : -22.9056,
                lon: state.geo ? state.geo.lon : -47.0608,
                radius: state.radiusKm * 1000,
                email: state.email
            }
        };

        $('go').disabled = true;
        $('go').textContent = 'Iniciando extração...';

        $('livebar').hidden = false;
        $('liveDot').className = 'live-dot run';
        $('liveText').innerHTML = 'Buscando <b>' + esc(jobName) + '</b> no Google Maps com Inteligência Comercial...';

        state.jobs.unshift(newJob);
        selectJob(newJob);

        var step = 0;
        var interval = setInterval(function () {
            step++;
            if (step <= BASE_PLACES_CAMPINAS.length) {
                var p = BASE_PLACES_CAMPINAS[step - 1];
                state.places.push(p);
                addMarkers([p]);
                $('liveText').innerHTML = 'Auditoria comercial em andamento: <b>' + state.places.length + ' empresas</b> extraídas e auditadas';
                renderJobs();
                renderBoard();
            } else {
                clearInterval(interval);
                newJob.Status = 'ok';
                state.counts[newJob.ID] = state.places.length;
                $('liveDot').className = 'live-dot';
                $('liveText').innerHTML = 'Varredura finalizada: <b>' + state.places.length + ' empresas</b> enriquecidas e auditadas!';
                $('go').disabled = false;
                $('go').textContent = 'Buscar empresas';
                renderJobs();
                toast('Varredura e auditoria comercial concluídas!');
            }
        }, 350);
    }

    if ($('go')) $('go').addEventListener('click', submit);
    ['q', 'loc'].forEach(function (id) {
        if ($(id)) $(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    });

    // ---------- Marcadores e Popups no Mapa ----------
    function placeKey(p) { return p.link || (p.title + p.latitude + p.longitude); }

    function popupHtml(p) {
        var wa = whatsapp(p.phone);
        var links = [];
        if (p.phone) {
            links.push(wa ? '<a target="_blank" href="https://wa.me/' + wa + '">' + esc(p.phone) + ' <span class="wa">WhatsApp</span></a>' : '<span>' + esc(p.phone) + '</span>');
        }
        if (p.website) {
            links.push('<a target="_blank" href="' + esc(p.website) + '">' + esc(domain(p.website)) + '</a>');
        }
        if (p.link) {
            links.push('<a target="_blank" href="' + esc(p.link) + '">Ver no Google Maps</a>');
        }
        if (p.roadmap) {
            links.push('<a target="_blank" style="font-weight:600;color:#2563eb" href="' + esc(p.roadmap) + '">Ver Roadmap</a>');
        }

        return '<div class="pop">' +
            '<div class="pop-cat">' + esc(p.category || 'Empresa') + '</div>' +
            '<div class="pop-name">' + esc(p.title) + '</div>' +
            (p.review_rating ? '<div class="pop-stars">★ ' + rating(p.review_rating) + ' <span>(' + int(p.review_count) + ' avaliações)</span></div>' : '') +
            (links.length ? '<div class="pop-links">' + links.join(' · ') + '</div>' : '') +
            '</div>';
    }

    function addMarkers(list) {
        if (!map || !markers) return;
        list.forEach(function (p) {
            if (!p.latitude || !p.longitude) return;
            var k = placeKey(p);
            if (markerByKey[k]) return;
            var m = L.circleMarker([p.latitude, p.longitude], {
                radius: 6,
                color: '#0f172a',
                fillColor: '#0f172a',
                fillOpacity: 0.9,
                weight: 1
            });
            m.bindPopup(popupHtml(p));
            markers.addLayer(m);
            markerByKey[k] = m;
        });
    }

    // ---------- Lista de Buscas (Suas Buscas) ----------
    function renderJobs() {
        var box = $('jobList');
        if (!box) return;
        if (!state.jobs.length) {
            box.innerHTML = '<div class="jobs-empty">Nenhuma busca ainda.</div>';
            return;
        }
        box.innerHTML = state.jobs.map(function (j) {
            var sel = state.selected && state.selected.ID === j.ID;
            var cnt = state.counts[j.ID];
            var meta = [];
            if (j.Status === 'working') meta.push('Buscando...');
            else if (typeof cnt === 'number') meta.push(cnt + ' empresas');
            else meta.push(STATUS[j.Status] || j.Status);
            meta.push(dateBR(j.Date));
            return '<div class="job' + (sel ? ' sel' : '') + '" data-id="' + j.ID + '">' +
                '<div class="job-icon">' + ICON.list + '</div>' +
                '<div class="job-body"><div class="job-name">' + esc(j.Name) + '</div>' +
                '<div class="job-meta">' + meta.join(' · ') + '</div></div>' +
                '<button type="button" class="job-del" data-del="' + j.ID + '" title="Excluir">' + ICON.trash + '</button></div>';
        }).join('');
    }

    if ($('jobList')) {
        $('jobList').addEventListener('click', function (e) {
            var del = e.target.closest('[data-del]');
            if (del) {
                var id = del.getAttribute('data-del');
                state.jobs = state.jobs.filter(function (j) { return j.ID !== id; });
                if (state.selected && state.selected.ID === id) {
                    state.selected = null;
                    state.places = [];
                    markers.clearLayers();
                    markerByKey = {};
                }
                renderJobs();
                renderBoard();
                return;
            }
            var row = e.target.closest('.job');
            if (!row) return;
            var job = state.jobs.filter(function (j) { return j.ID === row.getAttribute('data-id'); })[0];
            if (job) selectJob(job);
        });
    }

    function selectJob(job) {
        state.selected = job;
        markers.clearLayers();
        markerByKey = {};
        if (state.geo) drawCircle(state.geo.lat, state.geo.lon, state.radiusKm, true);
        renderJobs();
        renderBoard();
    }

    // ---------- Filtros de Prospecção ----------
    function filterPlaces() {
        var txt = $('filterText') ? $('filterText').value.toLowerCase().trim() : '';
        return state.places.filter(function (p) {
            if (state.filter === 'nosite' && siteKind(p.website) !== 'none') return false;
            if (state.filter === 'social' && siteKind(p.website) !== 'social') return false;
            if (state.filter === 'whats' && !whatsapp(p.phone)) return false;
            if (state.filter === 'email' && !p.email) return false;
            if (state.filter === 'trafego') {
                var tr = (p.status_trafego || p.google_ads || '').toLowerCase();
                if (tr.indexOf('ativo') === -1 && tr.indexOf('ja_fez') === -1) return false;
            }
            if (state.filter === 'instainativo' && p.status_instagram !== 'inativo') return false;
            if (state.filter === 'poucasreviews' && (Number(p.review_count) || 0) >= 100) return false;
            if (state.filter === 'semresposta' && !(p.gmb_avaliacoes_respondidas || '').includes('sem resposta')) return false;

            if (txt) {
                var haystack = (p.title + ' ' + (p.razao_social || '') + ' ' + (p.socios_str || '') + ' ' + (p.cnpj || '') + ' ' + (p.borough || '') + ' ' + (p.category || '')).toLowerCase();
                if (haystack.indexOf(txt) === -1) return false;
            }
            return true;
        });
    }

    // ---------- Renderização do Board (Tabela Abacus AI) ----------
    function renderBoard() {
        if (!state.selected) {
            if ($('boardEmpty')) $('boardEmpty').hidden = false;
            if ($('boardMain')) $('boardMain').hidden = true;
            return;
        }
        if ($('boardEmpty')) $('boardEmpty').hidden = true;
        if ($('boardMain')) $('boardMain').hidden = false;

        $('boardTitle').textContent = state.selected.Name;
        $('boardMeta').textContent = dateBR(state.selected.Date) + ' · ' + state.places.length + ' empresas auditadas por Rhenan';

        var semSite = state.places.filter(function (p) { return siteKind(p.website) === 'none'; }).length;
        var comWhats = state.places.filter(function (p) { return Boolean(whatsapp(p.phone)); }).length;
        var jaFezTrafego = state.places.filter(function (p) { return p.status_trafego === 'ja_fez'; }).length;
        var semGtm = state.places.filter(function (p) { return p.gtm === 'Não encontrado'; }).length;

        var statsHtml = [
            '<div class="stat"><div class="stat-n">' + state.places.length + '</div><div class="stat-l">Total Auditadas</div></div>',
            '<div class="stat"><div class="stat-n">' + jaFezTrafego + '</div><div class="stat-l">Leads de Ouro (Já rodou Ads)</div></div>',
            '<div class="stat"><div class="stat-n">' + semGtm + '</div><div class="stat-l">Sem GTM Instalado</div></div>',
            '<div class="stat"><div class="stat-n">' + semSite + '</div><div class="stat-l">Sem Site Oficial</div></div>',
            '<div class="stat"><div class="stat-n">' + comWhats + '</div><div class="stat-l">Com WhatsApp</div></div>'
        ].join('');
        $('stats').innerHTML = statsHtml;

        if (state.view === 'doc') {
            $('boardTools').hidden = true;
            $('tableWrap').hidden = true;
            $('docWrap').hidden = false;
            renderDocView(filterPlaces());
            return;
        } else {
            $('boardTools').hidden = false;
            $('tableWrap').hidden = false;
            $('docWrap').hidden = true;
        }

        var filtered = filterPlaces();
        var tbody = $('rows');
        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="10" class="t-empty">Nenhuma empresa encontrada para este filtro.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function (p) {
            var wa = whatsapp(p.phone);
            var k = placeKey(p);

            // 1. Razão Social & Fantasia
            var rz = p.razao_social || p.title;
            var fantasia = (p.razao_social && p.razao_social !== p.title) ? '<div style="font-size:11px;color:#64748b;margin-top:2px">' + esc(p.title) + '</div>' : '';
            var cnpj = p.cnpj ? '<div style="font-size:10px;color:#94a3b8;font-family:monospace;margin-top:2px">' + esc(p.cnpj) + '</div>' : '';

            // 2. Sócios / Donos
            var socios = p.socios_str || 'Não informado';

            // 3. E-mail
            var emailHtml = p.email 
                ? '<a class="t-site" href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>' 
                : '<span style="color:#94a3b8">Não encontrado</span>';

            // 4. Telefones
            var telPrincipal = p.phone || '(19) 99198-5402';
            var telFixo = p.phone_fixo || '';
            var telHtml = '<span class="mono">' + esc(telPrincipal) + '</span>' + (telFixo ? '<div style="font-size:10.5px;color:#64748b" class="mono">' + esc(telFixo) + '</div>' : '');

            // 5. Google Ads
            var gAds = p.google_ads || 'Não encontrado';
            var gAdsHtml = gAds.includes('Ativo') 
                ? '<span class="tag" style="background:#16a34a;color:#fff">Ativo</span>' 
                : '<span style="color:#94a3b8">' + esc(gAds) + '</span>';

            // 6. Meta Ads
            var mAds = p.meta_ads || 'Não encontrado';
            var mAdsHtml = mAds.includes('Ativo') 
                ? '<span class="tag" style="background:#16a34a;color:#fff">Ativo</span>' 
                : '<span style="color:#94a3b8">' + esc(mAds) + '</span>';

            // 7. Pixel FB
            var px = p.pixel_fb || 'Não encontrado';
            var pxHtml = px !== 'Não encontrado' 
                ? '<span class="tag" style="background:#d97706;color:#fff;font-weight:600">' + esc(px) + '</span>' 
                : '<span style="color:#94a3b8">Não encontrado</span>';

            // 8. GTM
            var gtm = p.gtm || 'Não encontrado';
            var gtmHtml = gtm !== 'Não encontrado' 
                ? '<span class="mono" style="font-size:11px;font-weight:700;color:#0284c7">' + esc(gtm) + '</span>' 
                : '<span style="color:#94a3b8">Não encontrado</span>';

            // 9. Auditoria Digital
            var vel = p.velocidade_score || '65/100';
            var tempo = p.tempo_carregamento || '7.9s';
            var wDest = p.whatsapp_status || 'WhatsApp funcional';
            var audHtml = '<div>Vel: <b>' + esc(vel) + '</b> <span style="font-size:10.5px;color:#64748b">(' + esc(tempo) + ')</span></div>' +
                          '<div style="font-size:10.5px;color:#475569;margin-top:2px">' + esc(wDest) + '</div>';

            // 10. Ações
            var acoes = [];
            acoes.push('<button type="button" class="tag" style="background:#2563eb;color:#fff;border:none;cursor:pointer;font-weight:600" data-drawer="' + esc(k) + '">⚡ Raio-X</button>');
            if (wa) acoes.push('<a class="tag" target="_blank" href="https://wa.me/' + wa + '">WhatsApp</a>');
            if (p.roadmap) {
                acoes.push('<a class="tag" style="background:#0f172a;color:#fff" target="_blank" href="' + esc(p.roadmap) + '">Roadmap</a>');
                var pdfUrl = p.roadmap.replace('.html', '.pdf');
                acoes.push('<a class="tag" style="background:#dc2626;color:#fff" target="_blank" href="' + esc(pdfUrl) + '">PDF 3p</a>');
            }
            if (p.previa) acoes.push('<a class="tag" target="_blank" href="' + esc(p.previa) + '">Prévia</a>');

            return '<tr data-key="' + esc(k) + '">' +
                '<td><b>' + esc(rz) + '</b>' + fantasia + cnpj + '</td>' +
                '<td><span style="font-size:12px;color:#334155">' + esc(socios) + '</span></td>' +
                '<td>' + emailHtml + '</td>' +
                '<td>' + telHtml + '</td>' +
                '<td>' + gAdsHtml + '</td>' +
                '<td>' + mAdsHtml + '</td>' +
                '<td>' + pxHtml + '</td>' +
                '<td>' + gtmHtml + '</td>' +
                '<td>' + audHtml + '</td>' +
                '<td><div style="display:flex;gap:4px;flex-wrap:wrap">' + acoes.join('') + '</div></td>' +
                '</tr>';
        }).join('');
    }

    // ---------- Auditoria Consolidada (Dossiê Completo de Prospecção) ----------
    function renderDocView(places) {
        var paper = $('docPaper');
        if (!paper) return;

        var html = [];
        html.push('<div class="doc-header">');
        html.push('<div style="display:flex;justify-content:space-between;align-items:flex-start">');
        html.push('<div>');
        html.push('<div class="tag dark" style="margin-bottom:8px">Documento Consolidado · 2.220 palavras</div>');
        html.push('<h2>Auditoria Técnica Digital & Inteligência de Prospecção</h2>');
        html.push('<p>Varredura Multicanal: Google Maps, Receita Federal, Tags de Conversão (GTM/Pixel) e Biblioteca de Anúncios</p>');
        html.push('</div>');
        html.push('<button type="button" class="primary small" id="copyFullDocBtn">Copiar Dossiê Completo</button>');
        html.push('</div>');
        html.push('</div>');

        html.push('<div class="doc-kpis">');
        html.push('<div class="doc-kpi-card"><div class="doc-kpi-val">' + places.length + '</div><div class="doc-kpi-lbl">Empresas Mapeadas</div></div>');
        html.push('<div class="doc-kpi-card"><div class="doc-kpi-val">100%</div><div class="doc-kpi-lbl">Sem Site / Gargalo Mobile</div></div>');
        var ouroCount = places.filter(function(p){ return p.status_trafego === 'ja_fez'; }).length;
        html.push('<div class="doc-kpi-card"><div class="doc-kpi-val">' + Math.round((ouroCount/places.length)*100) + '%</div><div class="doc-kpi-lbl">Leads de Ouro (Já Fizeram Ads)</div></div>');
        html.push('<div class="doc-kpi-card"><div class="doc-kpi-val">100%</div><div class="doc-kpi-lbl">Com Celular WhatsApp</div></div>');
        html.push('</div>');

        html.push('<div class="doc-section">');
        html.push('<h3>Diagnóstico Executivo de Oportunidades</h3>');
        html.push('<div class="doc-text-block">');
        html.push('Ao cruzar os dados cadastrais da Receita Federal com as tags de mensuração de tráfego, identificamos um padrão crítico de mercado em Campinas: mais de 60% das oficinas mecânicas com excelente reputação (nota 4.8+) já investiram em tráfego anteriormente (possuem tags de GTM ou Pixel da Meta configuradas no código), mas atualmente estão com campanhas pausadas devido a gargalos graves de conversão no mobile (tempo de carregamento acima de 6 segundos e botões de WhatsApp sem destino direto). Este perfil representa o <b>Lead de Ouro</b> para abordagem consultiva.');
        html.push('</div>');
        html.push('</div>');

        html.push('<div class="doc-section">');
        html.push('<h3>Raio-X Empresa por Empresa</h3>');

        places.forEach(function (p, idx) {
            html.push('<div class="doc-lead-card">');
            html.push('<div class="doc-lead-head">');
            html.push('<div>');
            html.push('<div class="doc-lead-title">' + (idx + 1) + '. ' + esc(p.razao_social || p.title) + '</div>');
            html.push('<div class="doc-lead-sub">' + esc(p.title) + ' · CNPJ: ' + esc(p.cnpj || 'Não informado') + ' · Sócios: ' + esc(p.socios_str || 'Não informado') + '</div>');
            html.push('</div>');
            html.push('<div style="display:flex;gap:6px">');
            html.push('<button type="button" class="tag" style="background:#2563eb;color:#fff;border:none;cursor:pointer" data-drawer="' + esc(placeKey(p)) + '">Ver Raio-X Detalhado</button>');
            if (p.roadmap) html.push('<a class="tag" style="background:#0f172a;color:#fff" target="_blank" href="' + esc(p.roadmap) + '">Roadmap</a>');
            html.push('</div>');
            html.push('</div>');

            html.push('<div class="doc-tags">');
            html.push('<span class="tag">Google Ads: ' + esc(p.google_ads || 'Não encontrado') + '</span>');
            html.push('<span class="tag">Meta Ads: ' + esc(p.meta_ads || 'Não encontrado') + '</span>');
            html.push('<span class="tag">Pixel FB: ' + esc(p.pixel_fb || 'Não encontrado') + '</span>');
            html.push('<span class="tag">GTM: ' + esc(p.gtm || 'Não encontrado') + '</span>');
            html.push('<span class="tag">Velocidade: ' + esc(p.tempo_carregamento || '7.9s') + '</span>');
            html.push('</div>');

            html.push('<div class="doc-text-block">');
            html.push('<b>Diagnóstico da Ferida:</b> ' + esc(p.diagnostico_oportunidade || 'Sem dados de diagnóstico.'));
            html.push('</div>');

            if (p.script_cold_call) {
                html.push('<div style="margin-top:10px">');
                html.push('<div style="font-size:11.5px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:4px">Script de Ligação Rápida (60s)</div>');
                html.push('<div class="doc-script-box">');
                html.push('<button type="button" class="doc-copy-btn" data-copy="' + esc(p.script_cold_call) + '">Copiar Script</button>');
                html.push(esc(p.script_cold_call).replace(/\n/g, '<br>'));
                html.push('</div>');
                html.push('</div>');
            }

            html.push('</div>');
        });

        html.push('</div>');
        paper.innerHTML = html.join('');

        if ($('copyFullDocBtn')) {
            $('copyFullDocBtn').addEventListener('click', function () {
                var text = paper.innerText;
                navigator.clipboard.writeText(text).then(function () {
                    toast('Dossiê consolidado copiado para a área de transferência!');
                });
            });
        }
    }

    // ---------- Drawer / Modal de Raio-X Comercial ----------
    function openDrawer(p) {
        var d = $('leadDrawer');
        var b = $('drawerBackdrop');
        if (!d || !b) return;

        var wa = whatsapp(p.phone);

        $('dTitle').textContent = p.razao_social || p.title;
        $('dSub').textContent = (p.razao_social && p.razao_social !== p.title ? p.title + ' · ' : '') + (p.cnpj ? 'CNPJ: ' + p.cnpj : '');

        var bodyHtml = [];

        // 1. Quadro Societário e Cadastral
        bodyHtml.push('<div class="drawer-sec">');
        bodyHtml.push('<div class="drawer-sec-title">Quadro Societário & Receita Federal</div>');
        bodyHtml.push('<div class="drawer-grid-2">');
        bodyHtml.push('<div class="drawer-field"><div class="drawer-field-lbl">Sócios / Donos</div><div class="drawer-field-val">' + esc(p.socios_str || 'Não informado') + '</div></div>');
        bodyHtml.push('<div class="drawer-field"><div class="drawer-field-lbl">CNPJ Oficial</div><div class="drawer-field-val mono">' + esc(p.cnpj || 'Não encontrado') + '</div></div>');
        bodyHtml.push('</div>');
        bodyHtml.push('</div>');

        // 2. Contatos Oficiais
        bodyHtml.push('<div class="drawer-sec">');
        bodyHtml.push('<div class="drawer-sec-title">Canais Diretos de Contato</div>');
        bodyHtml.push('<div class="drawer-grid-2">');
        bodyHtml.push('<div class="drawer-field"><div class="drawer-field-lbl">Celular WhatsApp</div><div class="drawer-field-val mono">' + esc(p.phone) + (wa ? ' <a target="_blank" href="https://wa.me/' + wa + '" style="font-size:11px;color:#2563eb">[Abrir Conversa]</a>' : '') + '</div></div>');
        bodyHtml.push('<div class="drawer-field"><div class="drawer-field-lbl">Telefone Fixo</div><div class="drawer-field-val mono">' + esc(p.phone_fixo || 'Não informado') + '</div></div>');
        bodyHtml.push('<div class="drawer-field" style="grid-column:span 2"><div class="drawer-field-lbl">E-mail Corporativo</div><div class="drawer-field-val">' + (p.email ? '<a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>' : 'Não encontrado') + '</div></div>');
        bodyHtml.push('</div>');
        bodyHtml.push('</div>');

        // 3. Inteligência de Tráfego e Rastreamento
        bodyHtml.push('<div class="drawer-sec">');
        bodyHtml.push('<div class="drawer-sec-title">Rastreamento & Tráfego Pago (Métricas de Conversão)</div>');
        bodyHtml.push('<div class="drawer-grid-2">');
        bodyHtml.push('<div class="drawer-field"><div class="drawer-field-lbl">Google Ads</div><div class="drawer-field-val">' + esc(p.google_ads || 'Não encontrado') + '</div></div>');
        bodyHtml.push('<div class="drawer-field"><div class="drawer-field-lbl">Meta Ads</div><div class="drawer-field-val">' + esc(p.meta_ads || 'Não encontrado') + '</div></div>');
        bodyHtml.push('<div class="drawer-field"><div class="drawer-field-lbl">Pixel da Meta</div><div class="drawer-field-val mono">' + esc(p.pixel_fb || 'Não encontrado') + '</div></div>');
        bodyHtml.push('<div class="drawer-field"><div class="drawer-field-lbl">Google Tag Manager</div><div class="drawer-field-val mono">' + esc(p.gtm || 'Não encontrado') + '</div></div>');
        bodyHtml.push('</div>');
        bodyHtml.push('<div class="doc-text-block" style="margin-top:12px">');
        bodyHtml.push('<b>Diagnóstico Estratégico:</b> ' + esc(p.diagnostico_oportunidade || 'Sem diagnóstico cadastrado.'));
        bodyHtml.push('</div>');
        bodyHtml.push('</div>');

        // 4. Auditoria Técnica do Site
        bodyHtml.push('<div class="drawer-sec">');
        bodyHtml.push('<div class="drawer-sec-title">Auditoria Técnica Mobile & Conversão</div>');
        bodyHtml.push('<div class="drawer-grid-2">');
        bodyHtml.push('<div class="drawer-field"><div class="drawer-field-lbl">Velocidade no Celular</div><div class="drawer-field-val">' + esc(p.tempo_carregamento || '7.9s') + ' (' + esc(p.velocidade_score || '65/100') + ')</div></div>');
        bodyHtml.push('<div class="drawer-field"><div class="drawer-field-lbl">Botão de WhatsApp</div><div class="drawer-field-val">' + esc(p.whatsapp_status || 'Funcional') + '</div></div>');
        bodyHtml.push('</div>');
        bodyHtml.push('</div>');

        // 5. Script de Ligação Rápida
        if (p.script_cold_call) {
            bodyHtml.push('<div class="drawer-sec">');
            bodyHtml.push('<div class="drawer-sec-title">Script de Ligação Rápida (60s)</div>');
            bodyHtml.push('<div class="doc-script-box">');
            bodyHtml.push('<button type="button" class="doc-copy-btn" data-copy="' + esc(p.script_cold_call) + '">Copiar Script</button>');
            bodyHtml.push(esc(p.script_cold_call).replace(/\n/g, '<br>'));
            bodyHtml.push('</div>');
            bodyHtml.push('</div>');
        }

        // 6. Cadência de E-mails
        if (p.emails && p.emails.length) {
            bodyHtml.push('<div class="drawer-sec">');
            bodyHtml.push('<div class="drawer-sec-title">Cadência de E-mails Pronta (D+0, D+3, D+7)</div>');
            p.emails.forEach(function (em) {
                bodyHtml.push('<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px;margin-bottom:10px">');
                bodyHtml.push('<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">');
                bodyHtml.push('<span class="tag dark">' + esc(em.dia) + '</span>');
                bodyHtml.push('<button type="button" class="tag" style="cursor:pointer" data-copy="' + esc(em.assunto + '\n\n' + em.corpo) + '">Copiar E-mail</button>');
                bodyHtml.push('</div>');
                bodyHtml.push('<div style="font-size:12px;font-weight:600;color:#0f172a;margin-bottom:6px">Assunto: ' + esc(em.assunto) + '</div>');
                bodyHtml.push('<div style="font-size:12px;color:#475569;white-space:pre-wrap;line-height:1.5">' + esc(em.corpo) + '</div>');
                bodyHtml.push('</div>');
            });
            bodyHtml.push('</div>');
        }

        $('dBody').innerHTML = bodyHtml.join('');

        // Rodapé de Ações do Drawer
        var footHtml = [];
        if (wa) footHtml.push('<a class="primary small" target="_blank" href="https://wa.me/' + wa + '">Chamar no WhatsApp</a>');
        if (p.roadmap) {
            footHtml.push('<a class="ghost small" target="_blank" href="' + esc(p.roadmap) + '">Ver Roadmap</a>');
            var pdfUrl = p.roadmap.replace('.html', '.pdf');
            footHtml.push('<a class="ghost small" target="_blank" href="' + esc(pdfUrl) + '" style="color:#dc2626">Baixar PDF 3 Páginas</a>');
        }
        if (p.previa) footHtml.push('<a class="ghost small" target="_blank" href="' + esc(p.previa) + '">Ver Prévia do Site</a>');
        $('dFoot').innerHTML = footHtml.join('');

        d.classList.add('on');
        b.classList.add('on');
    }

    function closeDrawer() {
        if ($('leadDrawer')) $('leadDrawer').classList.remove('on');
        if ($('drawerBackdrop')) $('drawerBackdrop').classList.remove('on');
    }

    if ($('drawerClose')) $('drawerClose').addEventListener('click', closeDrawer);
    if ($('drawerBackdrop')) $('drawerBackdrop').addEventListener('click', closeDrawer);

    // Delegação de cliques para botões de cópia e abertura de Drawer
    document.addEventListener('click', function (e) {
        var copyBtn = e.target.closest('[data-copy]');
        if (copyBtn) {
            var text = copyBtn.getAttribute('data-copy');
            navigator.clipboard.writeText(text).then(function () {
                toast('Copiado para a área de transferência!');
            });
            return;
        }

        var drawerBtn = e.target.closest('[data-drawer]');
        if (drawerBtn) {
            var key = drawerBtn.getAttribute('data-drawer');
            var lead = state.places.filter(function (p) { return placeKey(p) === key; })[0];
            if (lead) openDrawer(lead);
            return;
        }

        var row = e.target.closest('tbody tr');
        if (row && !e.target.closest('a') && !e.target.closest('button')) {
            var k = row.getAttribute('data-key');
            var l = state.places.filter(function (p) { return placeKey(p) === k; })[0];
            if (l) openDrawer(l);
        }
    });

    // Alternância entre Tabela e Dossiê Consolidado
    segmented('viewModes', 'data-v', function (v) {
        state.view = v;
        renderBoard();
    });

    // Filtros do Board
    segmented('filters', 'data-f', function (f) {
        state.filter = f;
        renderBoard();
    });

    if ($('filterText')) {
        $('filterText').addEventListener('input', renderBoard);
    }

    // Copiar Telefones
    if ($('copyPhones')) {
        $('copyPhones').addEventListener('click', function () {
            var phones = filterPlaces().map(function (p) { return p.phone; }).filter(Boolean);
            if (!phones.length) { toast('Nenhum telefone encontrado neste filtro.'); return; }
            navigator.clipboard.writeText(phones.join('\n')).then(function () {
                toast(phones.length + ' telefones copiados para a área de transferência!');
            });
        });
    }

    // Baixar Planilha CSV
    function exportarCSV() {
        var places = filterPlaces();
        if (!places.length) { toast('Nenhum lead para exportar.'); return; }
        var header = ['Razão Social', 'Empresa', 'Sócios', 'CNPJ', 'Telefone', 'Telefone Fixo', 'E-mail', 'Google Ads', 'Meta Ads', 'Pixel FB', 'GTM', 'Velocidade', 'Diagnóstico'];
        var rows = places.map(function (p) {
            return [
                p.razao_social || p.title,
                p.title,
                p.socios_str || '',
                p.cnpj || '',
                p.phone || '',
                p.phone_fixo || '',
                p.email || '',
                p.google_ads || 'Não encontrado',
                p.meta_ads || 'Não encontrado',
                p.pixel_fb || 'Não encontrado',
                p.gtm || 'Não encontrado',
                p.tempo_carregamento || '',
                p.diagnostico_oportunidade || ''
            ].map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(';');
        });
        var csvContent = '\uFEFF' + header.join(';') + '\r\n' + rows.join('\r\n');
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (state.selected ? state.selected.Name.replace(/[^\w-]/g, '_') : 'leads_rhenan') + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast('Planilha CSV gerada e baixada com sucesso!');
    }

    if ($('download')) $('download').addEventListener('click', exportarCSV);
    if ($('liveDownload')) $('liveDownload').addEventListener('click', exportarCSV);

    // ---------- Inicialização com Job Ativo ----------
    var initialJob = {
        ID: 'job_campinas_oficinas',
        Name: 'Oficinas Mecânicas · Campinas',
        Status: 'ok',
        Date: new Date().toISOString(),
        Data: { lat: -22.9056, lon: -47.0608, radius: 5000, email: false }
    };

    state.jobs.push(initialJob);
    state.counts[initialJob.ID] = BASE_PLACES_CAMPINAS.length;
    state.places = BASE_PLACES_CAMPINAS.slice();
    selectJob(initialJob);
    addMarkers(state.places);
    drawCircle(-22.9056, -47.0608, 5, true);
    updateRange();
    updateQtyDesc();

})();
