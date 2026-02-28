// --- 4. PROFIL, KUTIPAN & LEVELING PROGRESIF ---
const nameInput = document.getElementById('user-name');
const bioInput = document.getElementById('user-bio');
const quoteInput = document.getElementById('user-quote');

if(nameInput) nameInput.value = localStorage.getItem('userName') || ''; 
if(bioInput) bioInput.value = localStorage.getItem('userBio') || '';
if(quoteInput) quoteInput.value = localStorage.getItem('userQuote') || '';

if(nameInput) nameInput.addEventListener('change', () => { 
    localStorage.setItem('userName', nameInput.value); 
    if(window.syncProfileToFirebase) window.syncProfileToFirebase(); 
});
if(bioInput) bioInput.addEventListener('change', () => { 
    localStorage.setItem('userBio', bioInput.value); 
    if(window.syncProfileToFirebase) window.syncProfileToFirebase(); 
});
if(quoteInput) quoteInput.addEventListener('change', () => { 
    localStorage.setItem('userQuote', quoteInput.value); 
    if(window.syncProfileToFirebase) window.syncProfileToFirebase(); 
});

window.totalExp = parseInt(localStorage.getItem('totalExp') || 0);
window.totalKoin = parseInt(localStorage.getItem('totalKoin') || 0);
const koinDisplay = document.getElementById('koin-display');
if(koinDisplay) koinDisplay.innerText = window.totalKoin;

window.getExpRequirement = function(level) { return 50 * level * (level + 1); }

window.calculateLevelInfo = function(totalExp) {
    let lvl = 1;
    let isCapped = false;
    let nextExamLvl = null;

    while (totalExp >= window.getExpRequirement(lvl)) {
        let targetLevel = lvl + 1;
        if (targetLevel % 10 === 0 && targetLevel <= 50) {
            if (localStorage.getItem(`exam_passed_${targetLevel}`) !== 'true') {
                isCapped = true; nextExamLvl = targetLevel; break; 
            }
        }
        lvl++;
        if (lvl >= 50) { lvl = 50; break; }
    }

    let expForCurrentLvl = lvl === 1 ? 0 : window.getExpRequirement(lvl - 1);
    let expForNextLvl = window.getExpRequirement(lvl);
    let requiredExp = expForNextLvl - expForCurrentLvl;
    let currentLevelExp = totalExp - expForCurrentLvl;
    
    if (isCapped && totalExp >= expForNextLvl) currentLevelExp = requiredExp; 
    return { level: lvl, expCurrent: currentLevelExp, expRequired: requiredExp, isCapped, nextExamLvl };
}

window.getTitle = function(lvl) {
    if(lvl < 10) return "NPC Duniawi";
    if(lvl < 20) return "Skena Ibadah";
    if(lvl < 30) return "Pendekar Subuh";
    if(lvl < 40) return "Suhu Akhlaq";
    if(lvl < 50) return "Wali Kategori Ringan";
    return "Backingan Pusat";
}

window.updateAvatarBorder = function(level) {
    const avatar = document.getElementById('avatar-initial');
    if(!avatar) return;
    avatar.classList.remove('ring-4', 'ring-gray-200', 'dark:ring-gray-600', 'ring-blue-400', 'ring-yellow-400', 'shadow-lg', 'shadow-yellow-400/50');
    if (level >= 30) { avatar.classList.add('ring-4', 'ring-yellow-400', 'shadow-lg', 'shadow-yellow-400/50'); } 
    else if (level >= 10) { avatar.classList.add('ring-4', 'ring-blue-400'); } 
    else { avatar.classList.add('ring-4', 'ring-gray-200', 'dark:ring-gray-600'); }
}

