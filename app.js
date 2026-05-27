// ShipSpotter — app.js
// Firebase Auth + Firestore + Gemini 1.5 Flash (free)
'use strict';

/* =============================================
   CONSTANTS
   ============================================= */
const TYPE_ICONS = {
    cruise:        '\u{1F6F3}',
    container:     '\u{1F4E6}',
    bulk:          '\u2693',
    tanker:        '\u{1F6E2}',
    coastguard:    '\u{1F6A8}',
    military:      '\u2694',
    'car-carrier': '\u{1F697}',
    megayacht:     '\u26F5',
};
const TYPE_NAMES = {
    cruise:        'Cruise Ship',
    container:     'Container Ship',
    bulk:          'Bulk Carrier',
    tanker:        'Oil Tanker',
    coastguard:    'Coast Guard',
    military:      'Military Ship',
    'car-carrier': 'Car Carrier',
    megayacht:     'Mega Yacht',
};
const RARITY_ORDER  = { legendary:0, epic:1, rare:2, uncommon:3, common:4 };
const BASE_POINTS   = { common:100, uncommon:250, rare:500, epic:1000, legendary:2500 };

/* =============================================
   STATE
   ============================================= */
const S = {
    user:              null,   // Firebase user object
    collection:        [],     // local cache of Firestore docs
    pendingCard:       null,
    pendingIsDuplicate:false,
    capturedDataUrl:   null,
    currentFilter:     'all',
    geminiKey:         null,
    db:                null,
    auth:              null,
};

/* =============================================
   FIREBASE INIT
   ============================================= */
function initFirebase() {
    // FIREBASE and GEMINI_API_KEY come from firebase-config.js
    if (typeof FIREBASE === 'undefined') {
        fatalError('firebase-config.js not loaded. Open firebase-config.js and fill in your values.');
        return;
    }
    firebase.initializeApp(FIREBASE);
    S.db   = firebase.firestore();
    S.auth = firebase.auth();

    S.geminiKey = typeof GEMINI_API_KEY !== 'undefined' ? GEMINI_API_KEY : '';

    // Listen for auth state changes
    S.auth.onAuthStateChanged(onAuthChange);
}

