// --- 5. RENDER SHOLAT WAJIB ---
window.sholatWajib = [
    { id: "sw-subuh", title: "Sholat Subuh", start: 4, end: 6, exp: 50, type: "pusat" },
    { id: "sw-dhuhur", title: "Sholat Dhuhur", start: 11, end: 15, exp: 50, type: "pusat" },
    { id: "sw-ashar", title: "Sholat Ashar", start: 15, end: 18, exp: 50, type: "pusat" },
    { id: "sw-maghrib", title: "Sholat Maghrib", start: 18, end: 19, exp: 50, type: "pusat" },
    { id: "sw-isya", title: "Sholat Isya", start: 19, end: 23, exp: 50, type: "pusat" }
];

window.renderSholatWajib = function() {
    const container = document.getElementById('sholat-wajib-container');
    if(!container) return;
    let html = '';
    
    window.sholatWajib.forEach(q => {
        const isDone = localStorage.getItem(q.id) === 'true'; 
        const isPast = window.currentHour >= q.end; 
        const isActive = window.currentHour >= q.start && window.currentHour < q.end; 
        
        let statusText, statusClass, borderClass, disabledAttr = "disabled";
        let checkIcon = "🔒";

        if (isDone) {
            statusText = "✅ Terselesaikan";
            statusClass = "text-emerald-600 dark:text-emerald-400 font-bold";
            borderClass = "border-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 opacity-80";
            checkIcon = "✅";
        } else if (isPast) {
            statusText = "❌ Waktu Terlewat (-50 EXP)";
            statusClass = "text-rose-500 font-bold animate-pulse";
            borderClass = "border-rose-200 bg-rose-50 dark:bg-rose-900/20 opacity-70 grayscale-[50%]";
            checkIcon = "❌";
            let penaltyKey = `penalty_done_${q.id}_${new Date().toDateString()}`;
            if(localStorage.getItem(penaltyKey) !== 'true') {
                localStorage.setItem(penaltyKey, 'true');
                window.totalExp = Math.max(0, window.totalExp - 50); 
                localStorage.setItem('totalExp', window.totalExp);
                if(window.updateStatsUI) window.updateStatsUI();
                if(window.syncExpToFirebase) window.syncExpToFirebase(-50);
                setTimeout(() => alert(`⚠️ ASTAGHFIRULLAH!\nKamu ketahuan melewati batas waktu ${q.title}!\n\nHukuman Instan: -50 EXP.`), 600);
            }
        } else if (isActive) {
            statusText = "🟢 SEDANG BERLANGSUNG!";
            statusClass = "text-emerald-500 animate-pulse font-black";
            borderClass = "border-emerald-400 shadow-emerald-500/20 shadow-md bg-white dark:bg-gray-800";
            disabledAttr = ""; checkIcon = "";
        } else {
            statusText = `⏳ Nanti: ${q.start.toString().padStart(2, '0')}:00 - ${q.end.toString().padStart(2, '0')}:00`;
            statusClass = "text-gray-400 font-bold";
            borderClass = "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-80";
            checkIcon = "⏳";
        }

        html += `
        <label class="flex items-center justify-between p-4 rounded-2xl border ${borderClass} cursor-pointer group relative overflow-hidden transition-all">
            <div class="flex items-center gap-4">
                <input type="checkbox" id="${q.id}" class="w-6 h-6 text-emerald-500 rounded-lg focus:ring-emerald-400 sholat-item peer" ${disabledAttr} ${isDone ? 'checked' : ''} data-exp="${q.exp}" data-type="${q.type}" data-title="${q.title}">
                <div>
                    <span class="block font-bold text-sm text-gray-800 dark:text-gray-100 transition">${q.title}</span>
                    <span class="text-[10px] ${statusClass}">${statusText}</span>
                </div>
            </div>
            <div class="absolute right-4 text-gray-400 peer-disabled:block hidden pointer-events-none text-xl">${checkIcon}</div>
        </label>`;
    });
    container.innerHTML = html;
    
    document.querySelectorAll('.sholat-item').forEach(box => {
        box.addEventListener('change', function() {
            if (!this.checked) { this.checked = true; return; }
            localStorage.setItem(this.id, 'true');
            this.disabled = true; 
            
            let finalExp = typeof window.vipBuff !== 'undefined' && window.vipBuff ? parseInt(this.getAttribute('data-exp')) * 2 : parseInt(this.getAttribute('data-exp'));
            window.totalExp += finalExp; window.totalKoin += finalExp; 
            localStorage.setItem('totalExp', window.totalExp); 
            localStorage.setItem('totalKoin', window.totalKoin);
            const koinDisplay = document.getElementById('koin-display');
            if(koinDisplay) koinDisplay.innerText = window.totalKoin; 
            if(window.updateStatsUI) window.updateStatsUI();
            
            if(window.syncExpToFirebase) window.syncExpToFirebase(finalExp);
            if(typeof confetti === 'function') confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
            if (typeof window.checkEpicComboUnlock === 'function') window.checkEpicComboUnlock(true); 
            window.renderSholatWajib(); 
        });
    });
}
window.renderSholatWajib();

