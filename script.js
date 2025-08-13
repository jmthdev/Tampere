// Kävijälaskurin koodi
class VisitorTracker {
    constructor() {
        this.sessionId = this.getSessionId();
        this.apiUrl = '/api/visitors';
        this.init();
    }
    
    getSessionId() {
        let id = sessionStorage.getItem('sessionId');
        if (!id) {
            id = 'session_' + Date.now() + '_' + Math.random().toString(36);
            sessionStorage.setItem('sessionId', id);
        }
        return id;
    }
    
    async init() {
        console.log('Käynnistetään kävijälaskuri...');
        await this.updateStats();
        
        // Päivitä 30 sekunnin välein
        setInterval(() => this.updateStats(), 30000);
    }
    
    async updateStats() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId
                })
            });
            
            if (!response.ok) {
                throw new Error('API virhe');
            }
            
            const data = await response.json();
            console.log('Tilastot päivitetty:', data);
            
            // Päivitä näyttö
            this.updateDisplay(data);
            
        } catch (error) {
            console.error('Virhe tilastojen haussa:', error);
            this.useFallback();
        }
    }
    
    updateDisplay(data) {
        const onlineEl = document.getElementById('visitorCount');
        if (onlineEl) {
            onlineEl.textContent = data.online;
            onlineEl.classList.add('updating');
            setTimeout(() => onlineEl.classList.remove('updating'), 300);
        }
        
        const totalEl = document.getElementById('totalCount');
        if (totalEl) {
            totalEl.textContent = this.formatNumber(data.total);
            totalEl.classList.add('updating');
            setTimeout(() => totalEl.classList.remove('updating'), 300);
        }
        
        // Jos demo-data, näytä indikaattori
        if (data.demo) {
            console.log('Käytetään demo-dataa (tietokanta ei yhteydessä)');
        }
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    }
    
    useFallback() {
        // Käytä simulaatiota jos API ei toimi
        const fallbackData = {
            online: Math.floor(Math.random() * 20) + 5,
            total: 45678 + Math.floor(Math.random() * 100),
            demo: true
        };
        this.updateDisplay(fallbackData);
    }
}

// LISÄÄ PALUU-NAPPI AUTOMAATTISESTI KAIKKIIN OSIOIHIN
document.addEventListener('DOMContentLoaded', function() {
    // Hae kaikki osiot paitsi etusivu
    const sections = document.querySelectorAll('.section:not(#etusivu)');
    
    sections.forEach(section => {
        // Luo paluu-nappi
        const backButton = document.createElement('div');
        backButton.className = 'back-to-home';
        backButton.innerHTML = `
            <button onclick="showSection('etusivu')" class="back-button">
                <span class="back-arrow">←</span>
                <span>Takaisin etusivulle</span>
            </button>
        `;
        
        // Lisää nappi osion alkuun (h2 otsikon jälkeen)
        const heading = section.querySelector('h2');
        if (heading) {
            heading.insertAdjacentElement('afterend', backButton);
        } else {
            section.insertBefore(backButton, section.firstChild);
        }
    });
    
    // Lisää myös kiinteä paluu-nappi
    const fixedBackButton = document.createElement('div');
    fixedBackButton.className = 'fixed-back-button';
    fixedBackButton.id = 'fixedBackBtn';
    fixedBackButton.innerHTML = `
        <button onclick="showSection('etusivu')" title="Palaa etusivulle">
            <span>🏠</span>
        </button>
    `;
    fixedBackButton.style.display = 'none';
    document.body.appendChild(fixedBackButton);
});

// Päivitä showSection funktio näyttämään/piilottamaan kiinteä nappi
const originalShowSection = showSection;
showSection = function(sectionId) {
    originalShowSection(sectionId);
    
    // Näytä/piilota kiinteä paluu-nappi
    const fixedBtn = document.getElementById('fixedBackBtn');
    if (fixedBtn) {
        if (sectionId === 'etusivu') {
            fixedBtn.style.display = 'none';
        } else {
            fixedBtn.style.display = 'block';
        }
    }
};

// Käynnistä kun DOM valmis
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new VisitorTracker();
    });
} else {
    new VisitorTracker();
}