function fatalError(msg) {
    document.body.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;
                  height:100vh;padding:30px;background:#091525;color:#f87171;
                  font-family:sans-serif;text-align:center;flex-direction:column;gap:16px;">
        <div style="font-size:48px">&#9875;</div>
        <h2>Setup Required</h2>
        <p style="color:#94a3b8;max-width:340px;line-height:1.6">${msg}</p>
      </div>`;
}

/* =============================================
   AUTH STATE HANDLER
   ============================================= */
async function onAuthChange(user) {
    if (user) {
        S.user = user;
        showScreen('main');
        updateAccountUI();
        await loadCollection();
        updateStats();
        renderCollection();
    } else {
        S.user       = null;
        S.collection = [];
        showScreen('auth');
        hideSplash();
    }
}

function hideSplash() {
    const splash = document.getElementById('screen-splash');
    if (splash) splash.classList.remove('active');
}

/* =============================================
   COLLECTION — FIRESTORE
   ============================================= */
function shipsRef() {
    return S.db.collection('users').doc(S.user.uid).collection('ships');
}

async function loadCollection() {
    try {
        const snap = await shipsRef().orderBy('capturedAt', 'desc').get();
        S.collection = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
        console.error('Load error:', e);
        showToast('Could not load fleet from cloud', 'error');
        S.collection = [];
    }
}

async function saveCardToFirestore(card) {
    // Store the photo as base64 inside the Firestore document.
    // Images are compressed to ~480px / 65% quality before this point (~25-50 KB).
    await shipsRef().doc(card.id).set(card);
}

async function deleteCardFromFirestore(cardId) {
    await shipsRef().doc(cardId).delete();
}

/* =============================================
   AUTH ACTIONS
   ============================================= */
async function signInEmail(email, password) {
    await S.auth.signInWithEmailAndPassword(email, password);
}

async function signUpEmail(name, email, password) {
    const cred = await S.auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    S.user = cred.user;
}

async function signInGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    await S.auth.signInWithPopup(provider);
}

async function signOut() {
    await S.auth.signOut();
    S.collection = [];
}

/* =============================================
   GEMINI API — SHIP IDENTIFICATION (FREE)
   ============================================= */
const IDENTIFY_PROMPT = `You are a maritime expert and ship identification specialist.

Examine the image carefully and identify the ship shown. Return ONLY a JSON object — no markdown fences, no explanation. Use this exact structure:

{
  "name": "Specific ship name, or 'Unknown [Type]' if unidentifiable",
  "line": "Shipping company / owner, or 'Independent'",
  "type": "one of exactly: cruise | container | bulk | tanker | coastguard | military | car-carrier | megayacht",
  "length": 300,
  "width": 45,
  "height": 55,
  "tonnage": 150000,
  "yearBuilt": 2012,
  "maxPassengers": 3000,
  "description": "2-3 sentence description of this vessel or ship class.",
  "funFact": "One interesting fact about this ship or its class.",
  "isRare": false,
  "estimatedValue": 650,
  "confidence": "high"
}

Field rules:
- length / width / height: metres, numbers only
- tonnage: gross tonnage, number only
- maxPassengers: total passengers (0 for pure cargo; include crew for military/coastguard)
- estimatedValue: millions USD, number only
- isRare: true if vessel is historically significant, famous, unique, or unusual
- confidence: "high" = specific ship identified, "medium" = class/type identified, "low" = rough type only
- If the image has NO ship at all, return exactly the string: null

Use real-world data when you can identify the vessel. Otherwise provide accurate typical values for the class visible.`;

async function callGemini(imageDataUrl) {
    const key = S.geminiKey;
    if (!key || key === 'YOUR_GEMINI_API_KEY') {
        throw new Error('No Gemini API key set. Open Settings and add your free key from aistudio.google.com');
    }

    const resized = await resizeImage(imageDataUrl, 900, 0.75);
    const b64     = resized.split(',')[1];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;

    const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: IDENTIFY_PROMPT },
                    { inline_data: { mime_type: 'image/jpeg', data: b64 } },
                ],
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
        }),
    });

    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err?.error?.message || ('Gemini API error ' + resp.status);
        throw new Error(msg);
    }

    const data    = await resp.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (rawText === 'null') return null;
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
}

/* =============================================
   IMAGE HELPERS
   ============================================= */
async function resizeImage(dataUrl, maxPx = 900, quality = 0.75) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            let w = img.width, h = img.height;
            if (w > maxPx || h > maxPx) {
                if (w >= h) { h = Math.round(h / w * maxPx); w = maxPx; }
                else        { w = Math.round(w / h * maxPx); h = maxPx; }
            }
            const c = document.createElement('canvas');
            c.width = w; c.height = h;
            c.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(c.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

/* =============================================
   RARITY + POINTS
   ============================================= */
function determineRarity(ship) {
    let score = Math.random() * 55;

    if      (ship.type === 'military')    score += 32;
    else if (ship.type === 'megayacht')   score += 22;
    else if (ship.type === 'coastguard')  score += 12;

    const age = new Date().getFullYear() - (ship.yearBuilt || new Date().getFullYear());
    if      (age >= 60) score += 28;
    else if (age >= 40) score += 20;
    else if (age >= 25) score += 12;
    else if (age >= 15) score += 6;

    if (ship.isRare) score += 28;

    if      (ship.estimatedValue >= 1500) score += 18;
    else if (ship.estimatedValue >= 700)  score += 10;

    if (ship.confidence === 'low') score -= 14;

    if (score >= 110) return 'legendary';
    if (score >= 88)  return 'epic';
    if (score >= 66)  return 'rare';
    if (score >= 40)  return 'uncommon';
    return 'common';
}

function calcPoints(ship, rarity) {
    const base     = BASE_POINTS[rarity];
    const age      = new Date().getFullYear() - (ship.yearBuilt || new Date().getFullYear());
    const ageBonus = age > 15 ? Math.min(age * 9, 600) : 0;
    const typeBonus =
        ['military','megayacht'].includes(ship.type) ? 350 :
        ship.type === 'coastguard' ? 175 : 0;
    const rareBonus = ship.isRare ? 450 : 0;
    const valBonus  =
        ship.estimatedValue >= 1500 ? 220 :
        ship.estimatedValue >= 700  ? 110 : 0;
    const confBonus =
        ship.confidence === 'high'   ? 120 :
        ship.confidence === 'medium' ? 60  : 0;

    const total = base + ageBonus + typeBonus + rareBonus + valBonus + confBonus;
    return { base, ageBonus, typeBonus, rareBonus, valBonus, confBonus, total };
}

/* =============================================
   CARD HTML BUILDERS
   ============================================= */
function escHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function fmt(n) { return (n ?? 0).toLocaleString(); }
function capFirst(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

function buildFullCard(card) {
    const icon     = TYPE_ICONS[card.type] || '\u{1F6A2}';
    const tname    = TYPE_NAMES[card.type] || capFirst(card.type);
    const rarity   = card.rarity;
    const rLabel   = capFirst(rarity);
    const bd       = card.pointsBreakdown;

    const imgHtml = card.photoDataUrl
        ? `<img src="${card.photoDataUrl}" class="full-img" alt="${escHtml(card.name)}">`
        : `<div class="full-img-placeholder">${icon}</div>`;

    const bRows = [
        { label:`Base (${rLabel})`,        val:bd.base },
        { label:'Age Bonus',               val:bd.ageBonus,   hide:!bd.ageBonus },
        { label:'Special Vessel Type',     val:bd.typeBonus,  hide:!bd.typeBonus },
        { label:'Notable / Rare Ship',     val:bd.rareBonus,  hide:!bd.rareBonus },
        { label:'High-Value Vessel',       val:bd.valBonus,   hide:!bd.valBonus },
        { label:'Identification Bonus',    val:bd.confBonus,  hide:!bd.confBonus },
    ].filter(r => !r.hide);

    const date = new Date(card.capturedAt).toLocaleDateString('en-US',
        { month:'short', day:'numeric', year:'numeric' });

    return `
<div class="full-card r-${rarity}">
  ${imgHtml}
  <div class="full-card-header">
    <div class="full-points-badge">&#11088; ${fmt(card.points)} pts</div>
    <div class="full-rarity-badge r-${rarity}">${rLabel}</div>
    <div class="full-name">${escHtml(card.name)}</div>
    <div class="full-line">${escHtml(card.line)}</div>
    <div class="full-type">${icon} ${tname}</div>
  </div>
  <div class="stats-grid">
    <div class="stat-cell"><div class="stat-cell-label">Length</div><div class="stat-cell-val">${card.length ? card.length+' m':'—'}</div></div>
    <div class="stat-cell"><div class="stat-cell-label">Width (Beam)</div><div class="stat-cell-val">${card.width ? card.width+' m':'—'}</div></div>
    <div class="stat-cell"><div class="stat-cell-label">Height</div><div class="stat-cell-val">${card.height ? card.height+' m':'—'}</div></div>
    <div class="stat-cell"><div class="stat-cell-label">Tonnage</div><div class="stat-cell-val">${card.tonnage ? fmt(card.tonnage)+' GT':'—'}</div></div>
    <div class="stat-cell"><div class="stat-cell-label">Year Built</div><div class="stat-cell-val">${card.yearBuilt||'—'}</div></div>
    <div class="stat-cell"><div class="stat-cell-label">Max Passengers</div><div class="stat-cell-val">${card.maxPassengers!=null ? fmt(card.maxPassengers):'—'}</div></div>
    <div class="stat-cell"><div class="stat-cell-label">Est. Value</div><div class="stat-cell-val">${card.estimatedValue ? '$'+card.estimatedValue+'M':'—'}</div></div>
    <div class="stat-cell"><div class="stat-cell-label">Confidence</div><div class="stat-cell-val" style="text-transform:capitalize">${card.confidence||'—'}</div></div>
  </div>
  <div class="card-desc">
    ${card.description ? `<p>${escHtml(card.description)}</p>` : ''}
    ${card.funFact ? `<div class="fun-fact-box"><strong>&#9875; Fun Fact</strong><p>${escHtml(card.funFact)}</p></div>` : ''}
  </div>
  <div class="points-breakdown">
    <h4>Points Breakdown</h4>
    ${bRows.map(r=>`<div class="pts-row"><span>${r.label}</span><span>+${fmt(r.val)}</span></div>`).join('')}
    <div class="pts-row"><span>Total</span><span>${fmt(card.points)}</span></div>
  </div>
  <span class="spotted-date">Spotted on ${date}</span>
</div>`;
}

function buildMiniCard(card, isNew = false) {
    const icon  = TYPE_ICONS[card.type] || '\u{1F6A2}';
    const tname = TYPE_NAMES[card.type] || capFirst(card.type);
    const imgHtml = card.photoDataUrl
        ? `<img src="${card.photoDataUrl}" class="mini-img" alt="${escHtml(card.name)}" loading="lazy">`
        : `<div class="mini-img-placeholder">${icon}</div>`;
    return `
<div class="mini-card r-${card.rarity}" onclick="openDetail('${card.id}')">
  ${isNew ? '<div class="new-badge">NEW</div>' : ''}
  ${imgHtml}
  <div class="mini-body">
    <div class="mini-rarity r-${card.rarity}">${capFirst(card.rarity)}</div>
    <div class="mini-name">${escHtml(card.name)}</div>
    <div class="mini-type">${icon} ${tname}</div>
    <div class="mini-points">&#11088; ${fmt(card.points)}</div>
  </div>
</div>`;
}

/* =============================================
   COLLECTION RENDER
   ============================================= */
function renderCollection() {
    let cards = [...S.collection];
    if (S.currentFilter !== 'all') cards = cards.filter(c => c.type === S.currentFilter);
    cards.sort((a, b) => {
        const rd = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
        return rd !== 0 ? rd : b.points - a.points;
    });

    const grid = document.getElementById('collectionGrid');
    if (cards.length === 0) {
        const msg = S.currentFilter === 'all'
            ? 'Start spotting ships to build your fleet.'
            : `No ${TYPE_NAMES[S.currentFilter]||S.currentFilter} ships spotted yet.`;
        grid.innerHTML = `<div class="empty-state"><div class="empty-wave">&#127754;</div><h3>Empty waters!</h3><p>${msg}</p></div>`;
        return;
    }
    grid.innerHTML = cards.map(c => buildMiniCard(c)).join('');
}

