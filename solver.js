/**
 * Priority Queue implementation for A* search
 */
class PriorityQueue {
    constructor(compareFunction) {
        this.heap = [];
        this.compare = compareFunction || ((a, b) => a - b);
    }

    enqueue(item) {
        this.heap.push(item);
        this.bubbleUp(this.heap.length - 1);
    }

    dequeue() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();
        
        const result = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown(0);
        return result;
    }

    isEmpty() {
        return this.heap.length === 0;
    }

    size() {
        return this.heap.length;
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.compare(this.heap[index], this.heap[parentIndex]) >= 0) break;
            
            [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
            index = parentIndex;
        }
    }

    bubbleDown(index) {
        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let smallest = index;

            if (leftChild < this.heap.length && 
                this.compare(this.heap[leftChild], this.heap[smallest]) < 0) {
                smallest = leftChild;
            }

            if (rightChild < this.heap.length && 
                this.compare(this.heap[rightChild], this.heap[smallest]) < 0) {
                smallest = rightChild;
            }

            if (smallest === index) break;

            [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
            index = smallest;
        }
    }
}

/**
 * Enhanced Water Sort Puzzle Solver
 * This class provides an intelligent hybrid A* search implementation with pattern recognition
 * and move pruning for solving complex water sort puzzles efficiently.
 */
class WaterSortSolver {
    constructor(tubes) {
        this.tubes = tubes;
        this.solution = [];
        this.isSolving = false;
        this.maxMoves = 1000000; // Prevent infinite loops
        this.statesProcessed = 0; // Track progress for UI feedback
        this.currentDepth = 0; // Track current search depth
        this.bestSolutionFound = null; // Track best solution found so far
        this.status = 'Idle'; // Current solver status
        this.startTime = 0; // Track solving time
        this.timeLimit = 30000; // 30 second time limit for complex puzzles
        this.useAdvancedHeuristics = true; // Enable smart heuristics
        this.puzzleComplexity = this.analyzePuzzleComplexity(); // Analyze puzzle difficulty
    }


    /**
     * Main solve method - returns an array of moves to solve the puzzle
     * Each move is an object: { from: tubeId, to: tubeId }
     * Implements intelligent A* search with pattern recognition and move pruning
     */
    solve() {
        this.isSolving = true;
        this.solution = [];
        this.statesProcessed = 0;
        this.currentDepth = 0;
        this.bestSolutionFound = null;
        this.startTime = Date.now();
        this.status = 'Initializing solver...';
        
        console.log('Solver: Starting enhanced A* search with', this.tubes.length, 'tubes');
        console.log('Puzzle complexity:', this.puzzleComplexity);
        
        // Check if puzzle is already solved
        if (this.isPuzzleSolved()) {
            this.status = 'Puzzle already solved';
            this.isSolving = false;
            return this.solution;
        }
        
        // Choose solving strategy based on puzzle complexity
        let solution = null;
        if (this.puzzleComplexity.tubes <= 8 && this.puzzleComplexity.colors <= 6) {
            solution = this.solveBFS(); // Use BFS for simple puzzles
        } else {
            solution = this.solveAStar(); // Use A* for complex puzzles
        }
        
        if (solution) {
            this.solution = this.optimizeSolution(solution);
            this.bestSolutionFound = this.solution.length;
            this.status = 'Solution found and optimized!';
            console.log(`Solver: Found optimized solution in ${this.solution.length} moves after processing ${this.statesProcessed} states`);
        } else {
            this.status = 'No solution found within time/memory limits';
            console.log(`Solver: No solution found after processing ${this.statesProcessed} states`);
        }
        
        this.isSolving = false;
        return this.solution;
    }

