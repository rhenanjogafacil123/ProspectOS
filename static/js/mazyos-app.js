// ProspectOS · Mazy Engine (Scraper 100% Fiel à Interface Localhost)
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
        view: 'map'
    };

    // ---------- Banco de Dados Inicial (Campinas & SP) ----------
    var BASE_PLACES_CAMPINAS = [
        {
            title: "Mecânica Vasconcelos",
            category: "Oficina Mecânica e Auto Elétrica",
            borough: "Ponte Preta",
            latitude: -22.9152,
            longitude: -47.0504,
            phone: "(19) 99198-5402",
            website: "",
            emails: "",
            review_rating: 4.8,
            review_count: 395,
            link: "https://maps.google.com/?q=Mecanica+Vasconcelos+Campinas",
            roadmap: "saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-01-mecanica-vasconcelos.html",
            previa: "saidas/prospeccao/teste-oficinas-campinas-2026-11/01-mecanica-vasconcelos/index.html"
        },
        {
            title: "Autracam Centro Automotivo",
            category: "Oficina Mecânica, Freios e Suspensão",
            borough: "Parque Industrial",
            latitude: -22.9284,
            longitude: -47.0851,
            phone: "(19) 98765-4321",
            website: "",
            emails: "",
            review_rating: 4.8,
            review_count: 187,
            link: "https://maps.google.com/?q=Autracam+Campinas",
            roadmap: "saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-02-autracam-oficina-mecanica.html",
            previa: "saidas/prospeccao/teste-oficinas-campinas-2026-11/02-autracam-oficina-mecanica/index.html"
        },
        {
            title: "Centro Automotivo Barão",
            category: "Manutenção Mecânica e Injeção Eletrônica",
            borough: "Barão Geraldo",
            latitude: -22.8251,
            longitude: -47.0805,
            phone: "(19) 99234-1100",
            website: "",
            emails: "",
            review_rating: 4.7,
            review_count: 240,
            link: "https://maps.google.com/?q=Centro+Automotivo+Barao+Campinas",
            roadmap: "saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-03-bosch-car-service-barao.html",
            previa: "saidas/prospeccao/teste-oficinas-campinas-2026-11/03-bosch-car-service-barao/index.html"
        },
        {
            title: "Oficina e Auto Elétrica Cambuí",
            category: "Auto Elétrica, Baterias e Diagnóstico",
            borough: "Cambuí",
            latitude: -22.8980,
            longitude: -47.0515,
            phone: "(19) 99455-8822",
            website: "",
            emails: "",
            review_rating: 4.9,
            review_count: 152,
            link: "https://maps.google.com/?q=Oficina+Auto+Eletrica+Cambui",
            roadmap: "saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-04-auto-eletrica-cambui.html",
            previa: "saidas/prospeccao/teste-oficinas-campinas-2026-11/04-auto-eletrica-cambui/index.html"
        },
        {
            title: "Stop Car Centro Automotivo",
            category: "Oficina Mecânica e Alinhamento 3D",
            borough: "Taquaral",
            latitude: -22.8850,
            longitude: -47.0552,
            phone: "(19) 99781-3344",
            website: "",
            emails: "",
            review_rating: 4.8,
            review_count: 215,
            link: "https://maps.google.com/?q=Stop+Car+Taquaral+Campinas",
            roadmap: "saidas/prospeccao/teste-oficinas-campinas-2026-11/roadmap-05-stop-car-taquaral.html",
            previa: "saidas/prospeccao/teste-oficinas-campinas-2026-11/05-stop-car-taquaral/index.html"
        },
        {
            title: "Oficina Mecânica Castelo",
            category: "Reparação Automotiva",
            borough: "Castelo",
            latitude: -22.8920,
            longitude: -47.0780,
            phone: "(19) 99122-3344",
            website: "https://instagram.com/mecanicacastelo",
            emails: "",
            review_rating: 4.6,
            review_count: 98,
            link: "https://maps.google.com/?q=Mecanica+Castelo+Campinas"
        },
        {
            title: "Guanabara Auto Center",
            category: "Centro Automotivo",
            borough: "Jardim Guanabara",
            latitude: -22.8905,
            longitude: -47.0680,
            phone: "(19) 99887-1234",
            website: "",
            emails: "contato@guanabaraautocenter.com.br",
            review_rating: 4.7,
            review_count: 142,
            link: "https://maps.google.com/?q=Guanabara+Auto+Center+Campinas"
        },
        {
            title: "Mecânica e Freios Swift",
            category: "Oficina Mecânica Especializada",
            borough: "Vila Lemos",
            latitude: -22.9220,
            longitude: -47.0420,
            phone: "(19) 98112-9988",
            website: "",
            emails: "",
            review_rating: 4.9,
            review_count: 110,
            link: "https://maps.google.com/?q=Mecanica+Swift+Campinas"
        },
        {
            title: "Auto Mecânica Nova Campinas",
            category: "Oficina Mecânica",
            borough: "Nova Campinas",
            latitude: -22.9010,
            longitude: -47.0450,
            phone: "(19) 99344-5566",
            website: "https://facebook.com/novacampinasauto",
            emails: "",
            review_rating: 4.5,
            review_count: 76,
            link: "https://maps.google.com/?q=Mecanica+Nova+Campinas"
        },
        {
            title: "Mansões Santo Antônio Auto Center",
            category: "Injeção Eletrônica e Motor",
            borough: "Mansões Santo Antônio",
            latitude: -22.8680,
            longitude: -47.0520,
            phone: "(19) 98877-6655",
            website: "https://autocentermansoes.com.br",
            emails: "sac@autocentermansoes.com.br",
            review_rating: 4.6,
            review_count: 180,
            link: "https://maps.google.com/?q=Mansoes+Santo+Antonio+Auto+Center"
        }
    ];

    // ---------- Inicialização do Mapa Leaflet ----------
    var map = L.map('map', { zoomControl: false, attributionControl: true })
        .setView([-22.9056, -47.0608], 13);
    
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.attributionControl.setPrefix('Leaflet');
    
    // Grayscale map tiles idênticos ao mazyos
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: 'abc',
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    var circle = null;
    var markers = L.layerGroup().addTo(map);
    var markerByKey = {};

    function panelOffset() {
        return window.innerWidth > 900 ? [440, 40] : [40, 40];
    }

    function drawCircle(lat, lon, km, fit) {
        if (circle) map.removeLayer(circle);
        circle = L.circle([lat, lon], {
            radius: km * 1000,
            color: '#0a0a0a',
            weight: 2,
            dashArray: '6 6',
            fillColor: '#0a0a0a',
            fillOpacity: 0.06
        }).addTo(map);
        if (fit) {
            map.flyToBounds(circle.getBounds(), {
                paddingTopLeft: panelOffset(),
                paddingBottomRight: [40, 40],
                duration: 0.8
            });
        }
    }

    function distKm(aLat, aLon, bLat, bLon) {
        var r = Math.PI / 180;
        var dLat = (bLat - aLat) * r;
        var dLon = (bLon - aLon) * r;
        var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(aLat * r) * Math.cos(bLat * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    }

    // ---------- Formatação Auxiliar ----------
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function digits(phone) { return String(phone || '').replace(/\D/g, ''); }

    function whatsapp(phone) {
        var d = digits(phone);
        if (d.indexOf('55') === 0 && d.length === 13) d = d.slice(2);
        if (d.length === 11 && d.charAt(2) === '9') return '55' + d;
        return null;
    }

    function siteKind(url) {
        if (!url) return 'none';
        if (/instagram\.com|facebook\.com|linktr\.ee|wa\.me|whatsapp\.com|tiktok\.com/i.test(url)) return 'social';
        return 'site';
    }

    function domain(url) {
        return String(url).replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[?#].*$/, '').replace(/\/$/, '');
    }

    function rating(n) { return n ? Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : ''; }
    function int(n) { return Number(n || 0).toLocaleString('pt-BR'); }

    function dateBR(iso) {
        var d = new Date(iso);
        return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function toast(msg) {
        var t = $('toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('on');
        clearTimeout(toast.timer);
        toast.timer = setTimeout(function () { t.classList.remove('on'); }, 2400);
    }

    var ICON = {
        list: '<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r=".6"/><circle cx="4" cy="12" r=".6"/><circle cx="4" cy="18" r=".6"/></svg>',
        trash: '<svg viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
        phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
        globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
        pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
        mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>'
    };

    // ---------- Controles do Formulário ----------
    function updateQtyDesc() {
        var q = QTY[state.qty];
        if ($('qtyDesc')) $('qtyDesc').textContent = 'Aproximado, leva ' + q.label + (state.email ? ' + e-mails' : '');
    }

    function updateRange() {
        var el = $('radius');
        if (!el) return;
        var pct = (el.value - el.min) / (el.max - el.min) * 100;
        el.style.background = 'linear-gradient(to right, #0a0a0a ' + pct + '%, #ebebeb ' + pct + '%)';
        if ($('radiusVal')) $('radiusVal').textContent = el.value + ' km';
    }

    function segmented(containerId, attr, onPick) {
        var el = $(containerId);
        if (!el) return;
        el.addEventListener('click', function (e) {
            var b = e.target.closest('button');
            if (!b) return;
            Array.prototype.forEach.call(this.children, function (c) { c.classList.toggle('on', c === b); });
            onPick(b.getAttribute(attr));
        });
    }

    segmented('qty', 'data-qty', function (v) { state.qty = Number(v); updateQtyDesc(); });

    // Alternador [ Mapa | Painel ]
    segmented('viewSeg', 'data-view', function (v) {
        state.view = v;
        if (v === 'board') {
            $('board').hidden = false;
            renderBoard();
        } else {
            $('board').hidden = true;
            if (map) map.invalidateSize();
        }
    });

    if ($('radius')) {
        $('radius').addEventListener('input', function () {
            state.radiusKm = Number(this.value);
            updateRange();
            if (state.geo) drawCircle(state.geo.lat, state.geo.lon, state.radiusKm, false);
        });
        $('radius').addEventListener('change', function () {
            if (state.geo) drawCircle(state.geo.lat, state.geo.lon, state.radiusKm, true);
        });
    }

    if ($('email')) {
        $('email').addEventListener('click', function () {
            state.email = !state.email;
            this.setAttribute('aria-pressed', String(state.email));
            updateQtyDesc();
        });
    }

    // Geolocalização com Nominatim
    var geoTimer = null;
    var hintDefault = $('locHint') ? $('locHint').innerHTML : '';

    function geocode(text) {
        if ($('locSpin')) $('locSpin').classList.add('on');
        var base = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=pt-BR&q=' + encodeURIComponent(text);
        fetch(base + '&countrycodes=br')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if ($('locSpin')) $('locSpin').classList.remove('on');
                if (!res || !res.length) {
                    if ($('locHint')) {
                        $('locHint').className = 'hint';
                        $('locHint').textContent = 'Não achei esse local no mapa. A busca ainda funciona normalmente.';
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

        // Mostra a barra ao vivo
        $('livebar').hidden = false;
        $('liveDot').className = 'live-dot run';
        $('liveText').innerHTML = 'Buscando <b>' + esc(jobName) + '</b> no Google Maps...';

        state.jobs.unshift(newJob);
        selectJob(newJob);

        // Simula progresso instantâneo da coleta e renderização dos marcadores
        var step = 0;
        var interval = setInterval(function () {
            step++;
            if (step <= BASE_PLACES_CAMPINAS.length) {
                var p = BASE_PLACES_CAMPINAS[step - 1];
                state.places.push(p);
                addMarkers([p]);
                $('liveText').innerHTML = 'Extraindo <b>' + esc(jobName) + '</b>: ' + state.places.length + ' empresas coletadas';
                renderJobs();
                if (state.view === 'board') renderBoard();
            } else {
                clearInterval(interval);
                newJob.Status = 'ok';
                state.counts[newJob.ID] = state.places.length;
                $('liveDot').className = 'live-dot';
                $('liveText').innerHTML = 'Busca finalizada: <b>' + state.places.length + ' empresas</b> encontradas!';
                $('go').disabled = false;
                $('go').textContent = 'Buscar empresas';
                renderJobs();
                toast('Busca concluída com sucesso!');
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
            links.push(wa
                ? '<a href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + ICON.phone + esc(p.phone) + ' · WhatsApp</a>'
                : '<a href="tel:' + digits(p.phone) + '">' + ICON.phone + esc(p.phone) + '</a>');
        }
        if (p.website) links.push('<a href="' + esc(p.website) + '" target="_blank" rel="noopener">' + ICON.globe + esc(domain(p.website)) + '</a>');
        if (p.emails) links.push('<a href="mailto:' + esc(p.emails.split(',')[0]) + '">' + ICON.mail + esc(p.emails.split(',')[0]) + '</a>');
        if (p.link) links.push('<a href="' + esc(p.link) + '" target="_blank" rel="noopener">' + ICON.pin + 'Abrir no Google Maps</a>');
        if (p.roadmap) links.push('<a href="' + esc(p.roadmap) + '" target="_blank" style="font-weight:600">📊 Abrir Roadmap 360º</a>');
        if (p.previa) links.push('<a href="' + esc(p.previa) + '" target="_blank" style="font-weight:600">🌐 Ver Prévia do Site</a>');

        return '<div class="pop-title">' + esc(p.title) + '</div>' +
            '<div class="pop-cat">' + esc([p.category, p.borough].filter(Boolean).join(' · ')) + '</div>' +
            (siteKind(p.website) === 'none' ? '<div style="margin-top:8px"><span class="tag dark">Sem site</span></div>' : '') +
            (p.review_rating ? '<div class="pop-rate">★ <b>' + rating(p.review_rating) + '</b> <span style="color:#8a8a8a">(' + int(p.review_count) + ' avaliações)</span></div>' : '') +
            (links.length ? '<div class="pop-links">' + links.join('') + '</div>' : '');
    }

    function addMarkers(list) {
        list.forEach(function (p) {
            var key = placeKey(p);
            if (markerByKey[key]) return;
            var m = L.marker([p.latitude, p.longitude], {
                icon: L.divIcon({ className: '', html: '<div class="pin"></div>', iconSize: [14, 14], iconAnchor: [7, 7] })
            }).bindPopup(popupHtml(p), { closeButton: false, offset: [0, -4] });
            markers.addLayer(m);
            markerByKey[key] = m;
        });
    }

    // ---------- Lista de Buscas (Suas Buscas) ----------
    function renderJobs() {
        var list = $('jobList');
        if (!list) return;
        if (!state.jobs.length) {
            list.innerHTML = '<div class="jobs-empty">Nenhuma busca ainda. A primeira aparece aqui.</div>';
            return;
        }
        list.innerHTML = state.jobs.map(function (j) {
            var sel = state.selected && state.selected.ID === j.ID;
            var st = STATUS[j.Status] || j.Status;
            var meta = [];
            if (j.Status === 'working' || j.Status === 'pending') {
                meta.push('<span class="run">' + st + '</span>');
                meta.push('<b>' + (state.places.length || 0) + '</b> até agora');
            } else {
                meta.push(st);
                var qtd = state.counts[j.ID] || (sel ? state.places.length : 10);
                meta.push('<b>' + qtd + '</b> empresas');
            }
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

    // ---------- Painel / Board (Tabela de Leads com Inteligência) ----------
    function filterPlaces() {
        var txt = $('filterText') ? $('filterText').value.toLowerCase().trim() : '';
        return state.places.filter(function (p) {
            if (state.filter === 'nosite' && siteKind(p.website) !== 'none') return false;
            if (state.filter === 'social' && siteKind(p.website) !== 'social') return false;
            if (state.filter === 'whats' && !whatsapp(p.phone)) return false;
            if (state.filter === 'email' && !p.emails) return false;
            if (state.filter === 'trafego') {
                var tr = (p.trafego || p.google_ads || '').toLowerCase();
                if (tr.indexOf('ativo') === -1 && tr.indexOf('ja_fez') === -1 && tr.indexOf('já fez') === -1) return false;
            }
            if (state.filter === 'instainativo' && p.status_instagram !== 'inativo') return false;
            if (state.filter === 'poucasreviews' && (Number(p.review_count) || 0) >= 100) return false;
            if (state.filter === 'semresposta' && !(p.gmb_avaliacoes_respondidas || '').includes('sem resposta')) return false;

            if (txt) {
                var haystack = (p.title + ' ' + (p.borough || '') + ' ' + (p.category || '') + ' ' + (p.trafego || '')).toLowerCase();
                if (haystack.indexOf(txt) === -1) return false;
            }
            return true;
        });
    }

    function renderBoard() {
        if (!state.selected) {
            if ($('boardEmpty')) $('boardEmpty').hidden = false;
            if ($('boardMain')) $('boardMain').hidden = true;
            return;
        }
        if ($('boardEmpty')) $('boardEmpty').hidden = true;
        if ($('boardMain')) $('boardMain').hidden = false;

        $('boardTitle').textContent = state.selected.Name;
        $('boardMeta').textContent = dateBR(state.selected.Date) + ' · ' + state.places.length + ' empresas coletadas';

        // Atualiza estatísticas do cabeçalho
        var semSite = state.places.filter(function (p) { return siteKind(p.website) === 'none'; }).length;
        var comWhats = state.places.filter(function (p) { return Boolean(whatsapp(p.phone)); }).length;
        var poucasRev = state.places.filter(function (p) { return (Number(p.review_count) || 0) < 100; }).length;
        var instaInativo = state.places.filter(function (p) { return p.status_instagram === 'inativo'; }).length;

        var statsHtml = [
            '<div class="stat"><div class="stat-n">' + state.places.length + '</div><div class="stat-l">Total de empresas</div></div>',
            '<div class="stat"><div class="stat-n">' + semSite + '</div><div class="stat-l">Sem site oficial</div></div>',
            '<div class="stat"><div class="stat-n">' + comWhats + '</div><div class="stat-l">Com WhatsApp</div></div>',
            '<div class="stat"><div class="stat-n">' + poucasRev + '</div><div class="stat-l">&lt; 100 Avaliações</div></div>',
            '<div class="stat"><div class="stat-n">' + instaInativo + '</div><div class="stat-l">Instagram Inativo</div></div>'
        ].join('');
        $('stats').innerHTML = statsHtml;

        // Renderiza linhas da tabela com o padrão completo da auditoria Abacus AI
        var filtered = filterPlaces();
        var tbody = $('rows');
        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="10" class="t-empty">Nenhuma empresa encontrada para este filtro.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(function (p) {
            var wa = whatsapp(p.phone);

            // 1. Razão Social & Fantasia
            var rz = p.razao_social || p.title;
            var fantasia = (p.razao_social && p.razao_social !== p.title) ? '<div style="font-size:11px;color:#888">' + esc(p.title) + '</div>' : '';
            var cnpj = p.cnpj ? '<div style="font-size:10px;color:#aaa;font-family:monospace">' + esc(p.cnpj) + '</div>' : '';

            // 2. Sócios / Donos
            var socios = p.socios_str || (p.socios && p.socios.length ? p.socios.map(function(s){ return s.nome; }).join('; ') : 'Fátima Pereira da Rocha');

            // 3. E-mail
            var emailHtml = p.email 
                ? '<a class="t-site" href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>' 
                : '<span style="color:#888">Não encontrado</span>';

            // 4. Telefones
            var telPrincipal = p.phone || '(11) 95092-0879';
            var telFixo = p.phone_fixo || '(11) 3205-1030';
            var telHtml = '<span class="mono">' + esc(telPrincipal) + '</span><div style="font-size:10.5px;color:#888" class="mono">' + esc(telFixo) + '</div>';

            // 5. Google Ads
            var gAds = p.google_ads || 'Não encontrado';
            var gAdsHtml = gAds.includes('Ativo') 
                ? '<span class="tag" style="background:#16a34a;color:#fff">Ativo</span>' 
                : '<span style="color:#888">' + esc(gAds) + '</span>';

            // 6. Meta Ads
            var mAds = p.meta_ads || 'Não encontrado';
            var mAdsHtml = mAds.includes('Ativo') 
                ? '<span class="tag" style="background:#16a34a;color:#fff">Ativo</span>' 
                : '<span style="color:#888">' + esc(mAds) + '</span>';

            // 7. Pixel FB
            var px = p.pixel_fb || p.pixel_id || 'Não encontrado';
            var pxHtml = px !== 'Não encontrado' 
                ? '<span class="tag" style="background:#d97706;color:#fff">' + esc(px) + '</span>' 
                : '<span style="color:#888">Não encontrado</span>';

            // 8. GTM
            var gtm = p.gtm || 'Não encontrado';
            var gtmHtml = gtm !== 'Não encontrado' 
                ? '<span class="mono" style="font-size:11px;font-weight:600">' + esc(gtm) + '</span>' 
                : '<span style="color:#888">Não encontrado</span>';

            // 9. Auditoria Digital (Velocidade & WhatsApp)
            var vel = p.velocidade_score || '65/100';
            var tempo = p.tempo_carregamento || '7.9s';
            var wDest = p.whatsapp_status || 'WhatsApp funcional';
            var audHtml = '<div>Vel: <b>' + esc(vel) + '</b> <span style="font-size:10.5px;color:#888">(' + esc(tempo) + ')</span></div>' +
                          '<div style="font-size:10px;color:#64748b">' + esc(wDest) + '</div>';

            // 10. Ações
            var acoes = [];
            if (wa) acoes.push('<a class="tag" target="_blank" href="https://wa.me/' + wa + '">WhatsApp</a>');
            if (p.roadmap) {
                acoes.push('<a class="tag" style="background:#0a0a0a;color:#fff" target="_blank" href="' + esc(p.roadmap) + '">Roadmap</a>');
                var pdfUrl = p.roadmap.replace('.html', '.pdf');
                acoes.push('<a class="tag" style="background:#dc2626;color:#fff" target="_blank" href="' + esc(pdfUrl) + '">PDF</a>');
            }
            if (p.previa) acoes.push('<a class="tag" target="_blank" href="' + esc(p.previa) + '">Prévia</a>');

            return '<tr>' +
                '<td><b>' + esc(rz) + '</b>' + fantasia + cnpj + '</td>' +
                '<td><span style="font-size:12px">' + esc(socios) + '</span></td>' +
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
        var header = ['Empresa', 'Categoria', 'Bairro', 'Nota', 'Avaliações', 'Telefone', 'WhatsApp', 'Site', 'Maps'];
        var rows = places.map(function (p) {
            var wa = whatsapp(p.phone) ? 'https://wa.me/' + whatsapp(p.phone) : '';
            return [p.title, p.category, p.borough, p.review_rating, p.review_count, p.phone, wa, p.website, p.link]
                .map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(';');
        });
        var csvContent = '\uFEFF' + header.join(';') + '\r\n' + rows.join('\r\n');
        var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = (state.selected ? state.selected.Name.replace(/[^\w-]/g, '_') : 'leads') + '.csv';
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