function updateStats() {
    const total = S.collection.reduce((s, c) => s + (c.points || 0), 0);
    document.getElementById('headerPoints').textContent = fmt(total);
    document.getElementById('headerCards').textContent  = S.collection.length;
    document.getElementById('collectionCount').textContent =
        S.collection.length + ' ship' + (S.collection.length !== 1 ? 's' : '');
}

function updateAccountUI() {
    if (!S.user) return;
    const name  = S.user.displayName || S.user.email.split('@')[0] || 'Captain';
    const email = S.user.email || '';
    document.getElementById('accountName').textContent  = name;
    document.getElementById('accountEmail').textContent = email;
    document.getElementById('accountAvatar').textContent = name.charAt(0).toUpperCase();
}

/* =============================================
   CARD DETAIL
   ============================================= */
function openDetail(id) {
    const card = S.collection.find(c => c.id === id);
    if (!card) return;
    document.getElementById('detailContent').innerHTML = buildFullCard(card);
    showOverlay('detail');
}

/* =============================================
   IDENTIFY FLOW
   ============================================= */
async function startIdentify() {
    if (!S.capturedDataUrl) return;
    showOverlay('loading');
    document.getElementById('loadingTitle').textContent   = 'Identifying Ship\u2026';
    document.getElementById('loadingSubtext').textContent = 'Analyzing image with Gemini AI (free)';

    try {
        const shipData = await callGemini(S.capturedDataUrl);

        if (!shipData) {
            hideOverlay('loading');
            showToast('No ship detected \u2014 try a clearer photo', 'error');
            return;
        }

        const rarity = determineRarity(shipData);
        const pts    = calcPoints(shipData, rarity);

        // Compress photo for storage: max 480px, 65% quality (~20-40 KB)
        const compressedPhoto = await resizeImage(S.capturedDataUrl, 480, 0.65);

        const card = {
            id:              'ss-' + Date.now() + '-' + Math.random().toString(36).slice(2,8),
            name:            shipData.name            || 'Unknown Ship',
            line:            shipData.line            || 'Independent',
            type:            shipData.type            || 'cruise',
            length:          shipData.length          || null,
            width:           shipData.width           || null,
            height:          shipData.height          || null,
            tonnage:         shipData.tonnage         || null,
            yearBuilt:       shipData.yearBuilt       || null,
            maxPassengers:   shipData.maxPassengers   ?? null,
            description:     shipData.description     || '',
            funFact:         shipData.funFact         || '',
            isRare:          !!shipData.isRare,
            estimatedValue:  shipData.estimatedValue  || null,
            confidence:      shipData.confidence      || 'low',
            rarity,
            points:          pts.total,
            pointsBreakdown: pts,
            photoDataUrl:    compressedPhoto,
            capturedAt:      new Date().toISOString(),
        };

        const isDup = S.collection.some(
            c => c.name.toLowerCase() === card.name.toLowerCase());

        S.pendingCard        = card;
        S.pendingIsDuplicate = isDup;

        hideOverlay('loading');
        showResultScreen(card, isDup);

    } catch (err) {
        hideOverlay('loading');
        console.error(err);
        const raw = err.message || '';
        const msg =
            raw.includes('API_KEY_INVALID') || raw.includes('API key') ? 'Gemini API key error \u2014 contact the app owner' :
            raw.includes('429') ? 'Rate limited \u2014 wait a moment (free tier: 15 req/min)' :
            raw.includes('No Gemini') ? err.message :
            'Identification failed: ' + raw.slice(0, 80);
        showToast(msg, 'error');
    }
}