// --- 5.5 API JADWAL SHOLAT DINAMIS ---
window.fetchJadwalDinamis = async function() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const date = new Date();
            const url = `https://api.aladhan.com/v1/timings/${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}?latitude=${lat}&longitude=${lng}&method=11`;
            try {
                const response = await fetch(url);
                const data = await response.json();
                const timings = data.data.timings;
                
                window.sholatWajib[0].start = parseInt(timings.Fajr.substring(0, 2));
                window.sholatWajib[0].end = parseInt(timings.Sunrise.substring(0, 2)) + 1;
                window.sholatWajib[1].start = parseInt(timings.Dhuhr.substring(0, 2));
                window.sholatWajib[1].end = parseInt(timings.Asr.substring(0, 2)); 
                window.sholatWajib[2].start = parseInt(timings.Asr.substring(0, 2));
                window.sholatWajib[2].end = parseInt(timings.Maghrib.substring(0, 2)); 
                window.sholatWajib[3].start = parseInt(timings.Maghrib.substring(0, 2));
                window.sholatWajib[3].end = parseInt(timings.Isha.substring(0, 2)); 
                window.sholatWajib[4].start = parseInt(timings.Isha.substring(0, 2));
                window.sholatWajib[4].end = 24; 
                
                window.renderSholatWajib();
            } catch (error) { console.warn("Gagal API AlAdhan. Pakai jadwal lokal."); }
        }, (error) => { console.warn("Akses GPS ditolak."); });
    }
}
window.fetchJadwalDinamis();

