// ==UserScript==
// @name         Inactive Player Exporter (V 1.0.0)
// @namespace    https://github.com/Logical-Developer/inactive-player-exporter
// @version      1.0.0
// @description  Extract inactive villages from TravcoTools and export as Nova Farm Manager JSON. Formerly TravcoTools Exporter v0.0.
// @author       Logical-Developer
// @match        https://travcotools.com/en/inactive-search/*
// @grant        GM_addStyle
// @run-at       document-idle
// @homepageURL  https://github.com/Logical-Developer/inactive-player-exporter
// @supportURL   https://github.com/Logical-Developer/inactive-player-exporter/issues
// @updateURL    https://raw.githubusercontent.com/Logical-Developer/inactive-player-exporter/main/dist/InactivePlayerExporter.user.js
// @downloadURL  https://raw.githubusercontent.com/Logical-Developer/inactive-player-exporter/main/dist/InactivePlayerExporter.user.js
// ==/UserScript==

(function () {
    'use strict';

// ───── src/01-config.js ─────
// ========== Constants ==========
const VERSION = '1.0.0';
const STORAGE_KEY = 'ipe_state_v1';
const PANEL_UI_KEY = 'ipe_ui_v1'; // for panel minimized state
const NATAR_KEY = 'ipe_only_natar';
const TEMPLATE_KEY = 'ipe_troop_template';
const HERO_KEY = 'ipe_hero_follow';
const PANEL_ID = 'ipe-panel';
const MODAL_ID = 'ipe-json-modal';
const DELAY_BETWEEN_PAGES = 1500;
const TROOP_KEYS = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11'];
// Human-readable unit names (Gaul) used as native `title` tooltips on the troop inputs.
const TROOP_NAMES = {
    t1: 'Phalanx',
    t2: 'Swordsman',
    t3: 'Pathfinder',
    t4: 'Theutates Thunder',
    t5: 'Druidrider',
    t6: 'Haeduan',
    t7: 'Ram',
    t8: 'Trebuchet',
    t9: 'Chieftain',
    t10: 'Settler',
    t11: 'Hero'
};
const NATAR_MARKER = 'Natars'; // value shown in the "Travian account" column for natar villages

// ───── src/02-utils.js ─────
// ========== Utils ==========
const DEBUG_MODE = new URLSearchParams(window.location.search).has('ipe_debug');
const LOG_BUFFER = [];

function log(...args) {
    const line = '[IPE] ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
    LOG_BUFFER.push(line);
    if (LOG_BUFFER.length > 200) LOG_BUFFER.shift();
    if (DEBUG_MODE) console.log(line);
}

function esc(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function $(selector, root) {
    return (root || document).querySelector(selector);
}

function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
}

// ───── src/03-storage.js ─────
// ========== Storage ==========
function getState() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) || null; }
    catch (e) { return null; }
}
function setState(state) { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function clearState() { sessionStorage.removeItem(STORAGE_KEY); }

// Remove legacy v0.0 state once (no migration by design).
(function purgeLegacyState() {
    try {
        sessionStorage.removeItem('travco_exporter_state_v0');
        localStorage.removeItem('travco_exporter_ui_v0');
    } catch (e) { /* ignore */ }
})();

// ========== Panel UI State (minimized) ==========
function getPanelUI() {
    try { return JSON.parse(localStorage.getItem(PANEL_UI_KEY)) || { minimized: false }; }
    catch (e) { return { minimized: false }; }
}
function setPanelUI(ui) {
    try { localStorage.setItem(PANEL_UI_KEY, JSON.stringify(ui)); } catch (e) { /* ignore */ }
}

// ========== Persisted settings ==========
function getOnlyNatar() {
    try { return localStorage.getItem(NATAR_KEY) === 'true'; }
    catch (e) { return false; }
}
function setOnlyNatar(value) {
    try { localStorage.setItem(NATAR_KEY, value ? 'true' : 'false'); } catch (e) { /* ignore */ }
}

function getHeroFollowSetting() {
    try { return localStorage.getItem(HERO_KEY) === 'true'; }
    catch (e) { return false; }
}
function setHeroFollowSetting(value) {
    try { localStorage.setItem(HERO_KEY, value ? 'true' : 'false'); } catch (e) { /* ignore */ }
}

function getTemplateTroopsSetting() {
    try {
        const stored = JSON.parse(localStorage.getItem(TEMPLATE_KEY));
        if (stored && typeof stored === 'object') {
            const out = {};
            for (const k of TROOP_KEYS) out[k] = parseInt(stored[k], 10) || 0;
            return out;
        }
    } catch (e) { /* ignore */ }
    return Object.fromEntries(TROOP_KEYS.map(k => [k, 0]));
}
function setTemplateTroopsSetting(troops) {
    try { localStorage.setItem(TEMPLATE_KEY, JSON.stringify(troops)); } catch (e) { /* ignore */ }
}

// ───── src/04-extractor.js ─────
// ========== Data Extraction ==========
function extractCurrentPage() {
    const rows = $$('tbody tr[data-travian-account-id]');
    const onlyNatar = getOnlyNatar();
    const farms = [];

    rows.forEach(row => {
        try {
            const accountId = row.getAttribute('data-travian-account-id');
            const rowId = row.id || '';
            const villageId = rowId.replace('village-row-', '');

            const distTd = row.querySelectorAll('td')[1];
            const distance = distTd ? parseFloat(distTd.textContent.trim()) : null;

            const playerLink = row.querySelector('.detail-button[data-url*="/player/"]');
            const playerName = playerLink ? playerLink.textContent.trim() : 'Unknown';
            const playerUrl = playerLink ? playerLink.getAttribute('data-url') : '';

            // Only Natar Villages filter: keep rows whose "Travian account"
            // column shows "Natars".
            if (onlyNatar && playerName !== NATAR_MARKER) return;

            const tribeImg = row.querySelector('td img[alt]');
            const tribe = tribeImg ? tribeImg.getAttribute('alt') : '';

            const allianceLink = row.querySelector('.detail-button[data-url*="/alliance/"]');
            const alliance = allianceLink ? allianceLink.textContent.trim() : null;

            const allPopSpans = row.querySelectorAll('span[title="Population"]');
            const playerPopSpan = allPopSpans[0];
            const playerPopulation = playerPopSpan
                ? parseInt(playerPopSpan.textContent.replace(/\D/g, ''), 10) : 0;

            const villagePopSpan = allPopSpans[1];
            const villagePopulation = villagePopSpan
                ? parseInt(villagePopSpan.textContent.replace(/\D/g, ''), 10) : playerPopulation;

            const villageCountSpan = row.querySelector('span[title="Villages"]');
            const villageCount = villageCountSpan
                ? parseInt(villageCountSpan.textContent.replace(/\D/g, ''), 10) : 1;

            const villageLink = row.querySelector('.js-travian_village_url');
            let villageName = '', travianUrl = '', x = null, y = null;

            if (villageLink) {
                travianUrl = villageLink.getAttribute('href') || '';
                // Get the village name (before the coordinate span)
                let rawName = '';
                for (const node of villageLink.childNodes) {
                    if (node.nodeType === Node.TEXT_NODE) {
                        rawName += node.textContent;
                    } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('text-muted')) {
                        rawName += node.textContent;
                    } else if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('text-muted')) {
                        break;
                    }
                }
                villageName = rawName.replace(/\s+/g, ' ').trim();
                // Remove trailing ellipsis character if present
                villageName = villageName.replace(/…$/, '').trim();

                const coordSpan = villageLink.querySelector('span.text-muted.small');
                if (coordSpan) {
                    const match = coordSpan.textContent.match(/\[(-?\d+)\|(-?\d+)\]/);
                    if (match) {
                        x = parseInt(match[1], 10);
                        y = parseInt(match[2], 10);
                    }
                }
            }

            const isCapital = !!row.querySelector('.fa-university');

            farms.push({
                villageId, travianAccountId: accountId, playerName, tribe, alliance,
                playerPopulation, villagePopulation, villageName,
                coords: { x, y }, distance, isCapital, villageCount, travianUrl, playerUrl
            });
        } catch (e) {
            log('Error parsing row:', e && e.message ? e.message : String(e));
        }
    });

    log('Extracted ' + farms.length + ' rows (onlyNatar=' + onlyNatar + ')');
    return farms;
}