function showResultScreen(card, isDup) {
    document.getElementById('resultCardWrapper').innerHTML = buildFullCard(card);
    document.getElementById('duplicateBanner').classList.toggle('hidden', !isDup);
    const addBtn = document.getElementById('addToCollectionBtn');
    if (isDup) {
        addBtn.textContent = 'Already Collected';
        addBtn.disabled    = true;
        addBtn.style.opacity = '0.5';
    } else {
        addBtn.textContent   = '\u2713 Add to Fleet';
        addBtn.disabled      = false;
        addBtn.style.opacity = '';
    }
    showOverlay('result');
}

async function addToFleet() {
    const card = S.pendingCard;
    if (!card || S.pendingIsDuplicate) return;

    const addBtn = document.getElementById('addToCollectionBtn');
    addBtn.disabled    = true;
    addBtn.textContent = 'Saving\u2026';

    try {
        await saveCardToFirestore(card);
        S.collection.unshift(card);
        updateStats();
        renderCollection();
        hideOverlay('result');
        resetCamera();
        showToast(`${card.name} added! +${fmt(card.points)} pts`, 'success');
        setTimeout(() => switchTab('collection'), 400);
    } catch (e) {
        console.error(e);
        showToast('Could not save to cloud \u2014 check connection', 'error');
        addBtn.disabled    = false;
        addBtn.textContent = '\u2713 Add to Fleet';
    }

    S.pendingCard = null;
}