// --- 6. BANK DATA HABITS & EPIC COMBO ---
window.dailyEasy = [
    { id: "de1", title: "Senyum & sapa 3 orang hari ini", exp: 10, type: "aura" },
    { id: "de2", title: "Minum air putih sambil duduk & Bismillah", exp: 10, type: "aura" },
    { id: "de3", title: "Rapikan tempat tidur pas baru bangun", exp: 10, type: "sigma" },
    { id: "de4", title: "Tahan jempol dari hate comment di sosmed", exp: 10, type: "stoic" },
    { id: "de5", title: "Ucapkan 'Terima Kasih' tulus ke pekerja jasa", exp: 10, type: "aura" },
    { id: "de6", title: "Matikan lampu/air yang tidak dipakai", exp: 10, type: "sigma" },
    { id: "de7", title: "Rapikan sepatu/sandal di teras/masjid", exp: 10, type: "sigma" }
];
window.dailyMed = [
    { id: "dm1", title: "Sholat Dhuha minimal 2 Rakaat", exp: 30, type: "pusat" },
    { id: "dm2", title: "Baca Al-Quran 1 Lembar", exp: 30, type: "pusat" },
    { id: "dm3", title: "Datang on-time ke agenda hari ini", exp: 30, type: "sigma" },
    { id: "dm4", title: "Cuci piring/gelas sendiri sehabis makan", exp: 30, type: "sigma" },
    { id: "dm5", title: "Sedekah (Qris/Receh) ke kotak amal/pengamen", exp: 30, type: "derma" },
    { id: "dm6", title: "No Toxic Words / Menahan marah seharian", exp: 30, type: "stoic" }
];
window.dailyHard = [
    { id: "dh1", title: "Sholat Subuh Berjamaah di Masjid", exp: 50, type: "pusat" },
    { id: "dh2", title: "Minta maaf duluan kalau ada salah", exp: 50, type: "peka" },
    { id: "dh3", title: "Jenguk/Chat tanya kabar orang sakit", exp: 50, type: "peka" },
    { id: "dh4", title: "Puasa Doom Scrolling Sosmed 4 Jam", exp: 50, type: "stoic" },
    { id: "dh5", title: "Bersihkan toilet rumah/masjid dengan ikhlas", exp: 50, type: "derma" }
];
window.dailyExt = [
    { id: "dx1", title: "Sholat Wajib 5 Waktu FULL Berjamaah", exp: 100, type: "pusat" },
    { id: "dx2", title: "Khatam 1 Juz Al-Quran hari ini", exp: 100, type: "pusat" },
    { id: "dx3", title: "Traktir makan orang yang sedang butuh", exp: 100, type: "derma" },
    { id: "dx4", title: "Jujur mengakui kesalahan fatal tanpa ngeles", exp: 100, type: "sigma" },
    { id: "dx5", title: "Berdamai/Memaafkan musuh bebuyutan", exp: 100, type: "peka" }
];
window.epicCombos = [
    { id: "ec1", title: "Puasa Sosmed (IG, TikTok) 6 Jam Siang Hari", exp: 150, type: "stoic" },
    { id: "ec2", title: "Tidak mengeluh & tidak sambat 24 Jam", exp: 150, type: "sigma" },
    { id: "ec3", title: "Bantu 2 pekerjaan ortu di rumah tanpa disuruh", exp: 150, type: "peka" },
    { id: "ec4", title: "Rapikan sandal/sepatu berantakan di masjid", exp: 150, type: "sigma" },
    { id: "ec5", title: "Tahan jempol komentar negatif seharian", exp: 150, type: "stoic" },
    { id: "ec6", title: "Sholat Wajib 5 Waktu FULL Tepat Waktu", exp: 200, type: "pusat" },
    { id: "ec7", title: "Baca Al-Kahfi di hari Jumat (Selesai)", exp: 200, type: "pusat" },
    { id: "ec8", title: "Berdamai & chat duluan teman yang musuhan", exp: 200, type: "peka" },
    { id: "ec9", title: "Sisihkan uang khusus untuk disedekahkan", exp: 150, type: "derma" },
    { id: "ec10", title: "Khatam 1 Juz Al-Quran dalam satu hari", exp: 150, type: "pusat" }
];

window.currentEpic = window.epicCombos[window.dayOfYear % window.epicCombos.length];
const epicContainer = document.getElementById('epic-quest-container');
if(epicContainer) {
    epicContainer.innerHTML = `
        <div class="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-1 rounded-3xl shadow-lg mb-6 transform hover:scale-[1.01] transition">
            <div class="bg-white dark:bg-gray-800 p-4 rounded-[1.3rem] h-full flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="bg-purple-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase">EPIC COMBO HARI INI</span>
                    </div>
                    <p class="font-black text-sm text-gray-800 dark:text-gray-100 mt-1">${window.currentEpic.title}</p>
                    <p class="text-xs text-purple-600 dark:text-purple-400 font-bold">+${window.currentEpic.exp} Koin & EXP!</p>
                </div>
                <label class="relative flex items-center justify-center cursor-pointer group">
                    <input type="checkbox" id="${window.currentEpic.id}" disabled class="w-8 h-8 text-purple-600 rounded-xl focus:ring-purple-500 checklist-item peer disabled:opacity-30 disabled:cursor-not-allowed" data-exp="${window.currentEpic.exp}" data-type="${window.currentEpic.type}" data-title="${window.currentEpic.title}">
                    <span id="epic-lock-icon" class="absolute text-2xl peer-disabled:block hidden pointer-events-none">🔒</span>
                </label>
            </div>
        </div>
    `;
}

window.dailyQuests = [
    window.dailyEasy[window.dayOfYear % window.dailyEasy.length],
    window.dailyMed[window.dayOfYear % window.dailyMed.length],
    window.dailyMed[(window.dayOfYear + 1) % window.dailyMed.length],
    window.dailyHard[window.dayOfYear % window.dailyHard.length],
    window.dailyExt[window.dayOfYear % window.dailyExt.length]
];

