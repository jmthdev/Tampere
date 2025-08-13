async function updateVisitorCount() {
    try {
        const res = await fetch('/api/visitors');
        const data = await res.json();
        const countElement = document.getElementById('visitor-count');
        if (countElement) {
            countElement.textContent = data.visitors;
        }
    } catch (err) {
        console.error('Virhe kävijämäärän haussa', err);
    }
}

updateVisitorCount();