window.updateStatsUI = function() {
    let info = window.calculateLevelInfo(window.totalExp);
    let currentTitle = window.getTitle(info.level);
    let percent = (info.expCurrent / info.expRequired) * 100;
    if (percent > 100) percent = 100;

    const headerLevel = document.getElementById('header-level');
    const headerTitle = document.getElementById('header-title');
    const displayLevel = document.getElementById('display-level');
    
    if(headerLevel) headerLevel.innerText = `Lv.${info.level}`;
    if(headerTitle) headerTitle.innerText = currentTitle;
    if(displayLevel) displayLevel.innerText = `Level ${info.level}`;
    
    const expBar = document.getElementById('exp-bar');
    const displayExp = document.getElementById('display-exp');
    const displayTitleBot = document.getElementById('display-title-bot');
    
    if(expBar && displayExp && displayTitleBot) {
        if (info.isCapped && info.expCurrent >= info.expRequired) {
            displayExp.innerHTML = `<span class="text-rose-500 animate-pulse">🔒 MAX (Butuh Ujian)</span>`;
            expBar.style.width = '100%';
            expBar.className = "bg-gradient-to-r from-rose-500 to-orange-500 h-3.5 rounded-full transition-all duration-1000 shadow-md cursor-pointer animate-pulse";
            expBar.onclick = () => window.openExamModal(info.nextExamLvl);
            displayTitleBot.innerHTML = `⚠️ <span class="underline text-rose-400 cursor-pointer" onclick="window.openExamModal(${info.nextExamLvl})">KLIK UNTUK UJIAN NAIK KE LV.${info.nextExamLvl}</span>`;
        } else {
            displayExp.innerText = `${info.expCurrent} / ${info.expRequired} EXP`;
            expBar.style.width = `${percent}%`;
            expBar.className = "bg-gradient-to-r from-emerald-400 to-teal-500 h-3.5 rounded-full transition-all duration-1000 ease-out shadow-md";
            expBar.onclick = null;
            displayTitleBot.innerText = `🏆 Gelar: ${currentTitle}`;
        }
    }
    window.updateAvatarBorder(info.level);
}
window.updateStatsUI();

// --- 10.5 SISTEM UJIAN KENAIKAN RANK ---
window.openExamModal = function(targetLevel) {
    const modal = document.getElementById('exam-modal');
    const list = document.getElementById('exam-requirements-list');
    document.getElementById('exam-level-target').innerText = targetLevel;
    
    let html = ''; let isEligible = true;
    let streak = parseInt(localStorage.getItem('streak') || 0);
    let totalDzikir = parseInt(localStorage.getItem('tasbih_subhanallah')||0) + parseInt(localStorage.getItem('tasbih_alhamdulillah')||0) + parseInt(localStorage.getItem('tasbih_allahuakbar')||0);

    if (targetLevel === 10) {
        let req1 = streak >= 3; let req2 = totalDzikir >= 333;
        html += `<li class="flex items-center gap-2 ${req1 ? 'text-emerald-400' : 'text-gray-400'}">${req1 ? '✅' : '❌'} Punya Streak Ibadah minimal 🔥 3 Hari (Skor: ${streak}/3)</li>`;
        html += `<li class="flex items-center gap-2 ${req2 ? 'text-emerald-400' : 'text-gray-400'}">${req2 ? '✅' : '❌'} Mengamalkan Dzikir Smart Tasbih 333x (Skor: ${totalDzikir}/333)</li>`;
        isEligible = req1 && req2;
    } else if (targetLevel === 20) {
        let req1 = window.statsRadar.derma >= 100; let req2 = streak >= 7;
        html += `<li class="flex items-center gap-2 ${req1 ? 'text-emerald-400' : 'text-gray-400'}">${req1 ? '✅' : '❌'} Poin Aura Sosial/Derma > 100</li>`;
        html += `<li class="flex items-center gap-2 ${req2 ? 'text-emerald-400' : 'text-gray-400'}">${req2 ? '✅' : '❌'} Konsisten Streak Ibadah 🔥 7 Hari</li>`;
        isEligible = req1 && req2;
    } else {
        let req1 = streak >= 10;
        html += `<li class="flex items-center gap-2 ${req1 ? 'text-emerald-400' : 'text-gray-400'}">${req1 ? '✅' : '❌'} Konsisten Streak Ibadah 🔥 10 Hari</li>`;
        isEligible = req1;
    }

    list.innerHTML = html;
    const btnSubmit = document.getElementById('btn-submit-exam');
    
    if(isEligible) {
        btnSubmit.disabled = false;
        btnSubmit.className = "flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-3 rounded-xl transition shadow-lg shadow-emerald-500/30 text-sm";
        btnSubmit.innerText = "Selesaikan Ujian!"; btnSubmit.setAttribute('data-target', targetLevel);
    } else {
        btnSubmit.disabled = true;
        btnSubmit.className = "flex-1 bg-gray-600 text-gray-400 font-bold py-3 rounded-xl cursor-not-allowed text-sm";
        btnSubmit.innerText = "Syarat Belum Cukup"; btnSubmit.removeAttribute('data-target');
    }
    modal.classList.remove('hidden'); modal.classList.add('flex');
}

