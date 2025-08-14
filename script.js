// Kävijälaskuri Netlifyn kanssa
// Kävijälaskuri Netlifyn kanssa - KORJATTU
class VisitorTracker {
    constructor() {
        this.sessionId = this.getOrCreateSessionId();
        // KORJATTU POLKU NETLIFYLLE
        this.apiUrl = '/.netlify/functions/visitors';
        this.retryCount = 0;
        this.maxRetries = 3;
        this.init();
    }
    
    getOrCreateSessionId() {
        let id = localStorage.getItem('visitorSessionId');
        if (!id) {
            id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('visitorSessionId', id);
            console.log('Uusi kävijä, session ID:', id);
        }
        return id;
    }
    
    async init() {
        console.log('Yhdistetään Netlify Functions...');
        console.log('API URL:', this.apiUrl);
        
        // Ensimmäinen päivitys heti
        await this.updateStats();
        
        // Päivitä 30 sekunnin välein
        this.interval = setInterval(() => this.updateStats(), 30000);
        
        // Päivitä kun käyttäjä palaa sivulle
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateStats();
            }
        });
    }
    
    async updateStats() {
        try {
            console.log('Lähetetään pyyntö:', this.apiUrl);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API vastaus:', data);
            
            if (data.success) {
                console.log('✅ Tilastot päivitetty');
                this.retryCount = 0;
            } else if (data.demo) {
                console.warn('⚠️ Demo-tila käytössä');
            }
            
            this.updateDisplay(data);
            
        } catch (error) {
            console.error('❌ Virhe:', error);
            this.useFallback();
        }
    }
    
    updateDisplay(data) {
        // Päivitä navbarin laskurit
        const onlineEl = document.getElementById('visitorCount');
        if (onlineEl) {
            onlineEl.textContent = data.online || '...';
        }
        
        const totalEl = document.getElementById('totalCount');
        if (totalEl) {
            totalEl.textContent = this.formatNumber(data.total || 0);
        }
        
        // Päivitä footer tilastot
        if (document.getElementById('todayVisitors')) {
            document.getElementById('todayVisitors').textContent = data.today || 0;
        }
        if (document.getElementById('weekVisitors')) {
            document.getElementById('weekVisitors').textContent = this.formatNumber(data.week || 0);
        }
        if (document.getElementById('monthVisitors')) {
            document.getElementById('monthVisitors').textContent = this.formatNumber(data.month || 0);
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
        console.log('Käytetään fallback arvoja');
        const fallback = {
            online: Math.floor(Math.random() * 20) + 5,
            total: 45678,
            today: 127,
            week: 892,
            month: 3421,
            demo: true
        };
        this.updateDisplay(fallback);
    }
}

// NAVIGOINTI FUNKTIOT (säilytetty alkuperäiset)
function showSection(sectionId) {
    // Piilota kaikki osiot
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Näytä valittu osio
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Piilota navbar muilla sivuilla
    const navbar = document.querySelector('.nav-menu');
    const navItems = navbar ? navbar.querySelectorAll('.nav-item') : [];
    
    if (sectionId === 'etusivu') {
        navItems.forEach(item => {
            item.style.display = 'block';
        });
    } else {
        navItems.forEach((item, index) => {
            if (index === 0) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
}

// DOM VALMIS
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Kotimme Tampere sivusto ladattu!');
    
    // Käynnistä kävijälaskuri
    const tracker = new VisitorTracker();
    
    // Mobiilimenu
    const mobileMenu = document.querySelector('.mobile-menu');
    const navMenu = document.querySelector('.nav-menu');
    const navItems = document.querySelectorAll('.nav-item');
    const logo = document.querySelector('.logo');

    if (mobileMenu) {
        mobileMenu.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Dropdown toiminnallisuus
    navItems.forEach(item => {
        const dropdown = item.querySelector('.dropdown');
        const link = item.querySelector('.nav-link');
        if (dropdown && link) {
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    dropdown.classList.toggle('active');
                }
            });
        }
    });

    // Logo klikkaus
    if (logo) {
        logo.addEventListener('click', () => {
            showSection('etusivu');
            if (navMenu) navMenu.classList.remove('active');
            document.querySelectorAll('.dropdown.active').forEach(dd => {
                dd.classList.remove('active');
            });
        });
    }

    // Varmista että etusivu näkyy alussa
    showSection('etusivu');
});

// Testifunktio konsolia varten
window.testAPI = async function() {
    console.log('🧪 Testataan Netlify Functions yhteyttä...');
    try {
        const response = await fetch('/.netlify/functions/visitors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: 'test-' + Date.now() })
        });
        const data = await response.json();
        console.log('✅ API vastaus:', data);
        return data;
    } catch (error) {
        console.error('❌ API virhe:', error);
        return error;
    }
};

console.log('💡 Vinkki: Testaa API kirjoittamalla konsoliin: testAPI()');