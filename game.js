// POJ Memory Card Game Logic

class POJMemoryGame {
    constructor() {
        // POJ Symbol Set
        this.pojInitials = [
            'p', 'ph', 'm', 'b',
            't', 'th', 'n', 'l',
            'k', 'kh', 'ng', 'g', 'h',
            'ch', 'chh', 's', 'j'
        ];

        this.pojVowels = ['a', 'i', 'u', 'e', 'o', 'o͘'];
        this.pojDiphthongs = ['ai', 'au', 'ia', 'iu', 'io', 'io͘', 'iau', 'ui', 'oa', 'oe', 'oai'];
        this.pojNasals = ['aⁿ', 'iⁿ', 'oⁿ', 'eⁿ', 'aiⁿ', 'auⁿ', 'iaⁿ', 'iuⁿ', 'iauⁿ', 'uiⁿ', 'oaⁿ', 'oaiⁿ'];
        this.pojNasalFinals = ['am', 'an', 'ang', 'im', 'iam', 'iang', 'iong', 'un', 'om', 'ong', 'oan', 'oang', 'ian', 'eng'];
        this.pojStopFinals = ['ap', 'at', 'ak', 'ah', 'ip', 'it', 'ih', 'ut', 'uh', 'op', 'ok', 'o͘h', 'eh', 'oh', 'iap', 'iak', 'iok', 'oat', 'oak', 'iat', 'ek'];

        // Game state
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 12;
        this.flips = 0;
        this.timerInterval = null;
        this.startTime = null;
        this.isProcessing = false; // Prevent clicking during card comparison
        this.cardSet = 'vowels';
        this.currentLang = 'poj';
        this.audioEnabled = true;

        this.initGame();
    }

    async initGame() {
        this.translateUI();
        this.getCardSet();
        this.createCardSet();
        this.shuffleCards();
        this.renderBoard();
        this.startTimer();
        this.attachEventListeners();
    }