// ───── src/05-pagination.js ─────
// ========== Pagination ==========
function getPaginationInfo() {
    const url = new URL(window.location.href);
    let currentPage = parseInt(url.searchParams.get('page') || '1', 10);
    if (isNaN(currentPage) || currentPage < 1) currentPage = 1;

    const countBadge = document.getElementById('list-object-count');
    let totalCount = 0;
    if (countBadge) totalCount = parseInt(countBadge.textContent.trim(), 10) || 0;

    let pageSize = 50;
    const pageSizeSelect = document.getElementById('id_page_size');
    if (pageSizeSelect) pageSize = parseInt(pageSizeSelect.value, 10) || 50;

    let lastPage = 1;
    if (totalCount > 0 && pageSize > 0) {
        lastPage = Math.ceil(totalCount / pageSize);
    }

    const lastPageLink = document.querySelector('a[title="last page"]');
    if (lastPageLink) {
        const match = lastPageLink.getAttribute('href').match(/[?&]page=(\d+)/);
        if (match) {
            const domLast = parseInt(match[1], 10);
            if (domLast > 0) lastPage = Math.min(lastPage, domLast);
        }
    }

    return { currentPage, lastPage, totalCount, pageSize };
}

function getNextPageUrl() {
    const { currentPage, lastPage } = getPaginationInfo();
    if (currentPage >= lastPage) return null;
    const url = new URL(window.location.href);
    url.searchParams.set('page', currentPage + 1);
    // Preserve Natar inclusion across paginated navigations.
    if (getOnlyNatar()) url.searchParams.set('include_natars', 'on');
    return url.toString();
}