window.closeExamModal = function() {
    document.getElementById('exam-modal').classList.add('hidden');
    document.getElementById('exam-modal').classList.remove('flex');
}

window.submitExam = function() {
    const btn = document.getElementById('btn-submit-exam');
    const target = btn.getAttribute('data-target');
    if(target) {
        localStorage.setItem(`exam_passed_${target}`, 'true'); window.closeExamModal();
        if(typeof confetti === 'function') confetti({ particleCount: 200, spread: 100, origin: { y: 0.3 } });
        alert(`🎊 LULUS! Selamat, Limit Break berhasil! Kamu sekarang berhak naik ke Level ${target}. EXP yang tertahan kini terbuka kembali.`);
        window.updateStatsUI();
        if(window.pushToLiveFeed) window.pushToLiveFeed(document.getElementById('user-name').value || "Kamu", `Lulus Ujian & Naik ke Level ${target}!`, 'user_level');
    }
}

// --- RAK BADGE ---
window.badgeData = [
    { id: 'bdg_pusat', icon: '🕋', name: 'Admin Pusat', type: 'pusat', reqStat: 50, reqExam: 10, desc: 'Pancaran ibadah wajib yang tiada tara.' },
    { id: 'bdg_aura', icon: '✨', name: 'Aura Memikat', type: 'aura', reqStat: 50, reqExam: 10, desc: 'Karisma dan adab yang menyejukkan hati.' },
    { id: 'bdg_peka', icon: '👼', name: 'Malaikat Peka', type: 'peka', reqStat: 50, reqExam: 20, desc: 'Punya empati tinggi, pendengar curhat terbaik.' },
    { id: 'bdg_sigma', icon: '🗿', name: 'Sigma Sejati', type: 'sigma', reqStat: 50, reqExam: 20, desc: 'Mandiri, disiplin, tangguh, dan selalu on-time.' },
    { id: 'bdg_derma', icon: '🎁', name: 'Sultan Sedekah', type: 'derma', reqStat: 50, reqExam: 30, desc: 'Dermawan sejati yang tangannya selalu di atas.' },
    { id: 'bdg_stoic', icon: '🧊', name: 'Master Stoic', type: 'stoic', reqStat: 50, reqExam: 30, desc: 'Ketenangan batin bagai air, pantang tersulut emosi.' },
    { id: 'bdg_habit', icon: '🔥', name: 'Habit Builder', type: 'streak', reqStat: 7, reqExam: 10, desc: 'Menjaga konsistensi adalah kunci segalanya.' }
];

