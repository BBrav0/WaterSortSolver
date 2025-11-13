class WaterSortGame {
    constructor() {
        this.tubes = [];
        this.selectedTube = null;
        this.moves = 0;
        this.gameBoard = document.getElementById('gameBoard');
        this.colorPalette = document.getElementById('colorPalette');
        this.colorItems = document.getElementById('colorItems');
        this.solutionHistory = document.getElementById('solutionHistory');
        this.solutionList = document.getElementById('solutionList');
        this.setupMode = false;
        this.originalTubes = null; // Store original state for reset
        this.fileInput = document.getElementById('fileInput');
        this.solver = null; // WaterSortSolver instance
        this.isAutoSolving = false; // Track if auto-solving is in progress
        this.currentSolution = []; // Track current solution moves
        this.solutionHistoryData = this.loadSolutionHistory(); // Load saved solutions
        this.animationSpeed = 800; // Default animation speed in milliseconds
        this.speedControl = document.getElementById('speedControl');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedValue');
        this.availableColors = [
            { name: 'color1', hex: '#69308e' },
            { name: 'color2', hex: '#b5392d' },
            { name: 'color3', hex: '#db8f51' },
            { name: 'color4', hex: '#d8677b' },
            { name: 'color5', hex: '#eddb6d' },
            { name: 'color6', hex: '#774b1a' },
            { name: 'color7', hex: '#7f9530' },
            { name: 'color8', hex: '#81d486' },
            { name: 'color9', hex: '#392ebb' },
            { name: 'color10', hex: '#2e6337' },
            { name: 'color11', hex: '#636466' },
            { name: 'color12', hex: '#67a1e0' }
        ];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.toggleSetupMode();
        this.updateSolutionHistoryDisplay();
    }

    setupEventListeners() {
        document.getElementById('setupBtn').addEventListener('click', () => this.toggleSetupMode());
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAllTubes());
        document.getElementById('playCustomBtn').addEventListener('click', () => this.playCustomPuzzle());
        document.getElementById('addTubeBtn').addEventListener('click', () => this.addTube());
        document.getElementById('removeTubeBtn').addEventListener('click', () => this.removeTube());
        document.getElementById('saveSetupBtn').addEventListener('click', () => this.saveSetup());
        document.getElementById('loadSetupBtn').addEventListener('click', () => this.loadSetup());
        document.getElementById('resetBoardBtn').addEventListener('click', () => this.resetBoard());
        document.getElementById('autoSolveBtn').addEventListener('click', () => this.autoSolve());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Speed control event listeners
        this.speedSlider.addEventListener('input', (e) => this.updateAnimationSpeed(e));
        this.speedSlider.addEventListener('change', (e) => this.showSpeedNotification(e));
    }


    render() {
        this.gameBoard.innerHTML = '';
        
        // Apply responsive layout for more than 6 tubes
        if (this.tubes.length > 6) {
            this.gameBoard.classList.add('many-tubes');
            this.renderTubeRows();
        } else {
            this.gameBoard.classList.remove('many-tubes');
            this.renderSingleRow();
        }
    }

    renderSingleRow() {
        this.tubes.forEach(tube => {
            const tubeElement = tube.createElement();
            this.setupTubeEventListeners(tubeElement, tube);
            this.gameBoard.appendChild(tubeElement);
        });
    }

    renderTubeRows() {
        const midpoint = Math.ceil(this.tubes.length / 2);
        const topRowTubes = this.tubes.slice(0, midpoint);
        const bottomRowTubes = this.tubes.slice(midpoint);

        // Create top row
        const topRow = document.createElement('div');
        topRow.className = 'tube-row';
        topRowTubes.forEach(tube => {
            const tubeElement = tube.createElement();
            this.setupTubeEventListeners(tubeElement, tube);
            topRow.appendChild(tubeElement);
        });

        // Create bottom row
        const bottomRow = document.createElement('div');
        bottomRow.className = 'tube-row';
        bottomRowTubes.forEach(tube => {
            const tubeElement = tube.createElement();
            this.setupTubeEventListeners(tubeElement, tube);
            bottomRow.appendChild(tubeElement);
        });

        this.gameBoard.appendChild(topRow);
        this.gameBoard.appendChild(bottomRow);
    }

    setupTubeEventListeners(tubeElement, tube) {
        if (this.setupMode) {
            tubeElement.classList.add('setup-mode');
            tubeElement.addEventListener('dragover', (e) => this.handleDragOver(e));
            tubeElement.addEventListener('drop', (e) => this.handleDrop(e, tube));
            tubeElement.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            
            // Add drag start functionality for tubes in setup mode
            tubeElement.addEventListener('dragstart', (e) => this.handleTubeDragStart(e, tube));
            tubeElement.addEventListener('dragend', (e) => this.handleTubeDragEnd(e));
            tubeElement.draggable = true;
            
            // Add click to remove water functionality
            tubeElement.addEventListener('click', (e) => {
                e.preventDefault();
                if (e.shiftKey) {
                    this.removeWaterFromTube(tube);
                } else {
                    // Regular click removes top water layer
                    this.removeTopWaterFromTube(tube);
                }
            });
            
            // Add right-click context menu for tube operations
            tubeElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.showTubeContextMenu(e, tube);
            });
        } else {
            // Disable tube clicks during auto-solving
            if (!this.isAutoSolving) {
                tubeElement.addEventListener('click', () => this.handleTubeClick(tube));
            } else {
                tubeElement.style.cursor = 'not-allowed';
                tubeElement.style.opacity = '0.7';
            }
        }
    }

    handleTubeClick(tube) {
        if (this.isAutoSolving) {
            this.showNotification('Auto-solving in progress. Please wait...');
            return;
        }

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
                    // Record the move for solution documentation
                    this.currentSolution.push({
                        from: this.selectedTube.id,
                        to: tube.id,
                        moveNumber: this.moves + 1
                    });
                    
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
        // Save the solution to history
        this.saveSolutionToHistory();
        
        const message = document.createElement('div');
        message.className = 'win-message';
        message.innerHTML = `
            <h2>🎉 Congratulations! 🎉</h2>
            <p>You solved the puzzle in ${this.moves} moves!</p>
            <button onclick="game.closeWinMessage()">Close</button>
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

    // Solution history methods
    saveSolutionToHistory() {
        const solution = {
            id: Date.now(),
            date: new Date().toISOString(),
            moves: this.moves,
            solution: [...this.currentSolution],
            puzzleState: this.originalTubes ? this.originalTubes.map(tube => tube.clone()) : null,
            solvedAt: new Date().toLocaleString()
        };

        this.solutionHistoryData.push(solution);
        
        // Keep only the last 10 solutions
        if (this.solutionHistoryData.length > 10) {
            this.solutionHistoryData = this.solutionHistoryData.slice(-10);
        }

        // Save to localStorage
        localStorage.setItem('waterSortSolutions', JSON.stringify(this.solutionHistoryData));
        
        // Update the display
        this.updateSolutionHistoryDisplay();
        this.showNotification('Solution saved to history!');
    }

    loadSolutionHistory() {
        try {
            const saved = localStorage.getItem('waterSortSolutions');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading solution history:', error);
            return [];
        }
    }

    updateSolutionHistoryDisplay() {
        if (this.solutionHistoryData.length === 0) {
            this.solutionHistory.style.display = 'none';
            return;
        }

        this.solutionHistory.style.display = 'block';
        this.solutionList.innerHTML = '';

        this.solutionHistoryData.slice().reverse().forEach(solution => {
            const solutionItem = document.createElement('div');
            solutionItem.className = 'solution-item';
            
            const moveDescription = solution.solution.map(move => 
                `Tube ${move.from + 1} → Tube ${move.to + 1}`
            ).join(', ');

            solutionItem.innerHTML = `
                <div class="solution-header">
                    <span>Solution - ${solution.moves} moves</span>
                    <span>${solution.solvedAt}</span>
                </div>
                <div class="solution-details">
                    <strong>Moves:</strong> ${moveDescription}
                </div>
                <div class="solution-actions">
                    <button onclick="game.replaySolution(${solution.id})">Replay</button>
                    <button onclick="game.deleteSolution(${solution.id})">Delete</button>
                </div>
            `;

            this.solutionList.appendChild(solutionItem);
        });
    }

    replaySolution(solutionId) {
        const solution = this.solutionHistoryData.find(s => s.id === solutionId);
        if (!solution) {
            this.showNotification('Solution not found!');
            return;
        }

        if (!solution.puzzleState) {
            this.showNotification('Cannot replay: Original puzzle state not saved!');
            return;
        }

        // Load the original puzzle state
        this.tubes = solution.puzzleState.map(tube => tube.clone());
        this.originalTubes = solution.puzzleState.map(tube => tube.clone());
        this.selectedTube = null;
        this.moves = 0;
        this.currentSolution = [];
        this.setupMode = false;

        // Update UI
        this.render();
        this.updateTubeCount();
        
        // Hide setup mode and show game controls
        const setupBtn = document.getElementById('setupBtn');
        setupBtn.textContent = 'Setup Mode';
        setupBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        this.colorPalette.style.display = 'none';
        document.getElementById('resetBoardBtn').style.display = 'inline-block';
        document.getElementById('autoSolveBtn').style.display = 'inline-block';

        // Animate the solution
        this.animateSolutionReplay(solution.solution);
        this.showNotification('Replaying solution...');
    }

    animateSolutionReplay(solutionMoves) {
        let moveIndex = 0;
        
        const executeNextMove = () => {
            if (moveIndex >= solutionMoves.length) {
                this.showNotification('Solution replay complete!');
                return;
            }

            const move = solutionMoves[moveIndex];
            const fromTube = this.tubes[move.from];
            const toTube = this.tubes[move.to];

            if (fromTube && toTube && fromTube.canPourInto(toTube)) {
                // Highlight the tubes being used
                fromTube.element.classList.add('solver-highlight');
                toTube.element.classList.add('solver-highlight');

                // Execute the move
                fromTube.pourInto(toTube);
                this.moves++;
                this.updateDisplay();

                // Remove highlight after a short delay
                setTimeout(() => {
                    fromTube.element.classList.remove('solver-highlight');
                    toTube.element.classList.remove('solver-highlight');
                }, 300);

                moveIndex++;
                
                // Execute next move after delay using current animation speed
                setTimeout(executeNextMove, this.animationSpeed);
            } else {
                // Invalid move, skip to next
                console.warn('Invalid move in solution replay:', move);
                moveIndex++;
                setTimeout(executeNextMove, 100);
            }
        };

        executeNextMove();
    }

    deleteSolution(solutionId) {
        const index = this.solutionHistoryData.findIndex(s => s.id === solutionId);
        if (index !== -1) {
            this.solutionHistoryData.splice(index, 1);
            localStorage.setItem('waterSortSolutions', JSON.stringify(this.solutionHistoryData));
            this.updateSolutionHistoryDisplay();
            this.showNotification('Solution deleted!');
        }
    }

    toggleSetupMode() {
        this.setupMode = !this.setupMode;
        const setupBtn = document.getElementById('setupBtn');
        
        if (this.setupMode) {
            setupBtn.textContent = 'Exit Setup';
            setupBtn.style.background = 'linear-gradient(135deg, #f06595 0%, #e64980 100%)';
            this.colorPalette.style.display = 'block';
            this.initSetupMode();
            // Hide reset button in setup mode
            document.getElementById('resetBoardBtn').style.display = 'none';
            // Hide auto solve button in setup mode
            document.getElementById('autoSolveBtn').style.display = 'none';
        } else {
            setupBtn.textContent = 'Setup Mode';
            setupBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            this.colorPalette.style.display = 'none';
            // Show auto solve button in play mode if there's water
            const hasWater = this.tubes.some(tube => !tube.isEmpty());
            if (hasWater) {
                document.getElementById('autoSolveBtn').style.display = 'inline-block';
                // Show speed control when auto-solve is available
                this.speedControl.style.display = 'flex';
            }
        }
        
        this.render();
    }

    initSetupMode() {
        this.colorItems.innerHTML = '';
        
        this.availableColors.forEach((color, index) => {
            const colorItem = document.createElement('div');
            colorItem.className = 'color-item';
            colorItem.style.background = `linear-gradient(to bottom, ${color.hex}, ${color.hex})`;
            colorItem.draggable = true;
            colorItem.dataset.color = color.name;
            
            colorItem.addEventListener('dragstart', (e) => this.handleDragStart(e));
            colorItem.addEventListener('dragend', (e) => this.handleDragEnd(e));
            
            this.colorItems.appendChild(colorItem);
        });
        
        // Create empty tubes for setup
        this.tubes = [];
        for (let i = 0; i < 8; i++) {
            this.tubes.push(new Tube(i));
        }
        
        this.updateTubeCount();
    }

    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('color', e.target.dataset.color);
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        e.currentTarget.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e, targetTube) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        
        // Check if dropping from color palette
        const color = e.dataTransfer.getData('color');
        if (color) {
            if (targetTube.addWater(color)) {
                targetTube.updateElement();
            }
            return;
        }
        
        // Check if dropping from another tube
        const tubeSourceId = e.dataTransfer.getData('tubeSource');
        const waterColor = e.dataTransfer.getData('waterColor');
        
        if (tubeSourceId && waterColor) {
            const sourceTube = this.tubes[parseInt(tubeSourceId)];
            if (sourceTube && sourceTube.id !== targetTube.id) {
                // Move water from source tube to target tube
                if (sourceTube.getTopColor() === waterColor && targetTube.addWater(waterColor)) {
                    sourceTube.removeWater();
                    sourceTube.updateElement();
                    targetTube.updateElement();
                    this.showNotification(`Moved ${waterColor} from tube ${sourceTube.id + 1} to tube ${targetTube.id + 1}`);
                }
            }
        }
    }

    removeWaterFromTube(tube) {
        if (!tube.isEmpty()) {
            tube.removeWater();
            tube.updateElement();
        }
    }

    // Enhanced setup mode functionality
    handleTubeDragStart(e, tube) {
        if (!this.setupMode || tube.isEmpty()) {
            e.preventDefault();
            return;
        }
        
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('tubeSource', tube.id.toString());
        e.dataTransfer.setData('waterColor', tube.getTopColor());
    }

    handleTubeDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    removeTopWaterFromTube(tube) {
        if (!tube.isEmpty()) {
            const removedColor = tube.getTopColor();
            tube.removeWater();
            tube.updateElement();
            this.showNotification(`Removed ${removedColor} from tube ${tube.id + 1}`);
        }
    }

    showTubeContextMenu(e, tube) {
        // Remove any existing context menu
        const existingMenu = document.querySelector('.tube-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const contextMenu = document.createElement('div');
        contextMenu.className = 'tube-context-menu';
        contextMenu.style.cssText = `
            position: fixed;
            left: ${e.clientX}px;
            top: ${e.clientY}px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            z-index: 1000;
            min-width: 150px;
        `;

        const menuItems = [];

        if (!tube.isEmpty()) {
            menuItems.push({
                text: 'Remove Top Water',
                action: () => this.removeTopWaterFromTube(tube)
            });
            
            menuItems.push({
                text: 'Empty Tube',
                action: () => {
                    tube.waterLayers = [];
                    tube.updateElement();
                    this.showNotification(`Emptied tube ${tube.id + 1}`);
                }
            });
        }

        if (tube.waterLayers.length > 1) {
            menuItems.push({
                text: 'Remove Bottom Water',
                action: () => {
                    tube.waterLayers.shift();
                    tube.updateElement();
                    this.showNotification(`Removed bottom water from tube ${tube.id + 1}`);
                }
            });
        }

        menuItems.push({
            text: 'Duplicate Tube',
            action: () => this.duplicateTube(tube)
        });

        // Create menu items
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.text;
            menuItem.style.cssText = `
                padding: 8px 12px;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s ease;
            `;
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.background = 'rgba(255, 255, 255, 0.1)';
            });
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.background = 'transparent';
            });
            menuItem.addEventListener('click', () => {
                item.action();
                contextMenu.remove();
            });
            contextMenu.appendChild(menuItem);
        });

        document.body.appendChild(contextMenu);

        // Close menu when clicking elsewhere
        const closeMenu = (event) => {
            if (!contextMenu.contains(event.target)) {
                contextMenu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 100);
    }

    duplicateTube(sourceTube) {
        if (this.tubes.length >= 14) {
            this.showNotification('Maximum 14 tubes allowed!');
            return;
        }

        const newTube = new Tube(this.tubes.length);
        newTube.waterLayers = [...sourceTube.waterLayers];
        this.tubes.push(newTube);
        this.render();
        this.updateTubeCount();
        this.showNotification(`Duplicated tube ${sourceTube.id + 1} as tube ${newTube.id + 1}`);
    }

    clearAllTubes() {
        this.tubes.forEach(tube => {
            tube.waterLayers = [];
            tube.updateElement();
        });
    }

    playCustomPuzzle() {
        // Check if puzzle is valid (at least some tubes have water)
        const hasWater = this.tubes.some(tube => !tube.isEmpty());
        if (!hasWater) {
            this.showNotification('Please add some water to the tubes first!');
            return;
        }
        
        // Store original state for reset
        this.originalTubes = this.tubes.map(tube => tube.clone());
        
        // Reset solution tracking
        this.currentSolution = [];
        
        this.setupMode = false;
        const setupBtn = document.getElementById('setupBtn');
        setupBtn.textContent = 'Setup Mode';
        setupBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        this.colorPalette.style.display = 'none';
        
        // Show reset button in play mode
        document.getElementById('resetBoardBtn').style.display = 'inline-block';
        // Show auto solve button in play mode
        document.getElementById('autoSolveBtn').style.display = 'inline-block';
        // Show speed control when auto-solve is available
        this.speedControl.style.display = 'flex';
        
        this.selectedTube = null;
        this.moves = 0;
        this.render();
        
        this.showNotification('Custom puzzle ready! Start playing!');
    }

    showNotification(message) {
        // Get existing notifications to calculate position
        const existingNotifications = document.querySelectorAll('.notification');
        const verticalOffset = 20 + (existingNotifications.length * 70);
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: ${verticalOffset}px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        // Add styles if not already present
        if (!document.getElementById('notificationStyles')) {
            const style = document.createElement('style');
            style.id = 'notificationStyles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes slideOutRight {
                    from {
                        opacity: 1;
                        transform: translateX(0);
                    }
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
                .notification {
                    animation: slideInRight 0.3s ease;
                }
                .notification.removing {
                    animation: slideOutRight 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('removing');
            setTimeout(() => {
                notification.remove();
                // Reposition remaining notifications
                this.repositionNotifications();
            }, 300);
        }, 3000);
    }

    repositionNotifications() {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach((notification, index) => {
            const verticalOffset = 20 + (index * 70);
            notification.style.top = `${verticalOffset}px`;
        });
    }

    showSolverStatus() {
        // Create solver status display
        const statusDiv = document.createElement('div');
        statusDiv.id = 'solverStatus';
        statusDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            z-index: 1001;
            min-width: 300px;
            animation: slideIn 0.3s ease;
        `;
        
        statusDiv.innerHTML = `
            <h3>Solving Puzzle...</h3>
            <div class="solver-spinner"></div>
            <p id="solverStatusText">Initializing solver...</p>
            <div id="solverProgress">
                <div>States processed: <span id="statesProcessed">0</span></div>
                <div>Current depth: <span id="currentDepth">0</span></div>
                <div>Best solution: <span id="bestSolution">None</span></div>
            </div>
        `;
        
        // Add spinner styles
        if (!document.getElementById('solverStatusStyles')) {
            const style = document.createElement('style');
            style.id = 'solverStatusStyles';
            style.textContent = `
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
                .solver-spinner {
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-top: 4px solid white;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite;
                    margin: 20px auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                #solverProgress {
                    margin-top: 15px;
                    font-size: 0.9em;
                    line-height: 1.6;
                }
                #solverProgress div {
                    margin: 5px 0;
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(statusDiv);
        
        // Start updating solver status
        this.solverStatusInterval = setInterval(() => {
            this.updateSolverStatus();
        }, 100);
    }

    updateSolverStatus() {
        if (!this.solver || !this.isAutoSolving) {
            this.hideSolverStatus();
            return;
        }
        
        const progress = this.solver.getProgress();
        const statusText = document.getElementById('solverStatusText');
        const statesProcessed = document.getElementById('statesProcessed');
        const currentDepth = document.getElementById('currentDepth');
        const bestSolution = document.getElementById('bestSolution');
        
        if (statusText) {
            statusText.textContent = progress.status || 'Searching...';
        }
        if (statesProcessed) {
            statesProcessed.textContent = progress.statesProcessed.toLocaleString();
        }
        if (currentDepth) {
            currentDepth.textContent = progress.currentDepth || 0;
        }
        if (bestSolution) {
            bestSolution.textContent = progress.bestSolution ? `${progress.bestSolution} moves` : 'None';
        }
    }

    hideSolverStatus() {
        const statusDiv = document.getElementById('solverStatus');
        if (statusDiv) {
            statusDiv.remove();
        }
        if (this.solverStatusInterval) {
            clearInterval(this.solverStatusInterval);
            this.solverStatusInterval = null;
        }
    }

    addTube() {
        if (this.tubes.length >= 14) {
            this.showNotification('Maximum 14 tubes allowed!');
            return;
        }
        
        const newTube = new Tube(this.tubes.length);
        this.tubes.push(newTube);
        this.render();
        this.updateTubeCount();
        this.showNotification('Tube added!');
    }

    removeTube() {
        if (this.tubes.length <= 2) {
            this.showNotification('Minimum 2 tubes required!');
            return;
        }
        
        // Remove the last tube
        const removedTube = this.tubes.pop();
        this.render();
        this.updateTubeCount();
        this.showNotification('Tube removed!');
    }

    updateTubeCount() {
        const tubeCountElement = document.getElementById('tubeCount');
        if (tubeCountElement) {
            tubeCountElement.textContent = this.tubes.length;
        }
        
        // Update button states
        const addBtn = document.getElementById('addTubeBtn');
        const removeBtn = document.getElementById('removeTubeBtn');
        
        if (addBtn) {
            addBtn.disabled = this.tubes.length >= 14;
        }
        
        if (removeBtn) {
            removeBtn.disabled = this.tubes.length <= 2;
        }
    }

    saveSetup() {
        const puzzleData = {
            name: `Puzzle ${new Date().toISOString().split('T')[0]}`,
            description: 'Custom water sort puzzle',
            tubes: this.tubes.map(tube => ({
                id: tube.id,
                waterLayers: [...tube.waterLayers]
            })),
            created: new Date().toISOString().split('T')[0],
            difficulty: 'Custom'
        };

        const dataStr = JSON.stringify(puzzleData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `water-sort-puzzle-${Date.now()}.json`;
        link.click();
        
        this.showNotification('Puzzle saved!');
    }

    loadSetup() {
        this.fileInput.click();
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const puzzleData = JSON.parse(e.target.result);
                this.loadPuzzleData(puzzleData);
            } catch (error) {
                this.showNotification('Error loading puzzle file!');
            }
        };
        reader.readAsText(file);
        
        // Reset file input
        event.target.value = '';
    }

    loadPuzzleData(puzzleData) {
        if (!puzzleData.tubes || !Array.isArray(puzzleData.tubes)) {
            this.showNotification('Invalid puzzle file!');
            return;
        }

        // Clear existing tubes
        this.tubes = [];
        
        // Create tubes from loaded data
        puzzleData.tubes.forEach(tubeData => {
            const tube = new Tube(tubeData.id);
            tube.waterLayers = [...tubeData.waterLayers];
            this.tubes.push(tube);
        });

        // Reset game state
        this.selectedTube = null;
        this.moves = 0;
        this.currentSolution = [];
        this.isAutoSolving = false;
        this.solver = null;

        this.render();
        this.updateTubeCount();
        this.showNotification(`Loaded: ${puzzleData.name || 'Custom Puzzle'}`);
        
        // Ensure auto-solve button is visible if puzzle has water
        const hasWater = this.tubes.some(tube => !tube.isEmpty());
        if (hasWater && !this.setupMode) {
            document.getElementById('autoSolveBtn').style.display = 'inline-block';
            // Show speed control when auto-solve is available
            this.speedControl.style.display = 'flex';
        }
    }

    resetBoard() {
        if (!this.originalTubes) {
            this.showNotification('No original state to reset to!');
            return;
        }

        this.tubes = this.originalTubes.map(tube => tube.clone());
        this.selectedTube = null;
        this.moves = 0;
        this.currentSolution = [];
        this.render();
        
        this.showNotification('Board reset to original state!');
    }

    // Auto-solve functionality
    autoSolve() {
        if (this.isAutoSolving) {
            this.showNotification('Already solving...');
            return;
        }

        // Check if puzzle is already solved
        if (this.checkWin()) {
            this.showNotification('Puzzle is already solved!');
            return;
        }

        this.isAutoSolving = true;
        this.showNotification('Starting auto-solve...');

        // Create solver instance with current tubes
        this.solver = new WaterSortSolver(this.tubes.map(tube => tube.clone()));

        // Show live solver status
        this.showSolverStatus();

        // Disable controls during solving
        this.disableControls();

        // Start solving in a separate timeout to allow UI to update
        setTimeout(() => {
            this.executeSolver();
        }, 100);
    }

    executeSolver() {
        try {
            // Get solution from solver
            const solution = this.solver.solve();
            
            // Hide solver status
            this.hideSolverStatus();
            
            if (solution && solution.length > 0) {
                this.showNotification(`Found solution with ${solution.length} moves!`);
                this.animateSolution(solution);
            } else {
                // Check if the solver hit the maximum moves limit
                const progress = this.solver.getProgress();
                if (progress.statesProcessed >= progress.maxMoves) {
                    this.showNotification('Puzzle is too complex for current solver limits. Try a simpler puzzle or increase the search limit.');
                } else {
                    this.showNotification('No solution found. This puzzle may be unsolvable.');
                }
                this.enableControls();
                this.isAutoSolving = false;
            }
        } catch (error) {
            console.error('Solver error:', error);
            this.hideSolverStatus();
            this.showNotification('Error occurred while solving puzzle.');
            this.enableControls();
            this.isAutoSolving = false;
        }
    }

    animateSolution(solution) {
        let moveIndex = 0;
        
        // Clear current solution and track auto-solve moves
        this.currentSolution = [];
        
        const executeNextMove = () => {
            if (moveIndex >= solution.length || !this.isAutoSolving) {
                // Solution complete or cancelled
                this.isAutoSolving = false;
                this.hideSolverStatus(); // Hide solver status when animation completes
                this.enableControls();
                this.render(); // Re-render to reset tube styles
                
                if (this.checkWin()) {
                    this.showNotification('Puzzle solved automatically!');
                    setTimeout(() => this.handleWin(), 500);
                } else {
                    this.showNotification('Auto-solve completed.');
                }
                return;
            }

            const move = solution[moveIndex];
            const fromTube = this.tubes[move.from];
            const toTube = this.tubes[move.to];

            if (fromTube && toTube && fromTube.canPourInto(toTube)) {
                // Highlight the tubes being used
                fromTube.element.classList.add('solver-highlight');
                toTube.element.classList.add('solver-highlight');

                // Execute the move
                fromTube.pourInto(toTube);
                
                // Record the move for solution documentation
                this.currentSolution.push({
                    from: move.from,
                    to: move.to,
                    moveNumber: this.moves + 1
                });
                
                this.moves++;
                this.updateDisplay();

                // Remove highlight after a short delay
                setTimeout(() => {
                    fromTube.element.classList.remove('solver-highlight');
                    toTube.element.classList.remove('solver-highlight');
                }, 300);

                moveIndex++;
                
                // Execute next move after delay using current animation speed
                setTimeout(executeNextMove, this.animationSpeed);
            } else {
                // Invalid move, skip to next
                console.warn('Invalid move in solution:', move);
                moveIndex++;
                setTimeout(executeNextMove, 100);
            }
        };

        executeNextMove();
    }

    disableControls() {
        // Disable all control buttons during auto-solving
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.id !== 'autoSolveBtn') {
                btn.disabled = true;
            }
        });

        // Update auto-solve button to show cancel option
        const autoSolveBtn = document.getElementById('autoSolveBtn');
        if (autoSolveBtn) {
            autoSolveBtn.textContent = 'Cancel';
            autoSolveBtn.style.background = 'linear-gradient(135deg, #f06595 0%, #e64980 100%)';
        }
    }

    enableControls() {
        // Re-enable all control buttons
        const buttons = document.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = false;
        });

        // Reset auto-solve button
        const autoSolveBtn = document.getElementById('autoSolveBtn');
        if (autoSolveBtn) {
            autoSolveBtn.textContent = 'Auto Solve';
            autoSolveBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
    }

    closeWinMessage() {
        // Find and remove the win message
        const winMessage = document.querySelector('.win-message');
        if (winMessage) {
            winMessage.remove();
        }
    }

    startNewGame() {
        this.tubes = [];
        this.selectedTube = null;
        this.moves = 0;
        this.isAutoSolving = false;
        this.solver = null;
        this.toggleSetupMode();
    }

    // Speed control methods
    updateAnimationSpeed(event) {
        this.animationSpeed = parseInt(event.target.value);
        this.speedValue.textContent = `${this.animationSpeed}ms`;
    }

    showSpeedNotification(event) {
        const speed = parseInt(event.target.value);
        let speedDescription = '';
        
        if (speed <= 300) {
            speedDescription = 'Very Fast';
        } else if (speed <= 600) {
            speedDescription = 'Fast';
        } else if (speed <= 1000) {
            speedDescription = 'Normal';
        } else if (speed <= 2000) {
            speedDescription = 'Slow';
        } else if (speed <= 3000) {
            speedDescription = 'Very Slow';
        } else {
            speedDescription = 'Extremely Slow';
        }
        
        this.showNotification(`Animation speed set to ${speedDescription} (${speed}ms)`);
    }
}

// Initialize game when page loads
let game;
document.addEventListener('DOMContentLoaded', () => {
    game = new WaterSortGame();
    
    // Auto-load demo puzzle for testing
    setTimeout(() => {
        loadDemoPuzzle();
    }, 500);
});

// Function to load demo puzzle
function loadDemoPuzzle() {
    fetch('medium-puzzle.json')
        .then(response => response.json())
        .then(puzzleData => {
            game.loadPuzzleData(puzzleData);
            game.playCustomPuzzle();
        })
        .catch(error => {
            console.log('Medium puzzle not found, trying demo puzzle...');
            // Fallback to demo puzzle
            fetch('demo-puzzle.json')
                .then(response => response.json())
                .then(puzzleData => {
                    game.loadPuzzleData(puzzleData);
                    game.playCustomPuzzle();
                })
                .catch(error2 => {
                    console.log('No puzzle files found, starting with empty setup');
                });
        });
}