    /**
     * A* search algorithm with intelligent heuristics
     */
    solveAStar() {
        this.status = 'Running A* search...';
        
        // Priority queue for A* (min-heap based on f = g + h)
        const openSet = new PriorityQueue((a, b) => a.f - b.f);
        const closedSet = new Set();
        const gScore = new Map(); // Cost from start to current state
        const fScore = new Map(); // Estimated total cost
        const cameFrom = new Map(); // For path reconstruction
        
        // Initial state
        const initialState = this.tubes.map(tube => tube.clone());
        const initialStateHash = this.getStateHash(initialState);
        
        gScore.set(initialStateHash, 0);
        fScore.set(initialStateHash, this.getHeuristic(initialState));
        
        openSet.enqueue({
            tubes: initialState,
            moves: [],
            hash: initialStateHash,
            g: 0,
            h: this.getHeuristic(initialState),
            f: this.getHeuristic(initialState)
        });
        
        while (!openSet.isEmpty() && this.isSolving) {
            // Check time limit
            if (Date.now() - this.startTime > this.timeLimit) {
                this.status = 'Time limit reached';
                break;
            }
            
            const current = openSet.dequeue();
            this.statesProcessed++;
            this.currentDepth = current.moves.length;
            
            // Update status periodically
            if (this.statesProcessed % 1000 === 0) {
                this.status = `A* searching... (depth ${this.currentDepth}, frontier ${openSet.size()})`;
            }
            
            // Check if we found the solution
            if (this.isPuzzleSolved(current.tubes)) {
                this.status = 'Solution found!';
                return current.moves;
            }
            
            closedSet.add(current.hash);
            
            // Prevent infinite loops
            if (this.statesProcessed > this.maxMoves) {
                this.status = 'Maximum states processed';
                break;
            }
            
            // Get smart moves (pruned and prioritized)
            const possibleMoves = this.getSmartMoves(current.tubes, current.moves);
            
            for (const move of possibleMoves) {
                const newTubes = this.applyMove(move, current.tubes);
                const newStateHash = this.getStateHash(newTubes);
                
                // Skip if already evaluated
                if (closedSet.has(newStateHash)) {
                    continue;
                }
                
                const tentativeG = current.g + 1;
                
                // If this path to neighbor is better than any previous one
                if (!gScore.has(newStateHash) || tentativeG < gScore.get(newStateHash)) {
                    cameFrom.set(newStateHash, { state: current, move: move });
                    gScore.set(newStateHash, tentativeG);
                    const h = this.getHeuristic(newTubes);
                    const f = tentativeG + h;
                    fScore.set(newStateHash, f);
                    
                    openSet.enqueue({
                        tubes: newTubes,
                        moves: [...current.moves, move],
                        hash: newStateHash,
                        g: tentativeG,
                        h: h,
                        f: f
                    });
                }
            }
        }
        
        return null; // No solution found
    }

    /**
     * Fallback BFS for simple puzzles
     */
    solveBFS() {
        this.status = 'Running BFS search...';
        
        const queue = [];
        const visited = new Set();
        
        const initialState = this.tubes.map(tube => tube.clone());
        const initialStateHash = this.getStateHash(initialState);
        
        queue.push({
            tubes: initialState,
            moves: [],
            hash: initialStateHash
        });
        visited.add(initialStateHash);
        
        while (queue.length > 0 && this.isSolving) {
            const current = queue.shift();
            this.statesProcessed++;
            this.currentDepth = current.moves.length;
            
            if (this.statesProcessed % 1000 === 0) {
                this.status = `BFS searching... (depth ${this.currentDepth})`;
            }
            
            if (this.isPuzzleSolved(current.tubes)) {
                this.status = 'Solution found!';
                return current.moves;
            }
            
            if (this.statesProcessed > this.maxMoves) {
                this.status = 'Maximum states processed';
                break;
            }
            
            const possibleMoves = this.getPossibleMoves(current.tubes);
            
            for (const move of possibleMoves) {
                const newTubes = this.applyMove(move, current.tubes);
                const newStateHash = this.getStateHash(newTubes);
                
                if (!visited.has(newStateHash)) {
                    visited.add(newStateHash);
                    queue.push({
                        tubes: newTubes,
                        moves: [...current.moves, move],
                        hash: newStateHash
                    });
                }
            }
        }
        
        return null;
    }

