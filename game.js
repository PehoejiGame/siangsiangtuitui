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

        // Game state
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 12;
        this.flips = 0;
        this.timerInterval = null;
        this.startTime = null;
        this.isProcessing = false; // Prevent clicking during card comparison
        this.difficulty = 'medium';

        this.initGame();
    }

    async initGame() {
        this.getDifficulty();
        this.createCardSet();
        this.shuffleCards();
        this.renderBoard();
        this.startTimer();
        this.attachEventListeners();
    }

    getDifficulty() {
        const difficultySelect = document.getElementById('difficulty');
        this.difficulty = difficultySelect?.value || 'initials';

        // Set symbols and grid based on difficulty
        switch (this.difficulty) {
            case 'vowels':
                this.symbolSet = this.pojVowels; // 6 vowels
                this.totalPairs = 6;
                this.gridCols = 4;
                this.gridRows = 3; // 4x3 = 12 cards
                break;
            case 'all':
                this.symbolSet = [...this.pojInitials, ...this.pojVowels]; // 23 symbols
                this.totalPairs = 23;
                this.gridCols = 8;
                this.gridRows = 6; // 8x6 = 48 cards (23 pairs + 2 extra slots)
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
            const type = this.pojInitials.includes(symbol) ? 'initial' : 'vowel';

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

        document.getElementById('difficulty')?.addEventListener('change', () => {
            this.resetGame();
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
        // Construct path to audio file
        // Note: User needs to provide audio files in 'audio/' directory
        // Format: audio/p.mp3, audio/ph.mp3, etc.

        // Handle special characters for filenames to ensure cross-platform compatibility
        let filename = symbol;
        if (symbol === 'o͘') {
            filename = 'oo';
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
                const time = this.getElapsedTime();
                setTimeout(() => {
                    this.showModal('VICTORY!', `You won in ${time}!`);
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
            cardElement.className = 'card';
            if (card.flipped) {
                cardElement.classList.add('flipped');
            }
            if (card.matched) {
                cardElement.classList.add('matched');
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

    showModal(title, message) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
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

        this.getDifficulty();
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
