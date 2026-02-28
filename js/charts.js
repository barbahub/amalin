// --- AUTO-MIGRASI DATA STATS LAMA KE BARU ---
window.statsRadar = window.safeJSONParse('statsRadar', { pusat: 10, aura: 10, peka: 10, sigma: 10, derma: 10, stoic: 10 });
if (window.statsRadar.ketuhanan !== undefined) {
    window.statsRadar = {
        pusat: window.statsRadar.ketuhanan || 10,
        derma: window.statsRadar.gotong_royong || 10,
        stoic: window.statsRadar.disiplin || 10,
        sigma: window.statsRadar.tanggung_jawab || 10,
        peka: window.statsRadar.peduli || 10,
        aura: 10
    };
    localStorage.setItem('statsRadar', JSON.stringify(window.statsRadar));
}

// --- 9. SISTEM RADAR CHART & HEATMAP ---
window.getAuraBadgeUI = function(level, dominantStatName) {
    const statEmojis = { 'Pusat': '🕋', 'Aura': '✨', 'Peka': '👼', 'Sigma': '🗿', 'Derma': '🤝', 'Stoic': '🧊' };
    let baseEmoji = statEmojis[dominantStatName] || '🔥';
    let badgeClass = '', titleColor = '', emojiDisplay = baseEmoji;

    if (level < 10) { badgeClass = 'bg-gray-800 border-gray-600'; titleColor = 'text-gray-400'; emojiDisplay = baseEmoji; } 
    else if (level < 20) { badgeClass = 'bg-gray-800 border-amber-700 shadow-lg shadow-amber-900/40'; titleColor = 'text-amber-500'; emojiDisplay = `${baseEmoji}✨`; } 
    else if (level < 30) { badgeClass = 'bg-slate-800 border-slate-300 shadow-lg shadow-slate-400/50 animate-pulse'; titleColor = 'text-slate-200'; emojiDisplay = `❄️${baseEmoji}❄️`; } 
    else if (level < 40) { badgeClass = 'bg-gradient-to-br from-yellow-900 to-yellow-700 border-yellow-400 shadow-xl shadow-yellow-500/50 relative overflow-hidden'; titleColor = 'text-yellow-300 font-black'; emojiDisplay = `<span class="inline-block animate-bounce">👑${baseEmoji}</span>`; } 
    else if (level < 50) { badgeClass = 'bg-fuchsia-950 border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.6)]'; titleColor = 'text-fuchsia-400 font-black tracking-widest drop-shadow-md'; emojiDisplay = `🔮${baseEmoji}🔮`; } 
    else { badgeClass = 'bg-black border-transparent relative z-10 before:absolute before:-inset-1 before:bg-gradient-to-r before:from-red-500 before:via-yellow-500 before:to-purple-500 before:-z-10 before:animate-spin shadow-[0_0_25px_rgba(239,68,68,0.8)]'; titleColor = 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-red-500 font-black tracking-widest animate-pulse'; emojiDisplay = `<span class="inline-block animate-bounce">⚡👑${baseEmoji}👑⚡</span>`; }

    return `<div class="rounded-2xl p-2 border-2 flex flex-col items-center justify-center text-center transition-all ${badgeClass} h-full min-h-[90px]">
        <div class="text-3xl mb-1 drop-shadow-lg">${emojiDisplay}</div>
        <p class="text-[8px] font-bold uppercase tracking-widest text-gray-300 mb-0.5 opacity-80">Aura Dominan</p>
        <h4 class="text-[10px] ${titleColor} uppercase line-clamp-1">${dominantStatName}</h4>
    </div>`;
}

window.radarChartInstance = null;
window.donutChartInstance = null;

window.renderCharts = function() {
    const ctxR = document.getElementById('radarChart')?.getContext('2d');
    const ctxD = document.getElementById('donutChart')?.getContext('2d');
    if(!ctxR || !ctxD) return;

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    const fontColor = isDark ? '#9CA3AF' : '#6B7280';
    
    const labels = ['Pusat', 'Aura', 'Peka', 'Sigma', 'Derma', 'Stoic'];
    const dataPts = [window.statsRadar.pusat, window.statsRadar.aura, window.statsRadar.peka, window.statsRadar.sigma, window.statsRadar.derma, window.statsRadar.stoic];

    if (window.radarChartInstance) window.radarChartInstance.destroy();
    window.radarChartInstance = new Chart(ctxR, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                data: dataPts, backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 1)', pointBackgroundColor: '#FBBC05', borderWidth: 1.5, pointRadius: 2
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { r: { angleLines: { color: gridColor }, grid: { color: gridColor }, pointLabels: { color: fontColor, font: { size: 9, weight: 'bold' } }, ticks: { display: false } } }, plugins: { legend: { display: false } } }
    });

    let checkedBoxes = document.querySelectorAll('.checklist-item:checked, .sholat-item:checked').length;
    let totalBoxes = document.querySelectorAll('.checklist-item, .sholat-item').length;
    let percentVal = totalBoxes === 0 ? 0 : Math.floor((checkedBoxes/totalBoxes)*100);
    
    if (window.donutChartInstance) window.donutChartInstance.destroy();
    window.donutChartInstance = new Chart(ctxD, {
        type: 'doughnut',
        data: { labels: ['Selesai', 'Sisa'], datasets: [{ data: [checkedBoxes, Math.max(0, totalBoxes - checkedBoxes)], backgroundColor: ['#10B981', gridColor], borderWidth: 0, cutout: '75%' }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: {enabled: false} } }
    });

    document.getElementById('donut-percent').innerText = `${percentVal}%`;

    const maxStatName = labels[ dataPts.indexOf(Math.max(...dataPts)) ];
    // Mengambil level via fungsi yang nanti ada di player.js secara aman
    const userLvl = typeof window.calculateLevelInfo === 'function' ? window.calculateLevelInfo(window.totalExp || 0).level : 1;
    document.getElementById('aura-badge-container').innerHTML = window.getAuraBadgeUI(userLvl, maxStatName);
}