// ───── src/06-json-builder.js ─────
// ========== Build Nova-compatible JSON ==========
function buildNovaJSON() {
    const state = getState();
    if (!state || state.farms.length === 0) return null;

    // Read template troops from panel
    const templateTroops = {};
    for (const k of TROOP_KEYS) {
        const inp = document.getElementById('ipe-troop-' + k);
        let v = inp ? parseInt(inp.value, 10) : 0;
        if (isNaN(v) || v < 0) v = 0;
        templateTroops[k] = v;
    }
    const heroChk = document.getElementById('ipe-hero-follow');
    const heroFollow = heroChk ? heroChk.checked : false;
    if (!heroFollow) templateTroops.t11 = 0;

    // Build targets — each target has its own troops (per Nova sample file)
    const targets = state.farms
        .filter(f => f.coords.x !== null && f.coords.y !== null)
        .map(f => {
            const t = {
                name: f.villageName || `${f.coords.x}|${f.coords.y}`,
                x: f.coords.x,
                y: f.coords.y,
                distance: f.distance !== null ? Math.round(f.distance) : null,
                troops: { ...templateTroops },
            };
            // Include heroFollow per-target if false (matches sample file format)
            if (!heroFollow) t.heroFollow = false;
            return t;
        });

    const distMin = state.distanceMin !== '' && state.distanceMin !== undefined ? state.distanceMin : '0';
    const distMax = state.distanceMax !== '' && state.distanceMax !== undefined ? state.distanceMax : 'inf';
    const onlyNatar = getOnlyNatar();
    const baseName = `${distMin}-${distMax} fields`;
    const listName = onlyNatar ? `${baseName} (Natar)` : baseName;

    return {
        _format: 'farm-list-v1',
        _exported: Date.now(),
        list: {
            name: listName,
            troops: { ...templateTroops },
            heroFollow: heroFollow,
            targets: targets,
        },
    };
}

