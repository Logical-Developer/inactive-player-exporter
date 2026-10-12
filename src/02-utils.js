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