    translateUI() {
        const t = TRANSLATIONS[this.currentLang];

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const keys = key.split('.');
            let value = t;
            for (const k of keys) {
                value = value[k];
            }
            if (value) {
                if (element.tagName === 'OPTION') {
                    element.textContent = value;
                } else {
                    element.textContent = value;
                }
            }
        });
    }

    getCardSet() {
        const cardSetSelect = document.getElementById('card-set');
        this.cardSet = cardSetSelect?.value || 'vowels';

        // Set symbols and grid based on card set
        switch (this.cardSet) {
            case 'vowels':
                this.symbolSet = this.pojVowels; // 6 vowels
                this.totalPairs = 6;
                this.gridCols = 4;
                this.gridRows = 3; // 4x3 = 12 cards
                break;
            case 'diphthongs':
                this.symbolSet = this.pojDiphthongs; // 11 diphthongs
                this.totalPairs = 11;
                this.gridCols = 6;
                this.gridRows = 4; // 6x4 = 24 cards (11 pairs + 2 extra slots)
                break;
            case 'nasals':
                this.symbolSet = this.pojNasals; // 12 nasals
                this.totalPairs = 12;
                this.gridCols = 6;
                this.gridRows = 4; // 6x4 = 24 cards
                break;
            case 'nasalFinals':
                this.symbolSet = this.pojNasalFinals; // 14 nasal finals
                this.totalPairs = 14;
                this.gridCols = 7;
                this.gridRows = 4; // 7x4 = 28 cards
                break;
            case 'stopFinals':
                this.symbolSet = this.pojStopFinals; // 21 stop finals
                this.totalPairs = 21;
                this.gridCols = 7;
                this.gridRows = 6; // 7x6 = 42 cards
                break;
            case 'initials':
            default:
                this.symbolSet = this.pojInitials; // 17 initials
                this.totalPairs = 17;
                this.gridCols = 7;
                this.gridRows = 5; // 7x5 = 35 cards (17 pairs + 1 extra slot)
                break;
        }
    }

    createCardSet() {
        this.cards = [];

        // Use the symbol set from difficulty selection
        const selectedSymbols = this.symbolSet.slice(0, this.totalPairs);

        // Create pairs
        selectedSymbols.forEach((symbol, index) => {
            let type = 'initial';
            if (this.pojVowels.includes(symbol)) {
                type = 'vowel';
            } else if (this.pojDiphthongs.includes(symbol)) {
                type = 'diphthong';
            } else if (this.pojNasals.includes(symbol)) {
                type = 'nasal';
            } else if (this.pojNasalFinals.includes(symbol)) {
                type = 'nasalFinal';
            } else if (this.pojStopFinals.includes(symbol)) {
                type = 'stopFinal';
            }


            // First card of pair
            this.cards.push({
                symbol: symbol,
                type: type,
                id: `${symbol}-0`,
                matched: false,
                flipped: false
            });

            // Second card of pair
            this.cards.push({
                symbol: symbol,
                type: type,
                id: `${symbol}-1`,
                matched: false,
                flipped: false
            });
        });
    }

    shuffleCards() {
        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    renderBoard() {
        const board = document.getElementById('game-board');
        board.innerHTML = '';

        // Set grid layout via CSS variables
        board.style.setProperty('--grid-cols', this.gridCols);
        board.style.setProperty('--grid-rows', this.gridRows);

        // Calculate aspect ratio for the board to maintain card proportions
        // Assuming card ratio is 3:4 (0.75)
        // Board ratio = (cols * 3) / (rows * 4)
        const boardRatio = (this.gridCols * 3) / (this.gridRows * 4);
        board.style.setProperty('--board-ratio', boardRatio);

        // Remove inline styles that might interfere
        // board.style = ''; // REMOVED: This was clearing the CSS variables we just set

        this.cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            board.appendChild(cardElement);
        });

        this.updateStats();
        this.adjustCardFontSize();
    }

    adjustCardFontSize() {
        // Find the longest text in the current card set
        const longestText = this.symbolSet.reduce((longest, symbol) =>
            symbol.length > longest.length ? symbol : longest, '');

        // Create a temporary element to measure text
        const tempCard = document.createElement('div');
        tempCard.style.position = 'absolute';
        tempCard.style.visibility = 'hidden';
        tempCard.className = 'card';
        document.body.appendChild(tempCard);

        const tempInner = document.createElement('div');
        tempInner.className = 'card-inner';
        tempCard.appendChild(tempInner);

        const tempFront = document.createElement('div');
        tempFront.className = 'card-front';
        tempInner.appendChild(tempFront);

        const tempSymbol = document.createElement('span');
        tempSymbol.className = 'symbol';
        tempSymbol.textContent = longestText;
        tempFront.appendChild(tempSymbol);

        // Get actual card dimensions
        const actualCard = document.querySelector('.card');
        if (!actualCard) {
            document.body.removeChild(tempCard);
            return;
        }

        const cardWidth = actualCard.offsetWidth;
        const cardHeight = actualCard.offsetHeight;
        const padding = 20; // Padding inside card

        // Binary search for optimal font size
        let minSize = 10;
        let maxSize = 100;
        let optimalSize = minSize;

        while (maxSize - minSize > 0.5) {
            const testSize = (minSize + maxSize) / 2;
            tempSymbol.style.fontSize = testSize + 'px';

            const textWidth = tempSymbol.offsetWidth;
            const textHeight = tempSymbol.offsetHeight;

            if (textWidth <= cardWidth - padding && textHeight <= cardHeight - padding) {
                optimalSize = testSize;
                minSize = testSize;
            } else {
                maxSize = testSize;
            }
        }

        // Apply the optimal font size to all cards
        document.documentElement.style.setProperty('--card-font-size', optimalSize + 'px');

        // Clean up
        document.body.removeChild(tempCard);
    }

    createCardElement(card, index) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.id = card.id;
        cardDiv.dataset.index = index;

        if (card.matched) {
            cardDiv.classList.add('matched');
        }
        if (card.flipped) {
            cardDiv.classList.add('flipped');
        }

        // Create card structure using DOM methods
        const inner = document.createElement('div');
        inner.className = 'card-inner';

        const back = document.createElement('div');
        back.className = 'card-back';

        const front = document.createElement('div');
        front.className = `card-front ${card.type}`;

        const symbol = document.createElement('span');
        symbol.className = 'symbol';
        symbol.textContent = card.symbol;

        front.appendChild(symbol);
        inner.appendChild(back);
        inner.appendChild(front);
        cardDiv.appendChild(inner);

        return cardDiv;
    }

    attachEventListeners() {
        console.log('Attaching event listeners');
        const board = document.getElementById('game-board');
        board.addEventListener('click', (e) => {
            console.log('Board clicked', e.target);
            const cardElement = e.target.closest('.card');
            if (cardElement) {
                console.log('Card clicked', cardElement.dataset.index);
                if (!this.isProcessing) {
                    const index = parseInt(cardElement.dataset.index);
                    this.handleCardClick(index);
                } else {
                    console.log('Game is processing, click ignored');
                }
            } else {
                console.log('Click not on card');
            }
        });

        document.getElementById('new-game')?.addEventListener('click', () => {
            this.resetGame();
        });

        // Card Set change
        document.getElementById('card-set')?.addEventListener('change', () => {
            this.resetGame();
        });

        // Language change
        document.getElementById('language-select')?.addEventListener('change', (e) => {
            this.currentLang = e.target.value;
            this.translateUI();
        });

        // Audio toggle
        const audioBtn = document.getElementById('audio-btn');
        audioBtn?.addEventListener('click', () => {
            this.audioEnabled = !this.audioEnabled;

            // Update icon
            if (this.audioEnabled) {
                audioBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
                audioBtn.classList.remove('muted');
            } else {
                audioBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>';
                audioBtn.classList.add('muted');
            }
        });
    }

    handleCardClick(index) {
        const card = this.cards[index];

        // Ignore if card is already matched or flipped
        if (card.matched || card.flipped) {
            return;
        }

        // Flip the card
        card.flipped = true;
        this.flips++;
        this.flippedCards.push(index);
        this.updateCardElement(index);
        this.updateStats();

        // Play pronunciation
        this.playAudio(card.symbol);

        // Check if we have 2 cards flipped
        if (this.flippedCards.length === 2) {
            this.isProcessing = true;
            this.updateStats();

            setTimeout(() => {
                this.checkMatch();
            }, 800);
        }
    }

    playAudio(symbol) {
        if (!this.audioEnabled) return;
        // Construct path to audio file
        // Note: User needs to provide audio files in 'audio/' directory
        // Format: audio/p.mp3, audio/ph.mp3, etc.

        // Handle special characters for filenames to ensure cross-platform compatibility
        let filename = symbol;
        if (symbol === 'o͘') {
            filename = 'oo';
        } else if (symbol === 'io͘') {
            filename = 'ioo';
        } else if (symbol === 'o͘h') {
            filename = 'ooh';
        }

        // Handle nasal ⁿ -> nn
        if (filename.includes('ⁿ')) {
            filename = filename.replace('ⁿ', 'nn');
        }

        const audioPath = `audio/${filename}.mp3`;

        const audio = new Audio(audioPath);
        audio.play().catch(e => {
            // Audio file might be missing, just log it
            console.log(`Audio not found for ${symbol}:`, e);
        });
    }

    checkMatch() {
        const [index1, index2] = this.flippedCards;
        const card1 = this.cards[index1];
        const card2 = this.cards[index2];

        if (card1.symbol === card2.symbol) {
            // Match!
            card1.matched = true;
            card2.matched = true;
            this.matchedPairs++;

            this.updateCardElement(index1);
            this.updateCardElement(index2);

            this.flippedCards = [];
            this.isProcessing = false;

            // Check win condition
            if (this.matchedPairs === this.totalPairs) {
                this.stopTimer();
                this.stopTimer();
                const time = this.getElapsedTime();
                const accuracy = Math.round((this.totalPairs / this.flips) * 100);
                const t = TRANSLATIONS[this.currentLang];
                const cardSetName = t.cardSetNames[this.cardSet] || this.cardSet;

                setTimeout(() => {
                    this.showModal(t.modalTitle, t.modalMessage, {
                        time: time,
                        flips: this.flips,
                        cardSet: cardSetName,
                        accuracy: `${accuracy}%`
                    });
                }, 500);
            }
        } else {
            // No match - flip back
            card1.flipped = false;
            card2.flipped = false;

            this.updateCardElement(index1);
            this.updateCardElement(index2);

            this.flippedCards = [];
            this.isProcessing = false;
        }

        this.updateStats();
    }

    updateCardElement(index) {
        const card = this.cards[index];
        const cardElement = document.querySelector(`[data-index="${index}"]`);

        if (cardElement) {
            // Toggle classes instead of resetting to avoid re-triggering animations
            if (card.flipped) {
                cardElement.classList.add('flipped');
            } else {
                cardElement.classList.remove('flipped');
            }
            if (card.matched) {
                cardElement.classList.add('matched');
            } else {
                cardElement.classList.remove('matched');
            }
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            document.getElementById('timer').textContent = this.getElapsedTime();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    getElapsedTime() {
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    updateStats() {
        document.getElementById('flips').textContent = this.flips;
        document.getElementById('matched').textContent = `${this.matchedPairs}/${this.totalPairs}`;
    }

    showModal(title, message, stats = null) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;

        const statsContainer = document.getElementById('modal-stats');
        statsContainer.innerHTML = '';

        if (stats) {
            const t = TRANSLATIONS[this.currentLang];
            const statLabels = {
                time: t.modalTime,
                flips: t.modalFlips,
                cardSet: t.modalCardSet,
                accuracy: t.modalAccuracy
            };

            Object.entries(stats).forEach(([key, value]) => {
                const item = document.createElement('div');
                item.className = 'modal-stat-item';
                item.innerHTML = `
                    <span class="modal-stat-label">${statLabels[key] || key}</span>
                    <span class="modal-stat-value">${value}</span>
                `;
                statsContainer.appendChild(item);
            });
        }

        document.getElementById('modal').classList.add('active');
    }

    hideModal() {
        document.getElementById('modal').classList.remove('active');
    }

    async resetGame() {
        this.stopTimer();
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.flips = 0;
        this.isProcessing = false;
        this.hideModal();

        this.getCardSet();
        this.createCardSet();
        this.shuffleCards();
        this.renderBoard();
        this.startTimer();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new POJMemoryGame();

    // Attach modal button
    document.getElementById('modal-btn')?.addEventListener('click', () => {
        game.resetGame();
    });
});