    /**
     * Check if the puzzle is already solved
     */
    isPuzzleSolved(tubes = this.tubes) {
        return tubes.every(tube => tube.isEmpty() || tube.isComplete());
    }

    /**
     * Get all possible valid moves from current state
     */
    getPossibleMoves(tubes = this.tubes) {
        const moves = [];
        
        // Check each tube as a potential source
        for (let fromIndex = 0; fromIndex < tubes.length; fromIndex++) {
            const fromTube = tubes[fromIndex];
            
            // Skip empty tubes (can't pour from them)
            if (fromTube.isEmpty()) {
                continue;
            }
            
            // Check each tube as a potential destination
            for (let toIndex = 0; toIndex < tubes.length; toIndex++) {
                // Don't pour into the same tube
                if (fromIndex === toIndex) {
                    continue;
                }
                
                const toTube = tubes[toIndex];
                
                // Check if pour is valid
                if (fromTube.canPourInto(toTube)) {
                    moves.push({
                        from: fromIndex,
                        to: toIndex
                    });
                }
            }
        }
        
        return moves;
    }

    /**
     * Apply a move to create a new game state
     */
    applyMove(move, tubes) {
        const newTubes = tubes.map(tube => tube.clone());
        const fromTube = newTubes[move.from];
        const toTube = newTubes[move.to];
        
        if (fromTube && toTube && fromTube.canPourInto(toTube)) {
            fromTube.pourInto(toTube);
        }
        
        return newTubes;
    }

    /**
     * Enhanced heuristic function for A* algorithm
     * Estimates the minimum number of moves needed to solve the puzzle
     */
    getHeuristic(tubes) {
        if (!this.useAdvancedHeuristics) {
            return this.getSimpleHeuristic(tubes);
        }
        
        let heuristic = 0;
        const colorGroups = this.getColorGroups(tubes);
        const emptyTubes = tubes.filter(tube => tube.isEmpty()).length;
        
        // Count incomplete tubes (tubes that need work)
        const incompleteTubes = tubes.filter(tube => !tube.isEmpty() && !tube.isComplete()).length;
        
        // Primary heuristic: count water layers not in correct position
        let misplacedLayers = 0;
        for (const tube of tubes) {
            if (!tube.isEmpty() && !tube.isComplete()) {
                const topColor = tube.getTopColor();
                const targetColor = tube.waterLayers[0]; // What this tube should become
                
                for (let i = 0; i < tube.waterLayers.length; i++) {
                    if (tube.waterLayers[i] !== targetColor) {
                        misplacedLayers++;
                    }
                }
            }
        }
        
        // Secondary heuristic: count separated colors
        let separatedColors = 0;
        for (const [color, positions] of Object.entries(colorGroups)) {
            if (positions.length > 1) {
                separatedColors += positions.length - 1;
            }
        }
        
        // Tertiary heuristic: bonus for having empty tubes (helps with sorting)
        const emptyTubeBonus = Math.max(0, 2 - emptyTubes);
        
        // Combine heuristics with weights
        heuristic = misplacedLayers + Math.ceil(separatedColors / 2) + emptyTubeBonus;
        
        // Add complexity factor for tubes with mixed colors
        for (const tube of tubes) {
            if (!tube.isEmpty() && !tube.isComplete()) {
                const uniqueColors = new Set(tube.waterLayers).size;
                if (uniqueColors > 1) {
                    heuristic += uniqueColors - 1;
                }
            }
        }
        
        return Math.max(0, heuristic);
    }

    /**
     * Simple heuristic for basic puzzles
     */
    getSimpleHeuristic(tubes) {
        let heuristic = 0;
        
        for (const tube of tubes) {
            if (!tube.isEmpty() && !tube.isComplete()) {
                heuristic += tube.waterLayers.length;
            }
        }
        
        return Math.ceil(heuristic / 2);
    }