window.updateChartTheme = function() { window.renderCharts(); }

window.activityHistory = window.safeJSONParse('activityHistory', []);
window.updateHeatmap = function() {
    const container = document.getElementById('heatmap-container');
    if(!container) return;
    container.innerHTML = '';
    const last7Days = [];
    for(let i = 6; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); last7Days.push(d.toDateString()); }
    last7Days.forEach(dateStr => {
        const count = window.activityHistory.find(r => r.date === dateStr)?.count || 0;
        let colorClass, tooltip;
        if (count === 0) { colorClass = 'bg-gray-200 dark:bg-gray-700'; tooltip = "Fase Nyasar"; }
        else if (count <= 3) { colorClass = 'bg-emerald-200 dark:bg-emerald-900'; tooltip = "Minimal Niat"; }
        else if (count <= 6) { colorClass = 'bg-emerald-400 dark:bg-emerald-700'; tooltip = "Skena Ibadah"; }
        else if (count <= 10) { colorClass = 'bg-emerald-600 dark:bg-emerald-500'; tooltip = "Rajin Parah"; }
        else { colorClass = 'bg-cyan-400 shadow-sm shadow-cyan-400/50 animate-pulse'; tooltip = "Backingan Pusat"; }
     
        const dayName = new Date(dateStr).toLocaleDateString('id-ID', {weekday: 'short'}).charAt(0);
        container.innerHTML += `<div onclick="alert('Kasta Hari Ini: ${tooltip}')" class="flex flex-col items-center gap-1 cursor-pointer hover:scale-110 transition"><div class="w-8 h-8 rounded-lg ${colorClass} transition-colors duration-500" title="${tooltip}"></div><span class="text-[9px] font-bold text-gray-400">${dayName}</span></div>`;
    });
}
window.updateHeatmap();

window.logActivityForHeatmap = function() {
    const dateStr = new Date().toDateString();
    let recordIndex = window.activityHistory.findIndex(r => r.date === dateStr);
    if(recordIndex >= 0) window.activityHistory[recordIndex].count += 1;
    else window.activityHistory.push({ date: dateStr, count: 1 });
    if(window.activityHistory.length > 14) window.activityHistory.shift(); 
    localStorage.setItem('activityHistory', JSON.stringify(window.activityHistory));
    window.updateHeatmap();
}
