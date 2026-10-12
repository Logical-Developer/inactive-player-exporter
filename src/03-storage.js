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