    /**
     * Analyze puzzle complexity to choose optimal solving strategy
     */
    analyzePuzzleComplexity() {
        const colors = new Set();
        let totalWaterLayers = 0;
        let incompleteTubes = 0;
        
        for (const tube of this.tubes) {
            if (!tube.isEmpty()) {
                totalWaterLayers += tube.waterLayers.length;
                if (!tube.isComplete()) {
                    incompleteTubes++;
                }
                for (const color of tube.waterLayers) {
                    colors.add(color);
                }
            }
        }
        
        const complexity = {
            tubes: this.tubes.length,
            colors: colors.size,
            totalLayers: totalWaterLayers,
            incompleteTubes: incompleteTubes,
            difficulty: 'Unknown'
        };
        
        // Determine difficulty level
        if (complexity.tubes <= 6 && complexity.colors <= 4) {
            complexity.difficulty = 'Easy';
        } else if (complexity.tubes <= 10 && complexity.colors <= 8) {
            complexity.difficulty = 'Medium';
        } else if (complexity.tubes <= 12 && complexity.colors <= 10) {
            complexity.difficulty = 'Hard';
        } else {
            complexity.difficulty = 'Expert';
        }
        
        // Adjust time limit based on complexity
        if (complexity.difficulty === 'Easy') {
            this.timeLimit = 5000;
        } else if (complexity.difficulty === 'Medium') {
            this.timeLimit = 15000;
        } else if (complexity.difficulty === 'Hard') {
            this.timeLimit = 30000;
        } else {
            this.timeLimit = 60000; // 1 minute for expert puzzles
        }
        
        return complexity;
    }

    /**
     * Get color groups to understand color distribution
     */
    getColorGroups(tubes) {
        const colorGroups = {};
        
        for (let i = 0; i < tubes.length; i++) {
            const tube = tubes[i];
            if (!tube.isEmpty()) {
                for (const color of tube.waterLayers) {
                    if (!colorGroups[color]) {
                        colorGroups[color] = [];
                    }
                    colorGroups[color].push(i);
                }
            }
        }
        
        return colorGroups;
    }

    /**
     * Generate smart moves with pruning and prioritization
     */
    getSmartMoves(tubes, currentMoves) {
        const allMoves = this.getPossibleMoves(tubes);
        
        // Filter out obviously bad moves
        const filteredMoves = this.pruneMoves(tubes, allMoves, currentMoves);
        
        // Prioritize moves based on heuristics
        const prioritizedMoves = this.prioritizeMoves(tubes, filteredMoves);
        
        return prioritizedMoves;
    }

    /**
     * Prune moves that are unlikely to lead to optimal solutions
     */
    pruneMoves(tubes, moves, currentMoves) {
        const pruned = [];
        
        for (const move of moves) {
            // Skip reverse moves (undoing the last move)
            if (currentMoves.length > 0) {
                const lastMove = currentMoves[currentMoves.length - 1];
                if (move.from === lastMove.to && move.to === lastMove.from) {
                    continue;
                }
            }
            
            const fromTube = tubes[move.from];
            const toTube = tubes[move.to];
            
            // Skip moves that don't improve the state
            if (this.isNonProgressiveMove(fromTube, toTube, tubes)) {
                continue;
            }
            
            // Prioritize moves that complete tubes
            if (this.willCompleteTube(fromTube, toTube)) {
                pruned.unshift(move); // High priority
            } else {
                pruned.push(move);
            }
        }
        
        return pruned;
    }

    /**
     * Check if a move is non-progressive (doesn't improve the state)
     */
    isNonProgressiveMove(fromTube, toTube, tubes) {
        // Don't pour from a tube that's already well-organized to a mixed tube
        if (fromTube.waterLayers.length > 0) {
            const fromTopColor = fromTube.getTopColor();
            const fromUniform = fromTube.waterLayers.every(color => color === fromTopColor);
            
            if (fromUniform && !toTube.isEmpty() && toTube.getTopColor() !== fromTopColor) {
                // Only allow if it helps complete the from tube
                if (fromTube.waterLayers.length > 1) {
                    return true; // Skip this move
                }
            }
        }
        
        return false;
    }