window.updateBadges = function() {
    const container = document.getElementById('badge-rack-container');
    if(!container) return;
    let html = '';
    let userStreak = parseInt(localStorage.getItem('streak') || 0);

    window.badgeData.forEach(b => {
        let currentVal = b.type === 'streak' ? userStreak : (window.statsRadar[b.type] || 0);
        let isStatMet = currentVal >= b.reqStat;
        let isExamMet = localStorage.getItem(`exam_passed_${b.reqExam}`) === 'true';
        let isUnlocked = isStatMet && isExamMet;

        let stateClass = isUnlocked 
            ? "bg-white dark:bg-gray-800 border-emerald-400 shadow-emerald-500/20 shadow-md transform hover:-translate-y-1" 
            : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60 grayscale";
        
        let iconClass = isUnlocked ? "text-emerald-500 drop-shadow-md" : "text-gray-400";
        let titleColor = isUnlocked ? "text-gray-800 dark:text-gray-100" : "text-gray-500 dark:text-gray-400";
        
        let infoContent = `<span class='text-sm text-emerald-600 block mb-2'>${b.desc}</span><b>Syarat Mendapatkan Trofi:</b><br><br>`;
        infoContent += `<div class='text-left ml-2'>`;
        infoContent += `${isStatMet ? '✅' : '❌'} Poin <b>${b.type.toUpperCase()}</b> capai ${b.reqStat} <span class='text-[10px] text-gray-500'>(Skormu: ${currentVal})</span><br>`;
        infoContent += `${isExamMet ? '✅' : '❌'} Lulus <b>Ujian Rank Lv.${b.reqExam}</b>`;
        infoContent += `</div>`;

        html += `
        <div onclick="openInfoModal('${isUnlocked ? '🎉 ' : '🔒 '}${b.name}', \`${infoContent}\`)" class="snap-center cursor-pointer flex-shrink-0 w-[95px] rounded-2xl p-3 border-2 text-center transition-all duration-300 ${stateClass}">
            <div class="text-3xl mb-2 flex items-center justify-center h-10 ${iconClass}">${isUnlocked ? b.icon : '🔒'}</div>
            <p class="text-[10px] font-extrabold uppercase tracking-wide leading-tight ${titleColor}">${b.name}</p>
        </div>
        `;
    });
    container.innerHTML = html;
}
setTimeout(window.updateBadges, 500);

// --- TOKO KEBAIKAN ---
window.shopCatalog = [
    { id: "title_valid", name: "Gelar: Si Paling Valid", price: 5000, icon: "🔥", type: "title" }, 
    { id: "title_core", name: "Gelar: Amalin Core", price: 8000, icon: "✨", type: "title" },
    { id: "title_pusat", name: "Gelar: Backingan Pusat 📿", price: 15000, icon: "📿", type: "title" },
    { id: "title_sigma", name: "Gelar: Sigma Akhlaq 🗿", price: 20000, icon: "🗿", type: "title" },
    { id: "frame_api", name: "Frame: Api Biru", price: 12000, icon: "🟦", type: "frame" },
    { id: "frame_neon", name: "Frame: Cyberpunk Neon", price: 15000, icon: "🟣", type: "frame" },
    { id: "frame_sage", name: "Frame: Sage Green Estetik", price: 10000, icon: "🌿", type: "frame" },
    { id: "efek_koin", name: "Efek: Hujan Koin", price: 8000, icon: "🪙", type: "effect" },
    { id: "efek_sakura", name: "Efek: Bunga Sakura", price: 10000, icon: "🌸", type: "effect" },
    { id: "guild_tiket", name: "Tiket Gacha Premium", price: 3000, icon: "🎫", type: "consumable" }
];

window.unlockedItems = window.safeJSONParse('unlockedItems', []);
window.renderShop = function() {
    const container = document.getElementById('shop-container');
    if(!container) return; container.innerHTML = ''; 
    window.shopCatalog.forEach(item => {
        const isOwned = window.unlockedItems.includes(item.id);
        const card = document.createElement('div');
        card.className = `p-3 rounded-2xl border-2 text-center transition ${isOwned ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`;
        card.innerHTML = `<div class="text-4xl mb-2 drop-shadow-sm">${item.icon}</div><h3 class="font-bold text-xs text-gray-700 dark:text-gray-200 mb-2">${item.name}</h3>${isOwned ? `<span class="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] block py-1.5">✓ Dimiliki</span>` : `<button onclick="window.buyItem('${item.id}', ${item.price})" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 rounded-xl text-xs font-bold active:scale-95 transition shadow-sm">🪙 ${item.price}</button>`}`;
        container.appendChild(card);
    });
}
window.renderShop();
