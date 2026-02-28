// Event Listener Tombol Generate Player Card (AURA AURA CARD) - MODE POPUP SCREENSHOT
const btnShare = document.getElementById('btn-share');
const cardPreviewModal = document.getElementById('card-preview-modal');

// Fungsi Global untuk menutup Modal
window.closeCardPreview = function() {
    if(cardPreviewModal) {
        cardPreviewModal.classList.add('hidden');
        cardPreviewModal.classList.remove('flex');
    }
}

if(btnShare) {
    btnShare.addEventListener('click', async () => {
        btnShare.innerText = "⏳ Membuka Panel...";
        btnShare.disabled = true;
 
        try {
            // Ambil info level
            let info = window.calculateLevelInfo ? window.calculateLevelInfo(window.totalExp) : {level: 1};
            let overall = Math.min(99, Math.floor(info.level * 1.8) + 10); 
            
            // 1. Set Basic Info
            const cardOvr = document.getElementById('card-ovr');
            if(cardOvr) cardOvr.innerText = overall;

            const userNameEl = document.getElementById('user-name');
            const cardName = document.getElementById('card-name');
            let playerName = userNameEl ? (userNameEl.value || 'PLAYER') : 'PLAYER';
            if(cardName) cardName.innerText = playerName;
            
            const cardTitle = document.getElementById('card-title');
            if(cardTitle) cardTitle.innerText = window.getTitle ? window.getTitle(info.level) : "NPC Duniawi";
            
            const cardExp = document.getElementById('card-exp');
            if(cardExp) cardExp.innerText = (window.totalExp || 0).toLocaleString('id-ID');
 
            // 1.5 Set Info Circle Dinamis (DENGAN AUTO-GENERATE LOGO)
            const circleNameDisp = document.getElementById('circle-name-display');
            const circleLogoDisp = document.getElementById('circle-logo-display');
            
            if(window.userCircleId && circleNameDisp && circleNameDisp.innerText !== 'Memuat...') {
                let circleName = circleNameDisp.innerText;
                document.getElementById('card-circle-name').innerText = circleName;
                
                // Jika punya logo asli dari URL Firebase
                if(circleLogoDisp.querySelector('img')) {
                    let imgSrc = circleLogoDisp.querySelector('img').src;
                    document.getElementById('card-circle-logo').innerHTML = `<img src="${imgSrc}" crossorigin="anonymous" class="w-full h-full object-cover rounded-lg">`;
                } else {
                    // JIKA TIDAK PUNYA LOGO: Generate otomatis logo robot keren berdasarkan Nama Circle!
                    let seed = encodeURIComponent(circleName);
                    let autoLogoUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=064e3b`;
                    document.getElementById('card-circle-logo').innerHTML = `<img src="${autoLogoUrl}" crossorigin="anonymous" class="w-full h-full object-cover rounded-lg">`;
                }
            } else {
                document.getElementById('card-circle-name').innerText = "Solo Player";
                document.getElementById('card-circle-logo').innerHTML = `<span class="text-2xl drop-shadow-md">👤</span>`;
            }
 
            // 2. Set Foto Profil (DENGAN AUTO-GENERATE AVATAR)
            const avatarSrcEl = document.getElementById('avatar-initial');
            const cardAvatarDest = document.getElementById('card-avatar');
            if(avatarSrcEl && cardAvatarDest) {
                // Jika sudah konek Google dan punya Foto Profil
                if(avatarSrcEl.querySelector('img')) {
                    cardAvatarDest.innerHTML = `<img src="${avatarSrcEl.querySelector('img').src}" crossorigin="anonymous" class="w-full h-full object-cover">`;
                } else { 
                    // JIKA TIDAK PUNYA FOTO: Generate avatar karakter otomatis berdasarkan Nama Player!
                    let seedPlayer = encodeURIComponent(playerName);
                    let autoAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedPlayer}&backgroundColor=10b981`;
                    cardAvatarDest.innerHTML = `<img src="${autoAvatarUrl}" crossorigin="anonymous" class="w-full h-full object-cover">`; 
                }
            }
 
            // 3. Set 6 Atribut
            const getStat = (val) => Math.min(99, Math.floor((val || 0) / 2) + 20);
            const radar = window.statsRadar || {};
            let stPusat = getStat(radar.pusat);
            let stAura = getStat(radar.aura);
            let stPeka = getStat(radar.peka);
            let stSigma = getStat(radar.sigma);
            let stDerma = getStat(radar.derma);
            let stStoic = getStat(radar.stoic);
 
            if(document.getElementById('stat-pusat')) document.getElementById('stat-pusat').innerText = stPusat;
            if(document.getElementById('stat-aura')) document.getElementById('stat-aura').innerText = stAura;
            if(document.getElementById('stat-peka')) document.getElementById('stat-peka').innerText = stPeka;
            if(document.getElementById('stat-sigma')) document.getElementById('stat-sigma').innerText = stSigma;
            if(document.getElementById('stat-derma')) document.getElementById('stat-derma').innerText = stDerma;
            if(document.getElementById('stat-stoic')) document.getElementById('stat-stoic').innerText = stStoic;
 
            // 4. Kalkulasi Aura Dominan
            const allStats = { 'Pusat': stPusat, 'Aura': stAura, 'Peka': stPeka, 'Sigma': stSigma, 'Derma': stDerma, 'Stoic': stStoic };
            const domName = Object.keys(allStats).reduce((a, b) => allStats[a] > allStats[b] ? a : b);
            const statEmojis = { 'Pusat': '🕋', 'Aura': '✨', 'Peka': '👼', 'Sigma': '🗿', 'Derma': '🤝', 'Stoic': '🧊' };
            
            const cardDomIcon = document.getElementById('card-dom-icon');
            const cardDomText = document.getElementById('card-dom-text');
            if(cardDomIcon) cardDomIcon.innerText = statEmojis[domName];
            if(cardDomText) cardDomText.innerText = domName;
 
            // 5. Cek Rank Global
            const rankBanner = document.getElementById('card-rank-banner');
            if(rankBanner) rankBanner.classList.add('hidden'); 
            
            if (window.auth && window.auth.currentUser && !window.auth.currentUser.isAnonymous) {
                try {
                    if(window.getDocs && window.query && window.collection && window.db && window.where) {
                        const qRank = window.query(window.collection(window.db, "users"), window.where("monthly_exp", ">", window.totalExp));
                        const snapRank = await window.getDocs(qRank);
                        let actualRank = snapRank.size + 1; 
                        
                        if (actualRank <= 10 && window.totalExp > 0 && rankBanner) {
                            rankBanner.innerText = `GLOBAL RANK ${actualRank}`;
                            rankBanner.classList.remove('hidden');
                        }
                    }
                } catch(e) { console.warn("Rank fetch failed", e); }
            }
 
            // 6. Buka Pop-Up
            setTimeout(() => {
                if(cardPreviewModal) {
                    cardPreviewModal.classList.remove('hidden');
                    cardPreviewModal.classList.add('flex');
                }
                btnShare.innerText = "🃏 Flex Prayer Card"; btnShare.disabled = false;
                if(typeof confetti === 'function') confetti({ particleCount: 150, spread: 80, zIndex: 1000, colors: ['#a855f7', '#eab308'] });
            }, 300);
 
        } catch (err) {
            console.error(err);
            btnShare.innerText = "🃏 Flex Prayer Card"; btnShare.disabled = false;
        }
    });
}