/* =============================================
   CAMERA RESET
   ============================================= */
function resetCamera() {
    S.capturedDataUrl = null;
    S.pendingCard     = null;
    const img = document.getElementById('capturedImage');
    img.src = ''; img.classList.add('hidden');
    document.getElementById('cameraPlaceholder').classList.remove('hidden');
    document.getElementById('identifySection').classList.add('hidden');
    document.getElementById('cameraInput').value = '';
}

/* =============================================
   SCREEN / OVERLAY HELPERS
   ============================================= */
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen-' + id);
    if (el) el.classList.add('active');
}
function showOverlay(id) { document.getElementById('screen-' + id)?.classList.remove('hidden'); }
function hideOverlay(id) { document.getElementById('screen-' + id)?.classList.add('hidden'); }

function switchTab(tab) {
    document.querySelectorAll('.nav-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.tab === tab));
    document.querySelectorAll('.tab-content').forEach(c =>
        c.classList.toggle('active', c.id === 'tab-' + tab));
    if (tab === 'collection') renderCollection();
}

/* =============================================
   TOAST
   ============================================= */
let toastTimer = null;
function showToast(msg, type = 'success') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className   = 'toast ' + type + ' show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3400);
}

/* =============================================
   AUTH HELPERS
   ============================================= */
function setAuthError(formId, msg) {
    const el = document.getElementById(formId + 'Error');
    el.textContent = msg;
    el.classList.toggle('hidden', !msg);
}

