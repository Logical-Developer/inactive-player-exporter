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
