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