window.checkEpicComboUnlock = function(showPopup = false) {
    let dailyCheckedCount = 0; let sholatCheckedCount = 0;
    window.sholatWajib.forEach(sq => { if(localStorage.getItem(sq.id) === 'true') sholatCheckedCount++; });
    window.dailyQuests.forEach(dq => { if(localStorage.getItem(dq.id) === 'true') dailyCheckedCount++; });
    
    if(dailyCheckedCount >= 5 && sholatCheckedCount >= 5) {
        const epicBox = document.getElementById(window.currentEpic.id);
        const epicLock = document.getElementById('epic-lock-icon');
        if(epicBox && epicBox.disabled && localStorage.getItem(window.currentEpic.id) !== 'true') {
            epicBox.disabled = false;
            if(epicLock) epicLock.classList.add('hidden');
            if(showPopup) alert("🔥 EPIC COMBO TERBUKA!\n\nKamu telah menyelesaikan SEMUA Panggilan Langit (5/5) & Sunnah/Habits (5/5) hari ini. Selesaikan misi rahasiamu sekarang!");
        }
    }
};
window.checkEpicComboUnlock(false); 

// --- 6.5 VIP EVENT PUASA SENIN KAMIS ---
const dDay = window.today.getDay(); const dHour = window.today.getHours();
const isVIPEvent = (dDay === 1 || dDay === 4) || (dDay === 0 && dHour >= 18) || (dDay === 3 && dHour >= 18);
window.vipBuff = localStorage.getItem('vip_buff_active') === 'true';

if(isVIPEvent && epicContainer) {
    epicContainer.innerHTML += `
        <div class="bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 p-1 rounded-3xl shadow-xl shadow-yellow-500/30 mb-6 transform hover:scale-[1.02] transition animate-pulse">
            <div class="bg-white/10 backdrop-blur-md p-4 rounded-[1.3rem] h-full flex items-center justify-between border border-white/40">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="bg-yellow-100 text-yellow-800 text-[9px] font-black px-2 py-0.5 rounded-md uppercase border border-yellow-400">⚡ FLASH SALE LANGIT</span>
                    </div>
                    <p class="font-black text-sm text-white drop-shadow-md mt-1">Puasa Sunnah Senin/Kamis</p>
                    <p class="text-[10px] text-yellow-100 font-bold">Aktifkan untuk dapat Buff x2 SEMUA EXP hari ini!</p>
                </div>
                <label class="relative flex items-center justify-center cursor-pointer group">
                    <input type="checkbox" id="vip-puasa-buff" class="w-8 h-8 text-yellow-400 rounded-xl focus:ring-yellow-300 checklist-item peer" data-exp="100" data-type="pusat" data-title="Puasa Sunnah Senin/Kamis">
                </label>
            </div>
        </div>
    `;
} else {
    localStorage.setItem('vip_buff_active', 'false'); window.vipBuff = false;
}

const chkContainer = document.getElementById('checklist-container');
let dailyHtml = '';
window.dailyQuests.forEach(q => {
    let badge = q.exp <= 20 ? 'NPC Level' : q.exp <= 40 ? 'Skuy Level' : q.exp <= 70 ? 'Suhu Level' : 'Backingan Pusat';
    let color = q.exp <= 20 ? 'text-gray-500' : q.exp <= 40 ? 'text-blue-500' : q.exp <= 70 ? 'text-orange-500' : 'text-rose-600';
    
    dailyHtml += `
    <label class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:border-emerald-400 transition group">
        <div class="flex items-center gap-4">
            <input type="checkbox" id="${q.id}" class="w-6 h-6 text-emerald-500 rounded-lg focus:ring-emerald-400 checklist-item" data-exp="${q.exp}" data-type="${q.type}" data-title="${q.title}">
            <div>
                <span class="text-[9px] font-black ${color} uppercase tracking-wider block mb-0.5">${badge}</span>
                <span class="block font-bold text-sm text-gray-700 dark:text-gray-200 group-hover:text-emerald-500 transition">${q.title}</span>
                <span class="text-[10px] font-bold text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 px-1.5 py-0.5 rounded mt-1 inline-block">+${q.exp} Koin & EXP</span>
            </div>
        </div>
    </label>
    `;
});
if(chkContainer) chkContainer.innerHTML = dailyHtml;

