class Game {
  constructor() {
      this.grid = Array(4).fill().map(() => Array(4).fill(null));
      this.tiles = [];
      this.score = 0;
      this.bestScore = localStorage.getItem('bestScore') ? parseInt(localStorage.getItem('bestScore')) : 0;
      this.nextId = 0;

      // Preload sound effects
      this.moveSound = new Audio('sounds/move.wav');
      this.mergeSound = new Audio('sounds/merge.wav');
      this.gameoverSound = new Audio('sounds/gameover.wav');

      // Add initial tiles
      this.addRandomTile();
      this.addRandomTile();
      this.render();
      this.setupEventListeners();
  }

  addRandomTile() {
      const emptyCells = [];
      for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
              if (this.grid[row][col] === null) {
                  emptyCells.push({ row, col });
              }
          }
      }
      if (emptyCells.length > 0) {
          const { row, col } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
          const value = Math.random() < 0.9 ? 2 : 4;
          const tile = { id: this.nextId++, value, row, col, isNew: true };
          this.grid[row][col] = tile;
          this.tiles.push(tile);
      }
  }

  render() {
      const gridContainer = document.querySelector('.grid-container');
      gridContainer.innerHTML = ''; // Clear existing tiles
      this.tiles.forEach(tile => {
          const tileDiv = document.createElement('div');
          let classes = `tile tile-${tile.value} tile-position-${tile.row}-${tile.col}`;
          if (tile.isNew) {
              classes += ' tile-new';
              tile.isNew = false;
          }
          if (tile.isMerged) {
              classes += ' tile-merged';
              tile.isMerged = false;
          }
          tileDiv.className = classes;
          tileDiv.textContent = tile.value;
          gridContainer.appendChild(tileDiv);
      });
      document.querySelector('.score').textContent = `Score: ${this.score}`;
      document.querySelector('.best-score').textContent = `Best: ${this.bestScore}`;
  }

  move(direction) {
      let moved = false;
      const newGrid = this.grid.map(row => [...row]);

      if (direction === 'up' || direction === 'down') {
          for (let col = 0; col < 4; col++) {
              let column = [];
              for (let row = 0; row < 4; row++) {
                  if (newGrid[row][col]) {
                      column.push(newGrid[row][col]);
                      newGrid[row][col] = null;
                  }
              }
              const merged = this.mergeTiles(column);
              const targetRow = direction === 'up' ? 0 : 3;
              merged.forEach((tile, idx) => {
                  const newRow = direction === 'up' ? idx : 3 - idx;
                  tile.row = newRow;
                  newGrid[newRow][col] = tile;
              });
              if (column.length !== merged.length || column.some((tile, i) => tile.row !== merged[i]?.row)) {
                  moved = true;
              }
          }
      } else if (direction === 'left' || direction === 'right') {
          for (let row = 0; row < 4; row++) {
              let rowTiles = [];
              for (let col = 0; col < 4; col++) {
                  if (newGrid[row][col]) {
                      rowTiles.push(newGrid[row][col]);
                      newGrid[row][col] = null;
                  }
              }
              const merged = this.mergeTiles(rowTiles);
              const targetCol = direction === 'left' ? 0 : 3;
              merged.forEach((tile, idx) => {
                  const newCol = direction === 'left' ? idx : 3 - idx;
                  tile.col = newCol;
                  newGrid[row][newCol] = tile;
              });
              if (rowTiles.length !== merged.length || rowTiles.some((tile, i) => tile.col !== merged[i]?.col)) {
                  moved = true;
              }
          }
      }

      if (moved) {
          this.grid = newGrid;
          this.tiles = this.grid.flat().filter(tile => tile !== null);
          this.moveSound.play(); // Play move sound
          this.addRandomTile();
          this.render();

          // Check for game over
          if (this.isGameOver()) {
              this.gameoverSound.play(); // Play game over sound
              alert("Game Over!");
          }
      }
  }

  mergeTiles(tiles) {
      const result = [];
      for (let i = 0; i < tiles.length; i++) {
          if (i + 1 < tiles.length && tiles[i].value === tiles[i + 1].value) {
              const mergedValue = tiles[i].value * 2;
              this.score += mergedValue;
              if (this.score > this.bestScore) {
                  this.bestScore = this.score;
                  localStorage.setItem('bestScore', this.bestScore);
              }
              result.push({ ...tiles[i], value: mergedValue, isMerged: true });
              this.mergeSound.play(); // Play merge sound
              i++; // Skip the next tile since it’s merged
          } else {
              result.push({ ...tiles[i] });
          }
      }
      return result;
  }

  isGameOver() {
      // Check if the grid is full and no merges are possible
      for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
              if (!this.grid[row][col]) return false; // Empty cell exists
              if (col < 3 && this.grid[row][col].value === this.grid[row][col + 1].value) return false; // Horizontal merge possible
              if (row < 3 && this.grid[row][col].value === this.grid[row + 1][col].value) return false; // Vertical merge possible
          }
      }
      return true; // No moves left
  }

  setupEventListeners() {
      // Keyboard inputs
      document.addEventListener('keydown', (e) => {
          switch (e.key) {
              case 'ArrowUp': this.move('up'); break;
              case 'ArrowDown': this.move('down'); break;
              case 'ArrowLeft': this.move('left'); break;
              case 'ArrowRight': this.move('right'); break;
          }
      });

      // Touch inputs for mobile
      let startX, startY;
      document.addEventListener('touchstart', e => {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
      });
      document.addEventListener('touchend', e => {
          let endX = e.changedTouches[0].clientX;
          let endY = e.changedTouches[0].clientY;
          let dx = endX - startX;
          let dy = endY - startY;
          let minSwipeDistance = 30; // Minimum distance in pixels to register a swipe
          if (Math.abs(dx) > Math.abs(dy)) {
              if (Math.abs(dx) > minSwipeDistance) {
                  if (dx > 0) this.move('right'); // Swipe right
                  else this.move('left'); // Swipe left
              }
          } else {
              if (Math.abs(dy) > minSwipeDistance) {
                  if (dy > 0) this.move('down'); // Swipe down
                  else this.move('up'); // Swipe up
              }
          }
      });

      // New game button
      document.querySelector('.new-game').addEventListener('click', () => {
          this.reset();
      });
  }

  reset() {
      this.grid = Array(4).fill().map(() => Array(4).fill(null));
      this.tiles = [];
      this.score = 0;
      this.nextId = 0;
      this.addRandomTile();
      this.addRandomTile();
      this.render();
  }
}

const game = new Game();