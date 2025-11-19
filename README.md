# Water Sort Solver

A web-based Water Sort puzzle game with an intelligent A* algorithm solver. Create custom puzzles, solve them manually, or let the AI find the optimal solution automatically.

## Overview

Water Sort Solver is an interactive puzzle game where you sort colored water in tubes. The goal is to organize all water layers so that each tube contains only one color. This implementation features a solver that uses A* search algorithm with intelligent heuristics to find optimal solutions.

## Features

### Game Features
- Interactive gameplay: Click tubes to pour water and solve puzzles manually
- Setup mode: Create custom puzzles with drag-and-drop interface
- Puzzle management: Save and load puzzles in JSON format
- Solution history: Automatically saves solutions with replay functionality
- Responsive layout: Adapts to different screen sizes and tube counts
- Speed control: Adjustable animation speed for auto-solve visualization

### Solver Features
- A* algorithm: Uses heuristic-guided search for optimal solutions
- Adaptive strategy: Automatically chooses BFS for simple puzzles, A* for complex ones
- Smart move pruning: Eliminates redundant and non-progressive moves
- Pattern recognition: Prioritizes moves that complete tubes and group colors
- Real-time progress: Live status updates during solving process
- Solution optimization: Automatically removes redundant moves from solutions

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional dependencies or build tools required

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/WaterSortSolver.git
   cd WaterSortSolver
   ```

2. Open in browser
   - Simply open `index.html` in your web browser
   - Or use a local web server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (http-server)
     npx http-server
     
     # Using PHP
     php -S localhost:8000
     ```

3. Start playing
   - The game will automatically load a demo puzzle
   - Click "Setup Mode" to create your own puzzle
   - Click "Auto Solve" to let the AI solve it for you

## How to Play

### Manual Play
1. Click on a tube to select it (it will be highlighted)
2. Click on another tube to pour water from the selected tube
3. You can only pour water if:
   - The destination tube is empty, OR
   - The top color matches the destination tube's top color
4. Goal: Sort all water so each tube contains only one color (or is empty)

### Setup Mode
1. Click "Setup Mode" to enter puzzle creation
2. Add Water: Drag colors from the palette to tubes
3. Move Water: Drag water layers between tubes
4. Remove Water: 
   - Click a tube to remove the top layer
   - Shift+Click to empty a tube completely
   - Right-click for more options
5. Manage Tubes: Add or remove tubes (2-14 tubes allowed)
6. Click "Play Custom" to start solving your puzzle

### Auto Solve
1. Set up or load a puzzle
2. Click "Auto Solve" button
3. Watch the solver find and execute the optimal solution
4. Adjust animation speed with the slider (100ms - 4000ms)

## Project Structure

```
WaterSortSolver/
├── index.html              # Main HTML structure
├── style.css              # Styling and responsive layout
├── game.js                # Game logic and UI management
├── solver.js              # A* search algorithm implementation
├── Tube.js                # Tube class and game mechanics
├── README.md              # This file
│
├── Puzzle Files/
│   ├── demo-puzzle.json
│   ├── basic.json
│   ├── simple-puzzle.json
│   ├── medium-puzzle.json
│   └── first real puzzle.json
│
└── Documentation/
    ├── SOLVER_ENHANCEMENT_SUMMARY.md
    ├── RESPONSIVE_LAYOUT_IMPLEMENTATION.md
    └── SPEED_CONTROL_IMPLEMENTATION.md
```

## Technical Details

### Algorithm
The solver uses a hybrid approach:
- BFS (Breadth-First Search): For simple puzzles (≤8 tubes, ≤6 colors)
- A* Search: For complex puzzles with intelligent heuristics

### Heuristics
The A* algorithm uses multiple heuristics:
- Misplaced Layers: Counts water layers not in correct position
- Color Separation: Analyzes how colors are distributed
- Empty Tube Utilization: Bonuses for strategic empty tube usage
- Mixed Color Penalties: Penalizes tubes with multiple colors

### Move Pruning
The solver intelligently prunes moves:
- Eliminates reverse moves (undoing the last move)
- Filters non-progressive moves
- Prioritizes moves that complete tubes
- Scores moves based on potential state improvement

## Creating Custom Puzzles

### Using Setup Mode
1. Enter Setup Mode
2. Drag colors to create your puzzle
3. Click "Save Setup" to download as JSON

### Manual JSON Creation
```json
{
  "name": "My Custom Puzzle",
  "description": "A challenging puzzle",
  "tubes": [
    {
      "id": 0,
      "waterLayers": ["color1", "color2", "color3", "color4"]
    },
    {
      "id": 1,
      "waterLayers": ["color4", "color3", "color2", "color1"]
    },
    {
      "id": 2,
      "waterLayers": []
    }
  ],
  "created": "2025-01-15",
  "difficulty": "Hard"
}
```

### Loading Puzzles
- Click "Load Setup" in Setup Mode
- Select your JSON file
- Click "Play Custom" to start

### Available Colors
The game supports 12 predefined colors (color1 through color12), each with a unique hex value defined in `game.js`.

## Solution History

The game automatically saves your solutions to browser localStorage:
- Last 10 solutions are saved
- Each solution includes move sequence, total moves, timestamp, and original puzzle state
- Solutions can be replayed or deleted from the history panel

## Known Limitations

- Maximum 14 tubes per puzzle
- Maximum 12 colors
- Solver has time limits for very complex puzzles (prevents browser freezing)
- Some extremely complex puzzles may not find a solution within time limits

## License

This project is open source and available under the MIT License.

## Acknowledgments

Inspired by the popular Water Sort mobile game. Built with vanilla JavaScript using A* search algorithm with custom heuristics.