// ───── src/07-ui-panel.js ─────
// ========== Control Panel ==========
function createPanel() {
    const existingPanel = document.getElementById(PANEL_ID);
    if (existingPanel) existingPanel.remove();

    const panel = document.createElement('div');
    panel.id = PANEL_ID;

    const state = getState();
    const ui = getPanelUI();
    const isCollecting = state && state.collecting;
    const collectedCount = state ? state.farms.length : 0;

    const distMin = state && state.distanceMin !== undefined ? state.distanceMin : '';
    const distMax = state && state.distanceMax !== undefined ? state.distanceMax : '';
    const templateTroops = (state && state.templateTroops) || getTemplateTroopsSetting();
    const heroFollow = state && state.heroFollow !== undefined ? state.heroFollow : getHeroFollowSetting();
    const onlyNatar = getOnlyNatar();

    let progressPct = 0;
    let progressText = '0 / 0';
    if (state && state.collecting && state.startPage && state.lastPage) {
        const totalPages = state.lastPage - state.startPage + 1;
        const donePages = state.currentPage - state.startPage + 1;
        progressPct = Math.min(100, (donePages / totalPages) * 100);
        progressText = `${donePages} / ${totalPages} pages`;
    } else if (state && !state.collecting && state.farms.length > 0) {
        progressPct = 100;
        progressText = 'Complete';
    }

    panel.innerHTML = `
        <div class="header" id="ipe-panel-header">
            <span>🌾 Inactive Player Exporter (v${VERSION})</span>
            <span id="ipe-panel-toggle">${ui.minimized ? '+' : '−'}</span>
        </div>
        <div class="body ${ui.minimized ? 'hidden' : ''}" id="ipe-panel-body">
            <div class="distance-row">
                <div class="input-group">
                    <label for="ipe-dist-min">From (distance)</label>
                    <input type="number" id="ipe-dist-min" min="0" step="any" placeholder="e.g. 1" value="${distMin}">
                </div>
                <div class="input-group">
                    <label for="ipe-dist-max">To (distance)</label>
                    <input type="number" id="ipe-dist-max" min="0" step="any" placeholder="e.g. 30" value="${distMax}">
                </div>
            </div>

            <div class="troop-template">
                <div class="title">⚔️ Troop Template (for Nova FM)</div>
                <div class="troop-grid">
                    ${TROOP_KEYS.map(k => `
                        <label title="${TROOP_NAMES[k]}">
                            <span style="width:14px;text-align:right;font-weight:bold;">${k.replace('t','')}</span>
                            <input type="text" inputmode="numeric" id="ipe-troop-${k}" value="${templateTroops[k] | 0}" maxlength="5" title="${TROOP_NAMES[k]}">
                        </label>
                    `).join('')}
                </div>
                <label style="display:block;margin-top:6px;font-size:11px;color:#cdd6f4;">
                    <input type="checkbox" id="ipe-hero-follow" ${heroFollow ? 'checked' : ''} style="vertical-align:middle;"> Hero follows
                </label>
            </div>

            <label class="natar-row" for="ipe-only-natar">
                <input type="checkbox" id="ipe-only-natar" ${onlyNatar ? 'checked' : ''}>
                <span>Only Natar Villages</span>
            </label>

            <button type="button" class="btn btn-primary" id="ipe-btn-current">
                📄 Extract Current Page
            </button>
            <button type="button" class="btn btn-warning" id="ipe-btn-auto" ${isCollecting ? 'disabled' : ''}>
                🔄 ${isCollecting ? (onlyNatar ? 'Collecting Natars...' : 'Collecting...') : 'Auto Collect All Pages'}
            </button>
            <button type="button" class="btn btn-success" id="ipe-btn-export" ${collectedCount > 0 ? '' : 'disabled'}>
                💾 Download JSON (${collectedCount})
            </button>
            <button type="button" class="btn btn-info" id="ipe-btn-preview" ${collectedCount > 0 ? '' : 'disabled'}>
                👁️ Preview JSON
            </button>
            <button type="button" class="btn btn-danger" id="ipe-btn-clear">
                🗑️ Clear Data
            </button>
            <div class="status" id="ipe-status">
                ${isCollecting ? 'Collecting page ' + (state.currentPage || '?') + '...' : 'Ready'}
            </div>
            <div class="progress-container">
                <div class="progress-label">
                    <span id="ipe-progress-text">${progressText}</span>
                    <span id="ipe-progress-count">${collectedCount} villages</span>
                </div>
                <div class="progress-bar">
                    <div class="fill" id="ipe-progress" style="width:${progressPct}%"></div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(panel);

    // Collapse/Expand — persisted in localStorage
    document.getElementById('ipe-panel-header').addEventListener('click', () => {
        const body = document.getElementById('ipe-panel-body');
        const toggle = document.getElementById('ipe-panel-toggle');
        body.classList.toggle('hidden');
        const minimized = body.classList.contains('hidden');
        toggle.textContent = minimized ? '+' : '−';
        setPanelUI({ minimized });
    });

    // Event bindings
    document.getElementById('ipe-btn-current').addEventListener('click', onExtractCurrent);
    document.getElementById('ipe-btn-auto').addEventListener('click', onAutoCollect);
    document.getElementById('ipe-btn-export').addEventListener('click', onDownload);
    document.getElementById('ipe-btn-preview').addEventListener('click', onPreview);
    document.getElementById('ipe-btn-clear').addEventListener('click', onClear);

    // Save distance inputs
    document.getElementById('ipe-dist-min').addEventListener('change', saveDistanceInputs);
    document.getElementById('ipe-dist-max').addEventListener('change', saveDistanceInputs);

    // Save troop template
    TROOP_KEYS.forEach(k => {
        const inp = document.getElementById('ipe-troop-' + k);
        if (!inp) return;
        inp.addEventListener('input', () => {
            const cleaned = inp.value.replace(/[^\d]/g, '').slice(0, 5);
            if (cleaned !== inp.value) inp.value = cleaned;
            const s = getState() || { farms: [], collectedPages: [], collecting: false };
            if (!s.templateTroops) s.templateTroops = {};
            s.templateTroops[k] = parseInt(cleaned, 10) || 0;
            setState(s);
            setTemplateTroopsSetting(s.templateTroops);
        });
    });
    const heroChk = document.getElementById('ipe-hero-follow');
    if (heroChk) {
        heroChk.addEventListener('change', () => {
            const s = getState() || { farms: [], collectedPages: [], collecting: false };
            s.heroFollow = heroChk.checked;
            setState(s);
            setHeroFollowSetting(heroChk.checked);
        });
    }

    // Only Natar Villages — persisted setting + live label refresh
    const natarChk = document.getElementById('ipe-only-natar');
    if (natarChk) {
        natarChk.addEventListener('change', () => {
            setOnlyNatar(natarChk.checked);
            refreshAutoCollectLabel();
        });
    }

    if (isCollecting) setTimeout(restoreCollectingState, 500);
}

// Update Auto-Collect button label to reflect collecting + natars state.
function refreshAutoCollectLabel() {
    const autoBtn = document.getElementById('ipe-btn-auto');
    if (!autoBtn) return;
    const state = getState();
    const isCollecting = state && state.collecting;
    const onlyNatar = getOnlyNatar();
    if (isCollecting) {
        autoBtn.textContent = '🔄 ' + (onlyNatar ? 'Collecting Natars...' : 'Collecting...');
    } else {
        autoBtn.textContent = '🔄 Auto Collect All Pages';
    }
}

// ───── src/08-ui-modal.js ─────
// ========== JSON Preview Modal ==========
function onPreview() {
    const nova = buildNovaJSON();
    if (!nova) {
        updateStatus('No data to preview', 'err');
        return;
    }
    const json = JSON.stringify(nova, null, 2);
    showJSONModal(json, nova.list.targets.length);
}

function showJSONModal(jsonText, targetCount) {
    const existing = document.getElementById(MODAL_ID);
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.innerHTML = `
        <div class="modal-box">
            <div class="modal-title">📋 JSON Preview (${targetCount} targets)</div>
            <textarea readonly id="ipe-json-text">${jsonText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea>
            <div class="modal-actions">
                <button type="button" class="copy-btn" id="ipe-json-copy">📋 Copy</button>
                <button type="button" class="close-btn" id="ipe-json-close">✖ Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('ipe-json-copy').addEventListener('click', () => {
        const ta = document.getElementById('ipe-json-text');
        ta.select();
        try {
            navigator.clipboard.writeText(jsonText).then(() => {
                const btn = document.getElementById('ipe-json-copy');
                btn.textContent = '✓ Copied!';
                setTimeout(() => btn.textContent = '📋 Copy', 1500);
            }).catch(() => {
                document.execCommand('copy');
                const btn = document.getElementById('ipe-json-copy');
                btn.textContent = '✓ Copied!';
                setTimeout(() => btn.textContent = '📋 Copy', 1500);
            });
        } catch (e) {
            log('Copy failed:', e);
        }
    });
    document.getElementById('ipe-json-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// ───── src/09-ui-styles.js ─────
// ========== Styles ==========
GM_addStyle(`
    #${PANEL_ID} {
        position: fixed;
        top: 80px;
        right: 20px;
        z-index: 99999;
        width: 320px;
        background: #1e1e2e;
        color: #cdd6f4;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        font-family: 'Montserrat', sans-serif;
        font-size: 13px;
        overflow: hidden;
    }
    #${PANEL_ID} .header {
        background: linear-gradient(135deg, #89b4fa, #74c7ec);
        color: #1e1e2e;
        padding: 10px 14px;
        font-weight: 700;
        font-size: 14px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        user-select: none;
    }
    #${PANEL_ID} .body { padding: 12px 14px; }
    #${PANEL_ID} .body.hidden { display: none; }
    #${PANEL_ID} .btn {
        display: block;
        width: 100%;
        padding: 9px;
        margin-bottom: 8px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: opacity 0.2s;
    }
    #${PANEL_ID} .btn:hover { opacity: 0.85; }
    #${PANEL_ID} .btn:disabled { opacity: 0.4; cursor: not-allowed; }
    #${PANEL_ID} .btn-primary { background: #89b4fa; color: #1e1e2e; }
    #${PANEL_ID} .btn-success { background: #a6e3a1; color: #1e1e2e; }
    #${PANEL_ID} .btn-warning { background: #f9e2af; color: #1e1e2e; }
    #${PANEL_ID} .btn-danger  { background: #f38ba8; color: #1e1e2e; }
    #${PANEL_ID} .btn-info    { background: #89dceb; color: #1e1e2e; }
    #${PANEL_ID} .distance-row {
        display: flex;
        gap: 8px;
        margin-bottom: 10px;
    }
    #${PANEL_ID} .distance-row .input-group { flex: 1; }
    #${PANEL_ID} .distance-row label {
        display: block;
        font-size: 11px;
        color: #a6adc8;
        margin-bottom: 3px;
    }
    #${PANEL_ID} .distance-row input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #45475a;
        border-radius: 6px;
        background: #313244;
        color: #cdd6f4;
        font-size: 13px;
        box-sizing: border-box;
    }
    #${PANEL_ID} .distance-row input:focus {
        outline: none;
        border-color: #89b4fa;
    }
    #${PANEL_ID} .troop-template {
        margin-bottom: 10px;
        padding: 8px;
        background: #313244;
        border-radius: 6px;
    }
    #${PANEL_ID} .troop-template .title {
        font-size: 11px;
        color: #a6adc8;
        margin-bottom: 6px;
        font-weight: bold;
    }
    #${PANEL_ID} .troop-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
    }
    #${PANEL_ID} .troop-grid label {
        display: flex;
        align-items: center;
        gap: 3px;
        font-size: 10px;
        color: #cdd6f4;
    }
    #${PANEL_ID} .troop-grid input {
        width: 100%;
        min-width: 0;
        padding: 3px 4px;
        font-size: 11px;
        text-align: center;
        background: #1e1e2e;
        color: #cdd6f4;
        border: 1px solid #45475a;
        border-radius: 3px;
        box-sizing: border-box;
    }
    #${PANEL_ID} .natar-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 10px;
        padding: 6px 8px;
        background: #313244;
        border-radius: 6px;
        font-size: 12px;
        color: #cdd6f4;
        cursor: pointer;
        user-select: none;
    }
    #${PANEL_ID} .natar-row input { cursor: pointer; }
    #${PANEL_ID} .status {
        margin-top: 8px;
        padding: 8px;
        background: #313244;
        border-radius: 6px;
        font-size: 12px;
        line-height: 1.5;
        max-height: 100px;
        overflow-y: auto;
        word-break: break-word;
    }
    #${PANEL_ID} .status .count { color: #a6e3a1; font-weight: 700; }
    #${PANEL_ID} .status .warn  { color: #f9e2af; }
    #${PANEL_ID} .status .err   { color: #f38ba8; }
    #${PANEL_ID} .progress-container { margin-top: 10px; }
    #${PANEL_ID} .progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        color: #a6adc8;
        margin-bottom: 4px;
    }
    #${PANEL_ID} .progress-bar {
        height: 8px;
        background: #313244;
        border-radius: 4px;
        overflow: hidden;
    }
    #${PANEL_ID} .progress-bar .fill {
        height: 100%;
        background: linear-gradient(90deg, #89b4fa, #a6e3a1);
        width: 0%;
        transition: width 0.3s ease;
    }
    /* JSON Preview Modal */
    #${MODAL_ID} {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.65);
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    }
    #${MODAL_ID} .modal-box {
        background: #1e1e2e;
        color: #cdd6f4;
        border-radius: 12px;
        padding: 16px;
        max-width: 700px;
        width: 100%;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        font-family: 'Montserrat', sans-serif;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    }
    #${MODAL_ID} .modal-title {
        font-weight: 700;
        font-size: 15px;
        margin-bottom: 10px;
        color: #89b4fa;
    }
    #${MODAL_ID} textarea {
        flex: 1;
        width: 100%;
        min-height: 300px;
        padding: 10px;
        border: 1px solid #45475a;
        border-radius: 6px;
        background: #181825;
        color: #cdd6f4;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        resize: vertical;
        box-sizing: border-box;
    }
    #${MODAL_ID} .modal-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
    }
    #${MODAL_ID} .modal-actions button {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
    }
    #${MODAL_ID} .modal-actions .copy-btn { background: #89b4fa; color: #1e1e2e; }
    #${MODAL_ID} .modal-actions .close-btn { background: #f38ba8; color: #1e1e2e; }
`);

// ───── src/10-bootstrap.js ─────
// ========== Distance Input Helpers ==========
function saveDistanceInputs() {
    const minEl = document.getElementById('ipe-dist-min');
    const maxEl = document.getElementById('ipe-dist-max');
    if (!minEl || !maxEl) return;
    const state = getState() || { farms: [], collectedPages: [], collecting: false };
    state.distanceMin = minEl.value;
    state.distanceMax = maxEl.value;
    setState(state);
}

function getDistanceInputs() {
    const minEl = document.getElementById('ipe-dist-min');
    const maxEl = document.getElementById('ipe-dist-max');
    const minVal = minEl ? minEl.value.trim() : '';
    const maxVal = maxEl ? maxEl.value.trim() : '';
    return {
        min: minVal === '' ? null : parseFloat(minVal),
        max: maxVal === '' ? null : parseFloat(maxVal)
    };
}

// ========== Status / Progress Helpers ==========
function updateStatus(msg, cls = '') {
    const el = document.getElementById('ipe-status');
    if (el) el.innerHTML = `<span class="${cls}">${msg}</span>`;
}
function updateProgress(pct, text, count) {
    const fill = document.getElementById('ipe-progress');
    const textEl = document.getElementById('ipe-progress-text');
    const countEl = document.getElementById('ipe-progress-count');
    if (fill) fill.style.width = `${Math.min(100, pct)}%`;
    if (textEl && text !== undefined) textEl.textContent = text;
    if (countEl && count !== undefined) countEl.textContent = `${count} villages`;
}
function updateExportBtn() {
    const state = getState();
    const btn = document.getElementById('ipe-btn-export');
    const prevBtn = document.getElementById('ipe-btn-preview');
    const cnt = state ? state.farms.length : 0;
    if (btn) {
        btn.textContent = `💾 Download JSON (${cnt})`;
        btn.disabled = cnt === 0;
    }
    if (prevBtn) prevBtn.disabled = cnt === 0;
}

// ========== Action Handlers ==========
function onExtractCurrent() {
    const farms = extractCurrentPage();
    let state = getState() || { farms: [], collectedPages: [], collecting: false };
    const existingIds = new Set(state.farms.map(f => f.villageId));
    let added = 0;
    farms.forEach(f => {
        if (!existingIds.has(f.villageId)) {
            state.farms.push(f);
            existingIds.add(f.villageId);
            added++;
        }
    });
    setState(state);
    updateExportBtn();
    updateStatus(`This page: <span class="count">${farms.length}</span>, new: <span class="count">${added}</span>, total: <span class="count">${state.farms.length}</span>`, 'count');
    updateProgress(100, 'Single page', state.farms.length);
}

function onAutoCollect() {
    const { min, max } = getDistanceInputs();
    if (min !== null && max !== null && min > max) {
        alert('Distance "From" cannot be greater than "To"');
        return;
    }

    let state = getState() || { farms: [], collectedPages: [], collecting: false };

    if (state.farms.length > 0) {
        if (!confirm(`Already have ${state.farms.length} items. Start a new collection?`)) return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('page', '1');
    url.searchParams.delete('distance_min');
    url.searchParams.delete('distance_max');
    if (min !== null) url.searchParams.set('distance_min', min);
    if (max !== null) url.searchParams.set('distance_max', max);

    // Only Natar Villages: request natars in the search and persist the flag.
    const onlyNatar = getOnlyNatar();
    if (onlyNatar) url.searchParams.set('include_natars', 'on');
    else url.searchParams.delete('include_natars');

    state.collecting = true;
    state.startPage = 1;
    state.currentPage = 0;
    state.lastPage = 0;
    state.farms = [];
    state.collectedPages = [];
    state.distanceMin = min !== null ? min : '';
    state.distanceMax = max !== null ? max : '';
    state.onlyNatar = onlyNatar;
    state.needsDetection = true;
    setState(state);

    updateStatus('Navigating to page 1 with distance filter...');
    updateProgress(0, 'Starting...', 0);
    setTimeout(() => { window.location.href = url.toString(); }, 500);
}

function restoreCollectingState() {
    const state = getState();
    if (!state || !state.collecting) return;

    const { currentPage, lastPage } = getPaginationInfo();
    if (state.needsDetection) {
        state.startPage = currentPage;
        state.lastPage = lastPage;
        state.needsDetection = false;
    } else if (lastPage > state.lastPage) {
        state.lastPage = lastPage;
    }
    state.currentPage = currentPage;
    setState(state);

    const farms = extractCurrentPage();
    const existingIds = new Set(state.farms.map(f => f.villageId));
    let added = 0;
    farms.forEach(f => {
        if (!existingIds.has(f.villageId)) {
            state.farms.push(f);
            existingIds.add(f.villageId);
            added++;
        }
    });
    if (!state.collectedPages.includes(currentPage)) state.collectedPages.push(currentPage);
    setState(state);

    const totalPages = state.lastPage - state.startPage + 1;
    const donePages = currentPage - state.startPage + 1;
    const pct = totalPages > 0 ? (donePages / totalPages) * 100 : 0;

    updateProgress(pct, `${donePages} / ${totalPages} pages`, state.farms.length);
    updateStatus(`Page ${currentPage}/${state.lastPage}: +${added} new, total <span class="count">${state.farms.length}</span>`, 'count');
    updateExportBtn();

    if (currentPage >= state.lastPage) {
        state.collecting = false;
        setState(state);
        updateStatus(`✅ Collection complete! Total: <span class="count">${state.farms.length}</span> villages`, 'count');
        updateProgress(100, 'Complete', state.farms.length);
        setTimeout(() => createPanel(), 500);
        return;
    }

    const nextUrl = getNextPageUrl();
    if (!nextUrl) {
        state.collecting = false;
        setState(state);
        updateStatus(`✅ Complete. Total: <span class="count">${state.farms.length}</span>`, 'count');
        updateProgress(100, 'Complete', state.farms.length);
        setTimeout(() => createPanel(), 500);
        return;
    }

    updateStatus(`Page ${currentPage}/${state.lastPage} done. Next in ${DELAY_BETWEEN_PAGES/1000}s...`);
    setTimeout(() => { window.location.href = nextUrl; }, DELAY_BETWEEN_PAGES);
}

// ========== Download / Clear ==========
function onDownload() {
    const nova = buildNovaJSON();
    if (!nova) {
        updateStatus('No data to export', 'err');
        return;
    }

    const json = JSON.stringify(nova, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = nova.list.name.replace(/[^a-z0-9_-]/gi, '_');
    a.download = `farm-list-${safeName}-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    updateStatus(`✅ Downloaded <span class="count">${nova.list.targets.length}</span> villages`, 'count');
}

function onClear() {
    if (!confirm('Clear all collected data?')) return;
    clearState();
    updateStatus('Data cleared');
    updateExportBtn();
    updateProgress(0, '0 / 0', 0);
    setTimeout(() => createPanel(), 200);
}

// ========== Initialization ==========
function init() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
        return;
    }

    const table = document.querySelector('table.table');
    if (!table) { setTimeout(init, 500); return; }

    createPanel();

    const state = getState();
    if (state && state.collecting) {
        setTimeout(restoreCollectingState, 800);
    }
}

init();

})();
