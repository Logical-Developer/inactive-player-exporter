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