// --- 7. GACHA KEBAIKAN DENGAN SISTEM WAJIB ---
const gachaBtn = document.getElementById('gacha-container');
const gachaRes = document.getElementById('gacha-result');
const gachaSubtitle = document.getElementById('gacha-subtitle');

window.gachaMissions25 = [
    { text: "Traktir teman minuman hari ini", type: "derma" },
    { text: "Senyum tulus ke 3 orang asing", type: "aura" },
    { text: "Bantu ortu membereskan rumah", type: "peka" },
    { text: "Sedekah subuh Rp2.000", type: "derma" },
    { text: "Baca Al-Kahfi 10 ayat pertama", type: "pusat" },
    { text: "Berbagi makanan ke tetangga", type: "derma" },
    { text: "Pungut 3 sampah di jalanan", type: "sigma" },
    { text: "Beri rating bintang 5 ke kurir", type: "aura" },
    { text: "Maafkan kesalahan orang hari ini", type: "peka" },
    { text: "Baca istighfar 100x hari ini", type: "pusat" },
    { text: "Telepon/chat keluarga yang jauh", type: "peka" },
    { text: "Tahan amarah saat sedang kesal", type: "stoic" },
    { text: "Beri komentar positif di medsos", type: "aura" },
    { text: "Berdoa untuk kebaikan sahabat", type: "peka" },
    { text: "Rapikan sandal/sepatu di masjid", type: "sigma" },
    { text: "Isi kotak amal terdekat", type: "derma" },
    { text: "Ucapkan terima kasih ke satpam", type: "aura" },
    { text: "Baca sholawat nabi 100x", type: "pusat" },
    { text: "Niatkan puasa sunnah untuk besok", type: "pusat" }
];
window.hasGachaToday = localStorage.getItem('gachaDate') === new Date().toDateString();

window.renderGachaResult = function(questObj, isWajibFlag) {
    let wajibUI = isWajibFlag ? 'bg-red-500/20 border-red-500 shadow-red-500/50' : 'bg-white/20 border-white/30';
    let wajibText = isWajibFlag ? '<span class="block text-[10px] bg-red-600 text-white px-2 rounded mb-1 animate-pulse">⚠️ MISI LANGIT WAJIB! (-500 EXP jika gagal)</span>' : '';
    if(gachaRes) gachaRes.innerHTML = `<label class="flex items-center justify-between cursor-pointer group mt-2 p-3 ${wajibUI} rounded-xl border shadow-sm backdrop-blur-md transition"><div class="flex items-center gap-3"><input type="checkbox" id="quest-gacha" class="w-6 h-6 text-rose-500 rounded checklist-item" data-exp="${isWajibFlag ? '100' : '50'}" data-type="${questObj.type}" data-title="${questObj.text}"><div>${wajibText}<span class="font-bold text-sm text-white drop-shadow-md text-left leading-tight">${questObj.text}</span></div></div></label>`;
    if(gachaRes) gachaRes.classList.remove('hidden'); 
    if(gachaSubtitle) gachaSubtitle.classList.add('hidden');
}

if(window.hasGachaToday) {
    let savedMission = localStorage.getItem('gachaMission');
    let savedType = localStorage.getItem('gachaType') || 'derma';
    window.renderGachaResult({text: savedMission, type: savedType}, localStorage.getItem('gachaIsWajib') === 'true');
}

if(gachaBtn) {
    gachaBtn.addEventListener('click', () => {
        if(!window.hasGachaToday) {
            let randomQuest = window.gachaMissions25[Math.floor(Math.random() * window.gachaMissions25.length)];
            let isWajibRoll = Math.random() < 0.2; 
            localStorage.setItem('gachaDate', new Date().toDateString()); 
            localStorage.setItem('gachaMission', randomQuest.text);
            localStorage.setItem('gachaType', randomQuest.type);
            localStorage.setItem('gachaIsWajib', isWajibRoll ? 'true' : 'false');
            window.renderGachaResult(randomQuest, isWajibRoll); 
         
            if(isWajibRoll) {
                confetti({particleCount: 100, spread: 70, colors: ['#ff0000', '#000000']});
                if(navigator.vibrate) navigator.vibrate([200, 100, 200]);
            } else {
                confetti({particleCount: 80, spread: 60, colors: ['#fb7185', '#f43f5e', '#ffffff']});
            }
            window.hasGachaToday = true; window.attachChecklistListeners(); 
        }
    });
}