function showAuthForm(which) {
    document.getElementById('authSignIn').classList.toggle('hidden', which !== 'signin');
    document.getElementById('authSignUp').classList.toggle('hidden', which !== 'signup');
    document.querySelectorAll('.auth-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.auth === which));
    setAuthError('si', ''); setAuthError('su', '');
}

/* =============================================
   EVENT WIRING
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Check config is loaded
    if (typeof FIREBASE === 'undefined' || FIREBASE.apiKey === 'YOUR_FIREBASE_API_KEY') {
        fatalError('Open <code>firebase-config.js</code> and fill in your Firebase project values and Gemini API key. Both are free!');
        return;
    }
    initFirebase();

    // ---- Auth tab switching ----
    document.querySelectorAll('.auth-tab').forEach(btn =>
        btn.addEventListener('click', () => showAuthForm(btn.dataset.auth)));

    // ---- Sign In ----
    document.getElementById('siBtn').addEventListener('click', async () => {
        const email = document.getElementById('siEmail').value.trim();
        const pass  = document.getElementById('siPassword').value;
        if (!email || !pass) { setAuthError('si', 'Please fill in all fields.'); return; }
        try {
            document.getElementById('siBtn').textContent = 'Signing in\u2026';
            await signInEmail(email, pass);
        } catch (e) {
            setAuthError('si', friendlyAuthError(e));
            document.getElementById('siBtn').textContent = 'Sign In';
        }
    });
    document.getElementById('siPassword').addEventListener('keypress', e => {
        if (e.key === 'Enter') document.getElementById('siBtn').click();
    });

    // ---- Sign Up ----
    document.getElementById('suBtn').addEventListener('click', async () => {
        const name  = document.getElementById('suName').value.trim();
        const email = document.getElementById('suEmail').value.trim();
        const pass  = document.getElementById('suPassword').value;
        if (!name || !email || !pass) { setAuthError('su', 'Please fill in all fields.'); return; }
        if (pass.length < 6) { setAuthError('su', 'Password must be at least 6 characters.'); return; }
        try {
            document.getElementById('suBtn').textContent = 'Creating account\u2026';
            await signUpEmail(name, email, pass);
        } catch (e) {
            setAuthError('su', friendlyAuthError(e));
            document.getElementById('suBtn').textContent = 'Create Account';
        }
    });

    // ---- Google Sign In / Sign Up ----
    ['googleSignInBtn','googleSignUpBtn'].forEach(id => {
        document.getElementById(id).addEventListener('click', async () => {
            try { await signInGoogle(); }
            catch (e) {
                const target = id === 'googleSignInBtn' ? 'si' : 'su';
                setAuthError(target, friendlyAuthError(e));
            }
        });
    });

    // ---- Navigation ----
    document.querySelectorAll('.nav-btn').forEach(btn =>
        btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    // ---- Camera ----
    document.getElementById('captureBtn').addEventListener('click', () =>
        document.getElementById('cameraInput').click());

    document.getElementById('cameraInput').addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => {
            S.capturedDataUrl = evt.target.result;
            const img = document.getElementById('capturedImage');
            img.src = S.capturedDataUrl;
            img.classList.remove('hidden');
            document.getElementById('cameraPlaceholder').classList.add('hidden');
            document.getElementById('identifySection').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    });

    document.getElementById('identifyBtn').addEventListener('click', startIdentify);
    document.getElementById('retakeBtn').addEventListener('click', resetCamera);

    // ---- Result overlay ----
    document.getElementById('closeResultBtn').addEventListener('click', () => {
        hideOverlay('result'); S.pendingCard = null;
    });
    document.getElementById('addToCollectionBtn').addEventListener('click', addToFleet);
    document.getElementById('discardBtn').addEventListener('click', () => {
        hideOverlay('result'); S.pendingCard = null;
    });

    // ---- Detail overlay ----
    document.getElementById('closeDetailBtn').addEventListener('click', () => hideOverlay('detail'));

    // ---- Settings ----
    document.getElementById('settingsBtn').addEventListener('click', () => {
        updateAccountUI();
        showOverlay('settings');
    });
    document.getElementById('closeSettingsBtn').addEventListener('click', () => hideOverlay('settings'));

    document.getElementById('signOutBtn').addEventListener('click', async () => {
        if (!confirm('Sign out of ShipSpotter?')) return;
        hideOverlay('settings');
        await signOut();
        showToast('Signed out', 'info');
    });

    document.getElementById('clearCollectionBtn').addEventListener('click', async () => {
        if (!confirm('Delete your ENTIRE fleet from the cloud? This cannot be undone.')) return;
        try {
            showOverlay('loading');
            document.getElementById('loadingTitle').textContent   = 'Clearing Fleet\u2026';
            document.getElementById('loadingSubtext').textContent = 'Deleting from cloud';
            const snap = await shipsRef().get();
            const batch = S.db.batch();
            snap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            S.collection = [];
            updateStats();
            renderCollection();
            hideOverlay('loading');
            hideOverlay('settings');
            showToast('Fleet cleared', 'info');
        } catch (e) {
            hideOverlay('loading');
            showToast('Error clearing fleet', 'error');
        }
    });

    // ---- Collection filters ----
    document.querySelectorAll('.filter-btn').forEach(btn =>
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            S.currentFilter = btn.dataset.filter;
            renderCollection();
        }));
});

// Friendly Firebase auth error messages
function friendlyAuthError(e) {
    const code = e.code || '';
    if (code.includes('user-not-found'))        return 'No account found with that email.';
    if (code.includes('wrong-password'))         return 'Incorrect password.';
    if (code.includes('email-already-in-use'))   return 'An account with that email already exists.';
    if (code.includes('invalid-email'))          return 'Please enter a valid email address.';
    if (code.includes('weak-password'))          return 'Password must be at least 6 characters.';
    if (code.includes('too-many-requests'))      return 'Too many attempts. Try again later.';
    if (code.includes('popup-closed-by-user'))   return 'Google sign-in was cancelled.';
    if (code.includes('network-request-failed')) return 'No internet connection.';
    return e.message || 'Authentication failed.';
}

// Expose for inline onclick
window.openDetail = openDetail;
