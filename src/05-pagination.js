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