// --- 8. RENDER FLASH QUEST ---
window.flashQuests25 = [
    { id: "fq-1", title: "Pejuang Subuh Berjamaah", exp: 50, start: 4, end: 6, type: "pusat" },
    { id: "fq-2", title: "Sholat Dhuha 2 Rakaat", exp: 40, start: 7, end: 11, type: "pusat" },
    { id: "fq-3", title: "Sedekah Makan Siang", exp: 30, start: 11, end: 13, type: "derma" },
    { id: "fq-4", title: "Sholat Ashar di Awal Waktu", exp: 40, start: 15, end: 16, type: "pusat" }
];
window.todayFlash = window.flashQuests25[window.dayOfYear % window.flashQuests25.length];
window.isFlashActive = window.currentHour >= window.todayFlash.start && window.currentHour <= window.todayFlash.end;
const flashStatusText = window.isFlashActive ? "🟢 BUKA SEKARANG" : `${window.todayFlash.start.toString().padStart(2, '0')}:00 - ${window.todayFlash.end.toString().padStart(2, '0')}:00`;
const flashStatusClass = window.isFlashActive ? "text-emerald-500" : "text-gray-500";

const flashContainer = document.getElementById('flash-quest-container');
if(flashContainer) {
    flashContainer.innerHTML = `
        <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm mb-6 flex items-center justify-between">
            <div>
                <div class="flex items-center gap-2 mb-1">
                    <span class="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md animate-pulse">FLASH QUEST</span>
                    <span class="text-xs font-bold ${flashStatusClass}" id="flash-time-status">${flashStatusText}</span>
                </div>
                <p class="font-bold text-sm dark:text-gray-200">${window.todayFlash.title}</p>
                <p class="text-xs text-yellow-500 font-bold">+${window.todayFlash.exp} Koin & EXP</p>
            </div>
            <label class="relative flex items-center justify-center cursor-pointer group" id="flash-quest-label">
                <input type="checkbox" id="${window.todayFlash.id}" class="w-8 h-8 text-emerald-500 rounded-xl focus:ring-emerald-400 checklist-item peer" ${window.isFlashActive ? '' : 'disabled'} data-exp="${window.todayFlash.exp}" data-type="${window.todayFlash.type}" data-title="${window.todayFlash.title}">
                <div class="absolute text-gray-400 peer-disabled:block hidden pointer-events-none text-xl">🔒</div>
            </label>
        </div>
    `;
}

// --- 11. TASBIH DIGITAL ---
window.currentTasbihType = document.getElementById('tasbih-type') ? document.getElementById('tasbih-type').value : 'subhanallah';
window.tasbihCount = parseInt(localStorage.getItem(`tasbih_${window.currentTasbihType}`) || 0);

const tasbihBtn = document.getElementById('btn-tasbih');
const tasbihCounterDisplay = document.getElementById('tasbih-counter');
const tasbihBar = document.getElementById('tasbih-bar');
const tasbihTypeSelector = document.getElementById('tasbih-type');
const tasbihResetBtn = document.getElementById('tasbih-reset');
const tasbihCustomInput = document.getElementById('tasbih-custom-input');
const tasbihTargetText = document.getElementById('tasbih-target-text');

if(tasbihCustomInput) {
    tasbihCustomInput.value = localStorage.getItem('tasbih_custom_text') || '';
    tasbihCustomInput.addEventListener('input', (e) => { localStorage.setItem('tasbih_custom_text', e.target.value); });
}

window.updateTasbihUI = function() {
    if(!tasbihCounterDisplay) return;
    tasbihCounterDisplay.innerText = window.tasbihCount;
    if(window.currentTasbihType === 'custom') { tasbihCustomInput.classList.remove('hidden'); tasbihCustomInput.classList.add('block'); } 
    else { tasbihCustomInput.classList.remove('block'); tasbihCustomInput.classList.add('hidden'); }
    let progress = 0;
    if (window.tasbihCount < 33) { tasbihTargetText.innerText = "33"; progress = (window.tasbihCount / 33) * 100; } 
    else if (window.tasbihCount < 1000) { tasbihTargetText.innerText = "1000"; progress = (window.tasbihCount / 1000) * 100; } 
    else { tasbihTargetText.innerText = "MAX"; progress = 100; }
    if(tasbihBar) tasbihBar.style.width = `${progress}%`;
}

