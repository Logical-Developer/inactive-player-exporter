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