    /**
     * Check if a move will complete a tube
     */
    willCompleteTube(fromTube, toTube) {
        if (toTube.isEmpty()) return false;
        
        const toTopColor = toTube.getTopColor();
        const fromTopColors = fromTube.getTopColors(toTube.capacity - toTube.waterLayers.length);
        
        // Check if this move will make the to tube complete
        if (fromTopColors.length === toTube.capacity - toTube.waterLayers.length) {
            const wouldBeComplete = toTube.waterLayers.every(color => color === toTopColor) &&
                                   fromTopColors.every(color => color === toTopColor);
            return wouldBeComplete && (toTube.waterLayers.length + fromTopColors.length) === toTube.capacity;
        }
        
        return false;
    }

    /**
     * Prioritize moves based on their potential to improve the state
     */
    prioritizeMoves(tubes, moves) {
        const scoredMoves = moves.map(move => {
            const fromTube = tubes[move.from];
            const toTube = tubes[move.to];
            let score = 0;
            
            // High priority: moves that complete tubes
            if (this.willCompleteTube(fromTube, toTube)) {
                score += 100;
            }
            
            // Medium priority: moves to empty tubes (good for reorganization)
            if (toTube.isEmpty()) {
                score += 50;
            }
            
            // Medium priority: moves that group same colors
            if (!toTube.isEmpty() && fromTube.getTopColor() === toTube.getTopColor()) {
                score += 30;
            }
            
            // Low priority: moves that create more uniform tubes
            const fromTopColor = fromTube.getTopColor();
            const fromUniform = fromTube.waterLayers.filter(color => color === fromTopColor).length;
            score += fromUniform * 5;
            
            return { move, score };
        });
        
        // Sort by score (highest first) and return just the moves
        scoredMoves.sort((a, b) => b.score - a.score);
        return scoredMoves.map(item => item.move);
    }

    /**
     * Optimize solution by removing redundant moves
     */
    optimizeSolution(solution) {
        if (!solution || solution.length <= 1) return solution;
        
        // Remove immediate reversals
        const optimized = [];
        for (let i = 0; i < solution.length; i++) {
            const current = solution[i];
            const next = solution[i + 1];
            
            // Skip if next move reverses current move
            if (next && current.from === next.to && current.to === next.from) {
                i++; // Skip the next move too
                continue;
            }
            
            optimized.push(current);
        }
        
        return optimized;
    }

    /**
     * Get a unique state representation for memoization
     * Optimized for performance with string concatenation
     */
    getStateHash(tubes) {
        const hashParts = [];
        for (const tube of tubes) {
            hashParts.push(tube.waterLayers.join(','));
        }
        return hashParts.join('|');
    }

    /**
     * Validate that a puzzle is solvable
     * TODO: Implement solvability check
     */
    isSolvable() {
        // TODO: Check if the puzzle has a valid solution
        // Could check color counts, tube capacity constraints, etc.
        
        return true;
    }

    /**
     * Get puzzle difficulty estimation
     * TODO: Implement difficulty analysis
     */
    getDifficulty() {
        // TODO: Analyze puzzle complexity
        // Could be based on number of colors, tube distribution, etc.
        
        return 'Unknown';
    }

    /**
     * Cancel the solving process
     */
    cancel() {
        this.isSolving = false;
        console.log('Solver: Solving cancelled');
    }

    /**
     * Get solving progress (for UI updates)
     */
    getProgress() {
        let status = this.status;
        let currentDepth = this.currentDepth;
        let bestSolution = this.bestSolutionFound || 0;
        
        // If no solution found yet, show current depth as best estimate
        if (bestSolution === 0 && this.isSolving) {
            bestSolution = this.currentDepth;
        }
        
        return {
            isSolving: this.isSolving,
            status: status,
            currentDepth: currentDepth,
            bestSolution: bestSolution,
            movesFound: this.solution.length,
            maxMoves: this.maxMoves,
            statesProcessed: this.statesProcessed
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WaterSortSolver;
}

// Make available globally in browser environment
if (typeof window !== 'undefined') {
    window.WaterSortSolver = WaterSortSolver;
}