if (tasbihTypeSelector) {
    tasbihTypeSelector.addEventListener('change', (e) => {
        window.currentTasbihType = e.target.value; 
        window.tasbihCount = parseInt(localStorage.getItem(`tasbih_${window.currentTasbihType}`) || 0); 
        window.updateTasbihUI();
    });
}

if (tasbihBtn) {
    tasbihBtn.addEventListener('click', () => {
        window.tasbihCount++; localStorage.setItem(`tasbih_${window.currentTasbihType}`, window.tasbihCount);
        if (navigator.vibrate) navigator.vibrate(30); 
     
        if (window.tasbihCount === 33) {
            let bonusExp = window.vipBuff ? 10 : 5; window.totalKoin += 10; window.totalExp += bonusExp;
            localStorage.setItem('totalKoin', window.totalKoin); localStorage.setItem('totalExp', window.totalExp);
            document.getElementById('koin-display').innerText = window.totalKoin; 
            if(window.updateStatsUI) window.updateStatsUI();
            if(typeof confetti === 'function') confetti({ particleCount: 60, spread: 50, origin: { y: 0.8 } });
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]); 
            setTimeout(() => alert("Alhamdulillah! Target 33x tercapai. Koin bertambah!\nLanjut ke 1000x untuk dapat Mega EXP!"), 200);
        }
        if (window.tasbihCount === 1000) {
            let bonusExp = window.vipBuff ? 1000 : 500; window.totalExp += bonusExp; 
            localStorage.setItem('totalExp', window.totalExp); 
            if(window.updateStatsUI) window.updateStatsUI();
            if(typeof confetti === 'function') confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
            if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
            setTimeout(() => alert("MashaAllah! Kamu mencapai 1000x Dzikir.\nEXP Bonus diberikan!"), 200);
        }
        window.updateTasbihUI();
    });
}

if (tasbihResetBtn) {
    tasbihResetBtn.addEventListener('click', () => {
        if(confirm("Yakin ingin mereset angka tasbih ini ke 0?")) { 
            window.tasbihCount = 0; localStorage.setItem(`tasbih_${window.currentTasbihType}`, 0); window.updateTasbihUI(); 
        }
    });
}
window.updateTasbihUI();

// --- 10. ATTACH LISTENERS & SANKSI PENALTI ---
const todayStr = new Date().toDateString();
let lastVisitStr = localStorage.getItem('lastVisit');
window.streakNum = parseInt(localStorage.getItem('streak') || 0);

if (lastVisitStr && lastVisitStr !== todayStr) {
    let missedSholat = 0;
    window.sholatWajib.forEach(q => { if(localStorage.getItem(q.id) !== 'true') missedSholat++; });
    
    let penaltyExp = 0; let isStreakLost = false;

    if(missedSholat === 1) penaltyExp = 50;
    else if(missedSholat === 2) penaltyExp = 150;
    else if(missedSholat === 3) penaltyExp = 350;
    else if(missedSholat === 4) penaltyExp = 750;
    else if(missedSholat === 5) { penaltyExp = 1500; isStreakLost = true; window.streakNum = 0; }

    let gachaFailed = false;
    if(localStorage.getItem('gachaIsWajib') === 'true' && localStorage.getItem('quest-gacha') !== 'true') {
        penaltyExp += 500; gachaFailed = true;
    }

    if(penaltyExp > 0) {
        window.totalExp = Math.max(0, window.totalExp - penaltyExp);
        localStorage.setItem('totalExp', window.totalExp);
        let alertMsg = `⚠️ LAPORAN JALUR LANGIT KEMARIN ⚠️\n\n`;
        if(missedSholat > 0) alertMsg += `- Kamu meninggalkan ${missedSholat} Waktu Sholat!\n`;
        if(gachaFailed) alertMsg += `- Kamu mengabaikan Misi Gacha Wajib!\n`;
        alertMsg += `\nTotal Penalti: -${penaltyExp} EXP.`;
        if(isStreakLost) alertMsg += `\n🔥 STREAK KAMU HANGUS! Mulai dari 0 lagi.`;
        setTimeout(() => alert(alertMsg), 1000);
    }

    if (localStorage.getItem('completedYesterday') !== 'true' && !isStreakLost) window.streakNum = 0;
    
    let resets = ['quest-gacha', 'gachaIsWajib', 'gachaDate', 'gachaMission', window.todayFlash.id];
    window.sholatWajib.forEach(q => resets.push(q.id)); window.dailyQuests.forEach(q => resets.push(q.id));
    resets.push(window.currentEpic.id); resets.push('vip-puasa-buff');
    resets.forEach(id => localStorage.setItem(id, 'false'));
    
    ['tasbih_subhanallah', 'tasbih_alhamdulillah', 'tasbih_allahuakbar', 'tasbih_custom'].forEach(t_id => {
        localStorage.setItem(t_id, 0);
    });
    localStorage.setItem('completedYesterday', 'false'); 
    localStorage.setItem('lastVisit', todayStr); 
    localStorage.setItem('streak', window.streakNum);
} else if (!lastVisitStr) { localStorage.setItem('lastVisit', todayStr); }

