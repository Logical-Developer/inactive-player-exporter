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
