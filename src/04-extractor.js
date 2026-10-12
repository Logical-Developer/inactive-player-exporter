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