const streakDisplay = document.getElementById('streak-display');
if(streakDisplay) streakDisplay.innerText = `🔥 ${window.streakNum}`;

window.attachChecklistListeners = function() {
    document.querySelectorAll('.checklist-item').forEach(box => {
        if (localStorage.getItem(box.id) === 'true') { box.checked = true; box.disabled = true; if(box.id === 'vip-puasa-buff') window.vipBuff = true; }
        let newBox = box.cloneNode(true); box.parentNode.replaceChild(newBox, box);
     
        newBox.addEventListener('change', function() {
            if (!this.checked) { this.checked = true; return; }
            localStorage.setItem(this.id, 'true'); this.disabled = true; 
            
            if(this.id === 'vip-puasa-buff') {
                localStorage.setItem('vip_buff_active', 'true'); window.vipBuff = true;
                alert("🎉 JALUR VIP AKTIF! Semua ibadahmu hari ini akan dikalikan 2 EXP-nya!");
            }
            
            let expVal = parseInt(this.getAttribute('data-exp') || 0);
            let finalExp = window.vipBuff ? expVal * 2 : expVal;
            let questType = this.getAttribute('data-type') || 'pusat';
            let questTitle = this.getAttribute('data-title') || "Selesaikan Misi";
            
            window.totalExp += finalExp; window.totalKoin += finalExp; 
            
            if(window.statsRadar[questType] !== undefined) {
                window.statsRadar[questType] = Math.min(100, window.statsRadar[questType] + 5); 
            }
            localStorage.setItem('statsRadar', JSON.stringify(window.statsRadar));

            if(window.renderCharts) window.renderCharts();
            if(window.logActivityForHeatmap) window.logActivityForHeatmap(); 
            
            const username = document.getElementById('user-name') ? document.getElementById('user-name').value : "Kamu";
            if(window.pushToLiveFeed) window.pushToLiveFeed(username || "Kamu", `Menyelesaikan ${questTitle}`, 'task', finalExp);

            if(typeof confetti === 'function') confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            
            if(window.addPendingGlobalMission) window.addPendingGlobalMission(1);
            if(window.syncExpToFirebase) window.syncExpToFirebase(finalExp);
            if(window.syncStatsToFirebase) window.syncStatsToFirebase();
            if(window.updateBadges) window.updateBadges();
            
            localStorage.setItem('totalExp', window.totalExp); 
            localStorage.setItem('totalKoin', window.totalKoin);
            const koinDisplay = document.getElementById('koin-display');
            if(koinDisplay) koinDisplay.innerText = window.totalKoin;
            if(window.updateStatsUI) window.updateStatsUI();

            let anyChecked = document.querySelectorAll('.checklist-item:checked').length > 0;
            if (anyChecked) {
                localStorage.setItem('completedYesterday', 'true');
                if (window.streakNum === 0 && lastVisitStr === todayStr) {
                    window.streakNum = 1; localStorage.setItem('streak', window.streakNum); 
                    if(streakDisplay) streakDisplay.innerText = `🔥 ${window.streakNum}`;
                }
            }
            if (typeof window.checkEpicComboUnlock === 'function') window.checkEpicComboUnlock(true); 
        });
    });
}
window.attachChecklistListeners();
