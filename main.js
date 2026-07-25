 <!-- ==========================================
         JAVASCRIPT GAME LOGIC
         ========================================== -->
    <script>
        /* ==========================================
           GAME CONFIGURATION & CONSTANTS
           ========================================== */
        
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const GRID_SIZE = 20;
        const TILE_COUNT = canvas.width / GRID_SIZE;

        const gameState = {
            snake: [],
            direction: { x: 1, y: 0 },
            nextDirection: { x: 1, y: 0 },
            food: { x: 0, y: 0 },
            score: 0,
            highScore: 0,
            gameRunning: false,
            gamePaused: false,
            gameSpeed: 150,
            level: 1,
            gameLoop: null
        };

        const settings = {
            theme: 'dark',
            speed: 5,
            level: 1 // 1=Easy (wrap walls), 2=Medium, 3=Hard
        };

        /* ==========================================
           INITIALIZATION
           ========================================== */
        
        function init() {
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            loadHighScore();
            loadSettings();
            initSnake();
            generateFood();
            draw();
            setupEventListeners();
        }

        function resizeCanvas() {
            const container = document.querySelector('.game-container');
            const maxWidth = Math.min(container.clientWidth - 40, 600);
            const size = Math.min(maxWidth, window.innerHeight * 0.5);
            canvas.width = size;
            canvas.height = size;
        }

        function initSnake() {
            gameState.snake = [
                { x: Math.floor(TILE_COUNT / 2), y: Math.floor(TILE_COUNT / 2) },
                { x: Math.floor(TILE_COUNT / 2) - 1, y: Math.floor(TILE_COUNT / 2) },
                { x: Math.floor(TILE_COUNT / 2) - 2, y: Math.floor(TILE_COUNT / 2) }
            ];
            gameState.direction = { x: 1, y: 0 };
            gameState.nextDirection = { x: 1, y: 0 };
        }

        /* ==========================================
           GAME LOOP & LOGIC
           ========================================== */
        
        function startGame() {
            if (gameState.gameRunning) return;

            gameState.score = 0;
            gameState.gameRunning = true;
            gameState.gamePaused = false;
            
            initSnake();
            generateFood();
            calculateGameSpeed();

            updateScore();
            document.getElementById('gameOver').classList.remove('active');
            document.getElementById('startBtn').textContent = 'Restart';

            gameState.gameLoop = setInterval(update, gameState.gameSpeed);
        }

        function togglePause() {
            if (!gameState.gameRunning) return;

            gameState.gamePaused = !gameState.gamePaused;
            document.getElementById('pauseBtn').textContent = gameState.gamePaused ? 'Resume' : 'Pause';

            if (gameState.gamePaused) {
                clearInterval(gameState.gameLoop);
            } else {
                gameState.gameLoop = setInterval(update, gameState.gameSpeed);
            }
        }

        function update() {
            if (gameState.gamePaused) return;

            gameState.direction = { ...gameState.nextDirection };

            const head = { ...gameState.snake[0] };
            head.x += gameState.direction.x;
            head.y += gameState.direction.y;

            // WALL WRAPPING LOGIC FOR EASY MODE
            if (settings.level === 1) {
                // Easy mode: Wrap around walls
                if (head.x < 0) head.x = TILE_COUNT - 1;
                if (head.x >= TILE_COUNT) head.x = 0;
                if (head.y < 0) head.y = TILE_COUNT - 1;
                if (head.y >= TILE_COUNT) head.y = 0;
            }

            // Check for collisions
            if (checkCollision(head)) {
                gameOver();
                return;
            }

            gameState.snake.unshift(head);

            if (head.x === gameState.food.x && head.y === gameState.food.y) {
                gameState.score += 10;
                updateScore();
                generateFood();
                
                if (gameState.snake.length % 5 === 0) {
                    clearInterval(gameState.gameLoop);
                    gameState.gameSpeed = Math.max(50, gameState.gameSpeed - 5);
                    gameState.gameLoop = setInterval(update, gameState.gameSpeed);
                }
            } else {
                gameState.snake.pop();
            }

            draw();
        }

        /**
         * Check collision - different behavior based on level
         * Easy mode: Only self-collision (walls wrap)
         * Medium/Hard: Wall collision and self-collision
         */
        function checkCollision(head) {
            // Wall collision (only for Medium and Hard modes)
            if (settings.level > 1) {
                if (head.x < 0 || head.x >= TILE_COUNT || head.y < 0 || head.y >= TILE_COUNT) {
                    return true;
                }
            }

            // Self collision (all modes)
            for (let segment of gameState.snake) {
                if (head.x === segment.x && head.y === segment.y) {
                    return true;
                }
            }

            return false;
        }

        function generateFood() {
            let newFood;
            let validPosition = false;

            while (!validPosition) {
                newFood = {
                    x: Math.floor(Math.random() * TILE_COUNT),
                    y: Math.floor(Math.random() * TILE_COUNT)
                };

                validPosition = !gameState.snake.some(
                    segment => segment.x === newFood.x && segment.y === newFood.y
                );
            }

            gameState.food = newFood;
        }

        function gameOver() {
            gameState.gameRunning = false;
            clearInterval(gameState.gameLoop);

            if (gameState.score > gameState.highScore) {
                gameState.highScore = gameState.score;
                saveHighScore();
                updateScore();
            }

            document.getElementById('finalScore').textContent = gameState.score;
            document.getElementById('gameOver').classList.add('active');
            document.getElementById('startBtn').textContent = 'Start Game';
        }

        /* ==========================================
           RENDERING
           ========================================== */
        
        function draw() {
            const cellSize = canvas.width / TILE_COUNT;

            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--canvas-bg');
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            drawGrid(cellSize);
            drawFood(cellSize);
            drawSnake(cellSize);
        }

        function drawGrid(cellSize) {
            ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--grid-color');
            ctx.lineWidth = 1;

            for (let i = 0; i <= TILE_COUNT; i++) {
                ctx.beginPath();
                ctx.moveTo(i * cellSize, 0);
                ctx.lineTo(i * cellSize, canvas.height);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(0, i * cellSize);
                ctx.lineTo(canvas.width, i * cellSize);
                ctx.stroke();
            }
        }

        function drawFood(cellSize) {
            const x = gameState.food.x * cellSize + cellSize / 2;
            const y = gameState.food.y * cellSize + cellSize / 2;
            const radius = cellSize / 2.5;

            ctx.shadowBlur = 15;
            ctx.shadowColor = getComputedStyle(document.body).getPropertyValue('--food-color');

            ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--food-color');
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
        }

        function drawSnake(cellSize) {
            const snakeColor = getComputedStyle(document.body).getPropertyValue('--snake-color');
            
            gameState.snake.forEach((segment, index) => {
                const x = segment.x * cellSize;
                const y = segment.y * cellSize;

                if (index === 0) {
                    ctx.fillStyle = snakeColor;
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = snakeColor;
                } else {
                    ctx.fillStyle = snakeColor;
                    ctx.globalAlpha = 1 - (index / gameState.snake.length) * 0.5;
                    ctx.shadowBlur = 0;
                }

                drawRoundedRect(ctx, x + 1, y + 1, cellSize - 2, cellSize - 2, 4);
                ctx.globalAlpha = 1;
            });
        }

        function drawRoundedRect(ctx, x, y, width, height, radius) {
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.fill();
        }

        /* ==========================================
           INPUT HANDLING
           ========================================== */
        
        function changeDirection(dx, dy) {
            if (dx === -gameState.direction.x && dy === -gameState.direction.y) {
                return;
            }

            if (dx !== 0 && dy !== 0) {
                return;
            }

            gameState.nextDirection = { x: dx, y: dy };
        }

        function setupEventListeners() {
            // Keyboard controls
            document.addEventListener('keydown', (e) => {
                switch(e.key) {
                    case 'ArrowUp':
                    case 'w':
                    case 'W':
                        e.preventDefault();
                        changeDirection(0, -1);
                        break;
                    case 'ArrowDown':
                    case 's':
                    case 'S':
                        e.preventDefault();
                        changeDirection(0, 1);
                        break;
                    case 'ArrowLeft':
                    case 'a':
                    case 'A':
                        e.preventDefault();
                        changeDirection(-1, 0);
                        break;
                    case 'ArrowRight':
                    case 'd':
                    case 'D':
                        e.preventDefault();
                        changeDirection(1, 0);
                        break;
                    case ' ':
                        e.preventDefault();
                        togglePause();
                        break;
                    case 'Enter':
                        e.preventDefault();
                        startGame();
                        break;
                }
            });

            // Button controls
            document.getElementById('upBtn').addEventListener('click', () => changeDirection(0, -1));
            document.getElementById('downBtn').addEventListener('click', () => changeDirection(0, 1));
            document.getElementById('leftBtn').addEventListener('click', () => changeDirection(-1, 0));
            document.getElementById('rightBtn').addEventListener('click', () => changeDirection(1, 0));

            // Touch controls
            ['upBtn', 'downBtn', 'leftBtn', 'rightBtn'].forEach(id => {
                const btn = document.getElementById(id);
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    btn.click();
                });
            });

            // Action buttons
            document.getElementById('startBtn').addEventListener('click', startGame);
            document.getElementById('pauseBtn').addEventListener('click', togglePause);
            document.getElementById('restartBtn').addEventListener('click', startGame);

            setupMenuListeners();
            setupModalListeners();
        }

        function setupMenuListeners() {
            const menuBtn = document.getElementById('menuBtn');
            const dropdownMenu = document.getElementById('dropdownMenu');

            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.classList.toggle('active');
            });

            document.addEventListener('click', (e) => {
                if (!dropdownMenu.contains(e.target) && e.target !== menuBtn) {
                    dropdownMenu.classList.remove('active');
                }
            });

            document.getElementById('developerBtn').addEventListener('click', () => {
                openModal('developerModal');
                dropdownMenu.classList.remove('active');
            });

            document.getElementById('settingsBtn').addEventListener('click', () => {
                openModal('settingsModal');
                dropdownMenu.classList.remove('active');
            });

            document.getElementById('helpBtn').addEventListener('click', () => {
                openModal('helpModal');
                dropdownMenu.classList.remove('active');
            });
        }

        function setupModalListeners() {
            document.getElementById('closeSettings').addEventListener('click', () => closeModal('settingsModal'));
            document.getElementById('closeHelp').addEventListener('click', () => closeModal('helpModal'));
            document.getElementById('closeDeveloper').addEventListener('click', () => closeModal('developerModal'));

            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeModal(modal.id);
                    }
                });
            });

            setupSettingsListeners();
            setupDeveloperListeners();
        }

        function setupSettingsListeners() {
            // Theme buttons
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    settings.theme = btn.dataset.theme;
                });
            });

            // Speed slider
            const speedSlider = document.getElementById('speedSlider');
            const speedValue = document.getElementById('speedValue');
            
            speedSlider.addEventListener('input', (e) => {
                speedValue.textContent = e.target.value;
                settings.speed = parseInt(e.target.value);
            });

            // Level buttons
            document.querySelectorAll('.level-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    settings.level = parseInt(btn.dataset.level);
                });
            });

            // Save settings
            document.getElementById('saveSettings').addEventListener('click', () => {
                saveSettings();
                closeModal('settingsModal');
                
                const btn = document.getElementById('saveSettings');
                const originalText = btn.textContent;
                btn.textContent = '✓ Saved!';
                btn.style.background = '#4CAF50';
                
                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.style.background = '';
                }, 1500);
            });
        }

        /**
         * Setup developer page interactions
         */
        function setupDeveloperListeners() {
            const copyEmailBtn = document.getElementById('copyEmailBtn');
            const emailText = document.getElementById('devEmailText').textContent;

            copyEmailBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(emailText).then(() => {
                    const originalText = copyEmailBtn.textContent;
                    copyEmailBtn.textContent = '✓ Copied!';
                    
                    setTimeout(() => {
                        copyEmailBtn.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                });
            });
        }

        /* ==========================================
           MODAL FUNCTIONS
           ========================================== */
        
        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
            
            if (gameState.gameRunning && !gameState.gamePaused) {
                togglePause();
            }
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        /* ==========================================
           SETTINGS MANAGEMENT
           ========================================== */
        
        function calculateGameSpeed() {
            const baseSpeed = 250 - (settings.speed * 20);
            const levelMultiplier = 1 - (settings.level - 1) * 0.2;
            gameState.gameSpeed = Math.max(50, baseSpeed * levelMultiplier);
        }

        function applyTheme(theme) {
            document.body.classList.remove('light-theme', 'retro-theme', 'ocean-theme', 'sunset-theme', 'cyberpunk-theme', 'forest-theme');
            
            if (theme !== 'dark') {
                document.body.classList.add(`${theme}-theme`);
            }
            
            if (gameState.snake.length > 0) {
                draw();
            }
        }

        function saveSettings() {
            localStorage.setItem('snakeGameSettings', JSON.stringify(settings));
            applyTheme(settings.theme);
            calculateGameSpeed();
        }

        function loadSettings() {
            const saved = localStorage.getItem('snakeGameSettings');
            if (saved) {
                Object.assign(settings, JSON.parse(saved));
                
                document.querySelectorAll('.theme-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.theme === settings.theme);
                });
                
                document.getElementById('speedSlider').value = settings.speed;
                document.getElementById('speedValue').textContent = settings.speed;
                
                document.querySelectorAll('.level-btn').forEach(btn => {
                    btn.classList.toggle('active', parseInt(btn.dataset.level) === settings.level);
                });
                
                applyTheme(settings.theme);
            }
        }

        /* ==========================================
           SCORE MANAGEMENT
           ========================================== */
        
        function updateScore() {
            document.getElementById('score').textContent = gameState.score;
            document.getElementById('highScore').textContent = gameState.highScore;
        }

        function saveHighScore() {
            localStorage.setItem('snakeGameHighScore', gameState.highScore);
        }

        function loadHighScore() {
            const saved = localStorage.getItem('snakeGameHighScore');
            if (saved) {
                gameState.highScore = parseInt(saved);
                updateScore();
            }
        }

        /* ==========================================
           INITIALIZE GAME ON PAGE LOAD
           ========================================== */
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
