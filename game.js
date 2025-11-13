class WaterSortGame {
    constructor() {
        this.tubes = [];
        this.selectedTube = null;
        this.moves = 0;
        this.gameBoard = document.getElementById('gameBoard');
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startNewGame();
    }

    setupEventListeners() {
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame());
    }

    startNewGame() {
        this.tubes = [];
        this.selectedTube = null;
        this.moves = 0;
        this.generateLevel();
        this.render();
    }

    resetGame() {
        this.selectedTube = null;
        this.moves = 0;
        this.tubes.forEach(tube => tube.updateElement());
        this.clearSelection();
    }

    generateLevel() {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
        const tubesCount = 6;
        const emptyTubes = 2;
        const totalTubes = tubesCount + emptyTubes;
        
        // Create water layers
        const waterLayers = [];
        colors.forEach(color => {
            for (let i = 0; i < 4; i++) {
                waterLayers.push(color);
            }
        });
        
        // Shuffle water layers
        for (let i = waterLayers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [waterLayers[i], waterLayers[j]] = [waterLayers[j], waterLayers[i]];
        }
        
        // Create tubes and distribute water
        for (let i = 0; i < totalTubes; i++) {
            const tube = new Tube(i);
            this.tubes.push(tube);
        }
        
        // Add water to first tubes
        let waterIndex = 0;
        for (let i = 0; i < tubesCount && waterIndex < waterLayers.length; i++) {
            const layersPerTube = Math.min(4, waterLayers.length - waterIndex);
            for (let j = 0; j < layersPerTube; j++) {
                this.tubes[i].addWater(waterLayers[waterIndex++]);
            }
        }
    }

    render() {
        this.gameBoard.innerHTML = '';
        
        this.tubes.forEach(tube => {
            const tubeElement = tube.createElement();
            tubeElement.addEventListener('click', () => this.handleTubeClick(tube));
            this.gameBoard.appendChild(tubeElement);
        });
    }

    handleTubeClick(tube) {
        if (this.selectedTube === null) {
            // Select tube if it's not empty
            if (!tube.isEmpty()) {
                this.selectedTube = tube;
                tube.element.classList.add('selected');
            }
        } else {
            // Try to pour water into clicked tube
            if (this.selectedTube === tube) {
                // Deselect if clicking the same tube
                this.clearSelection();
            } else {
                // Try to pour water
                const success = this.selectedTube.pourInto(tube);
                if (success) {
                    this.moves++;
                    this.updateDisplay();
                    
                    // Check win condition
                    if (this.checkWin()) {
                        setTimeout(() => this.handleWin(), 500);
                    }
                }
                
                this.clearSelection();
            }
        }
    }

    clearSelection() {
        if (this.selectedTube) {
            this.selectedTube.element.classList.remove('selected');
            this.selectedTube = null;
        }
    }

    updateDisplay() {
        this.tubes.forEach(tube => tube.updateElement());
    }

    checkWin() {
        return this.tubes.every(tube => tube.isEmpty() || tube.isComplete());
    }

    handleWin() {
        const message = document.createElement('div');
        message.className = 'win-message';
        message.innerHTML = `
            <h2>🎉 Congratulations! 🎉</h2>
            <p>You solved the puzzle in ${this.moves} moves!</p>
            <button onclick="game.startNewGame()">Play Again</button>
        `;
        
        // Add win message styles if not already present
        if (!document.getElementById('winStyles')) {
            const style = document.createElement('style');
            style.id = 'winStyles';
            style.textContent = `
                .win-message {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px;
                    border-radius: 20px;
                    text-align: center;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    z-index: 1000;
                    animation: slideIn 0.5s ease;
                }
                
                .win-message h2 {
                    margin-bottom: 20px;
                    font-size: 2em;
                }
                
                .win-message p {
                    margin-bottom: 30px;
                    font-size: 1.2em;
                }
                
                .win-message button {
                    background: white;
                    color: #667eea;
                    padding: 15px 30px;
                    font-size: 18px;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .win-message button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
                }
                
                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translate(-50%, -60%);
                    }
                    to {
                        opacity: 1;
                        transform: translate(-50%, -50%);
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(message);
        
        // Remove message after clicking play again or after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new WaterSortGame();
});
