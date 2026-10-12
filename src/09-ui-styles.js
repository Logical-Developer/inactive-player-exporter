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
