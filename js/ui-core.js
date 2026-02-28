// --- 0. UTILS ANTI-CRASH & MODALS ---
window.safeJSONParse = function(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        console.error(`Error parsing ${key} from LocalStorage, reseting to default.`, e);
        return fallback;
    }
};

window.hardRefreshApp = function() {
    if(confirm("Sistem terasa lambat atau crash? Klik OK untuk menyegarkan memori tanpa menghapus progresmu.")) {
        localStorage.removeItem('statsRadar');
        localStorage.removeItem('activityHistory');
        window.location.reload(true);
    }
}

window.openInfoModal = function(title, desc) {
    document.getElementById('info-modal-title').innerHTML = title;
    document.getElementById('info-modal-desc').innerHTML = desc;
    const modal = document.getElementById('info-modal');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => document.getElementById('info-modal-content').classList.remove('scale-95'), 10);
}

window.closeInfoModal = function() {
    const modal = document.getElementById('info-modal');
    document.getElementById('info-modal-content').classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 200);
}

// --- 1. GLOBAL VARS & WAKTU ---
window.today = new Date();
window.startOfYear = new Date(window.today.getFullYear(), 0, 0);
window.dayOfYear = Math.floor((window.today - window.startOfYear) / (1000 * 60 * 60 * 24));
window.tglRilis = new Date("2026-02-01T00:00:00"); 
window.selisihMinggu = Math.floor(Math.max(0, window.today - window.tglRilis) / (1000 * 60 * 60 * 24 * 7));
window.currentHour = window.today.getHours();

// --- 2. DARK MODE GRATIS ---
const darkToggle = document.getElementById('dark-toggle');
const htmlElement = document.documentElement;
if (localStorage.getItem('theme') === 'dark') { 
    htmlElement.classList.add('dark');
    if(darkToggle) darkToggle.innerText = '☀️'; 
}
if(darkToggle) {
    darkToggle.addEventListener('click', () => {
        htmlElement.classList.toggle('dark');
        localStorage.setItem('theme', htmlElement.classList.contains('dark') ? 'dark' : 'light');
        darkToggle.innerText = htmlElement.classList.contains('dark') ? '☀️' : '🌙';
        if(window.updateChartTheme) window.updateChartTheme();
    });
}

// --- 3. TAB NAVIGASI ---
const views = { home: document.getElementById('view-home'), target: document.getElementById('view-target'), profile: document.getElementById('view-profile') };
const btns = { home: document.getElementById('nav-btn-home'), target: document.getElementById('nav-btn-target'), profile: document.getElementById('nav-btn-profile') };
const activeClass = "flex-1 py-2.5 flex flex-col items-center text-emerald-600 dark:text-emerald-400 transition transform scale-105 bg-emerald-50 dark:bg-emerald-900/30 rounded-3xl";
const inactiveClass = "flex-1 py-2.5 flex flex-col items-center text-gray-400 hover:text-emerald-500 transition rounded-3xl relative";

window.switchTab = function(tab) {
    Object.keys(views).forEach(key => { 
        if(views[key]) views[key].classList.replace('block', 'hidden'); 
        if(btns[key]) btns[key].className = inactiveClass; 
    });
    if(views[tab]) views[tab].classList.replace('hidden', 'block'); 
    if(btns[tab]) btns[tab].className = activeClass;
    window.scrollTo(0,0);
}

if(btns.home) btns.home.addEventListener('click', () => window.switchTab('home'));
if(btns.target) btns.target.addEventListener('click', () => window.switchTab('target'));
if(btns.profile) btns.profile.addEventListener('click', () => { 
    window.switchTab('profile'); 
    setTimeout(() => { if(window.renderCharts) window.renderCharts(); }, 100); 
});
