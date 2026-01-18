const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 240;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game variables
let gameState = {
    gold: 200,
    lives: 20,
    wave: 1,
    isWaveActive: false,
    score: 0,
    waveStartTime: 0,
    selectedMap: 'original'
};

let towers = [];
let enemies = [];
let selectedTower = null;
let waveEnemies = [];
let mousePos = { x: 0, y: 0 };

// Load background image
const backgroundImg = new Image();
function loadMapBackground(mapName) {
    const mapFiles = {
        'original': 'GREENIMAGE.jfif',
        'map1': 'map1.jfif',
        'map2': 'map2.jfif',
        'map3': 'map3.jfif'
    };
    backgroundImg.src = mapFiles[mapName] || 'GREENIMAGE.jfif';
    gameState.selectedMap = mapName;
    updatePathForMap(mapName);
}

// Different paths for each map
const mapPaths = {
    'original': [
        { x: 0, y: canvas.height / 2 },
        { x: canvas.width * 0.25, y: canvas.height * 0.3 },
        { x: canvas.width * 0.5, y: canvas.height * 0.7 },
        { x: canvas.width * 0.75, y: canvas.height * 0.4 },
        { x: canvas.width, y: canvas.height / 2 }
    ],
    'map1': [
        // Square/Rectangle path
        { x: 0, y: canvas.height * 0.2 },
        { x: canvas.width * 0.3, y: canvas.height * 0.2 },
        { x: canvas.width * 0.3, y: canvas.height * 0.8 },
        { x: canvas.width * 0.7, y: canvas.height * 0.8 },
        { x: canvas.width * 0.7, y: canvas.height * 0.2 },
        { x: canvas.width, y: canvas.height * 0.2 }
    ],
    'map2': [
        // Circle/Oval path - expanded with more waypoints
        { x: 0, y: canvas.height * 0.5 },
        { x: canvas.width * 0.08, y: canvas.height * 0.35 },
        { x: canvas.width * 0.15, y: canvas.height * 0.25 },
        { x: canvas.width * 0.25, y: canvas.height * 0.18 },
        { x: canvas.width * 0.35, y: canvas.height * 0.15 },
        { x: canvas.width * 0.425, y: canvas.height * 0.12 },
        { x: canvas.width * 0.5, y: canvas.height * 0.1 },
        { x: canvas.width * 0.575, y: canvas.height * 0.12 },
        { x: canvas.width * 0.65, y: canvas.height * 0.15 },
        { x: canvas.width * 0.75, y: canvas.height * 0.18 },
        { x: canvas.width * 0.85, y: canvas.height * 0.25 },
        { x: canvas.width * 0.92, y: canvas.height * 0.35 },
        { x: canvas.width, y: canvas.height * 0.5 },
        { x: canvas.width * 0.92, y: canvas.height * 0.65 },
        { x: canvas.width * 0.85, y: canvas.height * 0.75 },
        { x: canvas.width * 0.75, y: canvas.height * 0.82 },
        { x: canvas.width * 0.65, y: canvas.height * 0.85 },
        { x: canvas.width * 0.575, y: canvas.height * 0.88 },
        { x: canvas.width * 0.5, y: canvas.height * 0.9 },
        { x: canvas.width * 0.425, y: canvas.height * 0.88 },
        { x: canvas.width * 0.35, y: canvas.height * 0.85 },
        { x: canvas.width * 0.25, y: canvas.height * 0.82 },
        { x: canvas.width * 0.15, y: canvas.height * 0.75 },
        { x: canvas.width * 0.08, y: canvas.height * 0.65 }
    ],
    'map3': [
        // Custom complex path matching the drawn shape
        { x: 0, y: canvas.height * 0.1 },
        { x: canvas.width * 0.35, y: canvas.height * 0.1 },
        { x: canvas.width * 0.35, y: canvas.height * 0.5 },
        { x: canvas.width * 0.65, y: canvas.height * 0.5 },
        { x: canvas.width * 0.65, y: canvas.height * 0.1 },
        { x: canvas.width, y: canvas.height * 0.1 },
        { x: canvas.width, y: canvas.height * 0.9 },
        { x: canvas.width * 0.65, y: canvas.height * 0.9 },
        { x: canvas.width * 0.65, y: canvas.height * 0.5 },
        { x: canvas.width * 0.35, y: canvas.height * 0.5 },
        { x: canvas.width * 0.35, y: canvas.height * 0.9 },
        { x: 0, y: canvas.height * 0.9 }
    ]
};

let path = mapPaths['original'];

function updatePathForMap(mapName) {
    path = mapPaths[mapName] || mapPaths['original'];
}

loadMapBackground('original');
let backgroundLoaded = false;
backgroundImg.onload = () => {
    backgroundLoaded = true;
};

// Load tower sprite images
const towerSprites = {};
['basic', 'sniper', 'cannon'].forEach(type => {
    towerSprites[type] = new Image();
    towerSprites[type].src = type + '.png';
});

// Load enemy sprite images
const enemySprites = {};
const enemyTypes = ['red', 'blue'];
enemyTypes.forEach(type => {
    enemySprites[type] = new Image();
    enemySprites[type].onload = () => {
        console.log('Loaded enemy' + type + '.png - width: ' + enemySprites[type].width);
    };
    enemySprites[type].onerror = () => {
        console.log('Failed to load enemy' + type + '.png');
    };
    enemySprites[type].src = 'enemy' + type + '.png';
});

// Wave configurations
const waveConfigs = {
    1: [{ type: 'red', count: 2 }],
    2: [{ type: 'red', count: 5 }],
    3: [{ type: 'blue', count: 3 }],
    4: [{ type: 'red', count: 5 }, { type: 'blue', count: 2 }],
    5: [{ type: 'red', count: 5 }, { type: 'blue', count: 5 }]
};

function getWaveEnemies(wave) {
    if (waveConfigs[wave]) {
        const enemies = [];
        for (let config of waveConfigs[wave]) {
            for (let i = 0; i < config.count; i++) {
                enemies.push(config.type);
            }
        }
        return enemies;
    }
    // Default for waves not configured
    return Array(5 + wave * 2).fill('red');
}

// Paths for enemies
const originalPath = [
    { x: 0, y: canvas.height / 2 },
    { x: canvas.width * 0.25, y: canvas.height * 0.3 },
    { x: canvas.width * 0.5, y: canvas.height * 0.7 },
    { x: canvas.width * 0.75, y: canvas.height * 0.4 },
    { x: canvas.width, y: canvas.height / 2 }
];

// Tower types
const towerTypes = {
    basic: { range: 80, damage: 10, fireRate: 30, cost: 100, color: '#4CAF50', radius: 5 },
    sniper: { range: 150, damage: 25, fireRate: 60, cost: 200, color: '#2196F3', radius: 4 },
    cannon: { range: 100, damage: 35, fireRate: 40, cost: 150, color: '#FF9800', radius: 6 }
};

// Enemy class
class Enemy {
    constructor(wave, type = 'red') {
        this.pathIndex = 0;
        this.distanceOnPath = 0;
        this.type = type;
        this.reward = 3;
        this.alive = true;
        this.radius = 8;
        
        // Type-specific stats
        if (type === 'blue') {
            this.speed = 0.8 + (wave * 0.2);  // Slower
            this.health = 60 + (wave * 20);   // Double HP
            this.maxHealth = this.health;
        } else {
            // Red (default)
            this.speed = 1 + (wave * 0.2);
            this.health = 30 + (wave * 10);
            this.maxHealth = this.health;
        }
    }

    update() {
        this.distanceOnPath += this.speed;
        
        // Check if reached end
        if (this.pathIndex >= path.length - 1) {
            return false;
        }
        
        return true;
    }

    getPosition() {
        if (this.pathIndex >= path.length - 1) {
            return path[path.length - 1];
        }

        const currentNode = path[this.pathIndex];
        const nextNode = path[this.pathIndex + 1];
        
        const dx = nextNode.x - currentNode.x;
        const dy = nextNode.y - currentNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (this.distanceOnPath > distance) {
            this.distanceOnPath -= distance;
            this.pathIndex++;
            return this.getPosition();
        }
        
        const ratio = this.distanceOnPath / distance;
        return {
            x: currentNode.x + dx * ratio,
            y: currentNode.y + dy * ratio
        };
    }

    draw() {
        const pos = this.getPosition();
        
        // Draw enemy sprite or fallback to circle
        const sprite = enemySprites[this.type];
        if (sprite && sprite.width > 0) {
            ctx.drawImage(sprite, pos.x - 15, pos.y - 15, 30, 30);
        } else {
            // Fallback while image loads
            ctx.fillStyle = '#FF6B6B';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Health bar
        ctx.fillStyle = '#444';
        ctx.fillRect(pos.x - 15, pos.y - 20, 30, 4);
        
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(pos.x - 15, pos.y - 20, (this.health / this.maxHealth) * 30, 4);
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.alive = false;
            return true;
        }
        return false;
    }
}

// Tower class
class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = towerTypes[type];
        this.typeKey = type;
        this.fireCounter = 0;
        this.projectiles = [];
    }

    update() {
        this.fireCounter++;
        
        // Find target - prioritize the enemy furthest along the path
        let target = null;
        let maxDistance = -1;
        
        for (let enemy of enemies) {
            if (!enemy.alive) continue;
            
            const pos = enemy.getPosition();
            const dist = Math.sqrt((pos.x - this.x) ** 2 + (pos.y - this.y) ** 2);
            
            // Must be in range
            if (dist > this.type.range) continue;
            
            // Prioritize the enemy furthest along the path (highest pathIndex)
            if (enemy.pathIndex > maxDistance || (enemy.pathIndex === maxDistance && enemy.distanceOnPath > (target ? target.distanceOnPath : 0))) {
                maxDistance = enemy.pathIndex;
                target = enemy;
            }
        }
        
        // Fire at target
        if (target && this.fireCounter >= this.type.fireRate) {
            this.fireCounter = 0;
            const pos = target.getPosition();
            this.projectiles.push({
                x: this.x,
                y: this.y,
                targetX: pos.x,
                targetY: pos.y,
                target: target,
                speed: 5
            });
        }
        
        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            const dx = proj.targetX - proj.x;
            const dy = proj.targetY - proj.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < proj.speed) {
                // Hit target
                const killed = proj.target.takeDamage(this.type.damage);
                if (killed) {
                    gameState.gold += proj.target.reward;
                    gameState.score += proj.target.reward;
                    updateHUD();
                }
                return false;
            }
            
            // Move projectile
            const ratio = proj.speed / dist;
            proj.x += dx * ratio;
            proj.y += dy * ratio;
            return true;
        });
    }

    draw() {
        // Draw tower sprite or fallback to circle
        const sprite = towerSprites[this.typeKey];
        if (sprite && sprite.complete) {
            ctx.drawImage(sprite, this.x - 20, this.y - 20, 40, 40);
        } else {
            // Fallback while image loads
            ctx.fillStyle = this.type.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.type.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Range indicator (when selected)
        if (selectedTower === this) {
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.type.range, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw projectiles
        ctx.fillStyle = '#FFD700';
        for (let proj of this.projectiles) {
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Game functions
function updateGame() {
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].alive) {
            // Remove dead enemies
            enemies.splice(i, 1);
        } else if (!enemies[i].update()) {
            // Remove enemies that reached the end
            enemies.splice(i, 1);
            gameState.lives--;
            updateHUD();
        }
    }
    
    // Update towers
    for (let tower of towers) {
        tower.update();
    }
    
    // Check if wave is complete
    if (gameState.isWaveActive && enemies.length === 0 && waveEnemies.length === 0) {
        gameState.isWaveActive = false;
        gameState.wave++;
        updateHUD();
    }
    
    // Show skip wave button after 5 seconds
    if (gameState.isWaveActive) {
        const elapsed = (Date.now() - gameState.waveStartTime) / 1000;
        const skipBtn = document.getElementById('skipWaveBtn');
        skipBtn.style.display = elapsed > 5 ? 'block' : 'none';
    }
}

function drawGame() {
    // Draw background image
    if (backgroundLoaded) {
        ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback while loading
        ctx.fillStyle = 'linear-gradient(180deg, #87CEEB 0%, #90EE90 100%)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Draw path
    ctx.strokeStyle = '#8B7355';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    
    // Draw enemies
    for (let enemy of enemies) {
        enemy.draw();
    }
    
    // Draw towers
    for (let tower of towers) {
        tower.draw();
    }
    
    // Draw tower preview when selecting a tower
    if (selectedTower && mousePos.y < canvas.height) {
        const sprite = towerSprites[selectedTower.typeKey];
        ctx.globalAlpha = 0.5;
        if (sprite && sprite.complete) {
            ctx.drawImage(sprite, mousePos.x - 20, mousePos.y - 20, 40, 40);
        } else {
            ctx.fillStyle = selectedTower.type.color;
            ctx.beginPath();
            ctx.arc(mousePos.x, mousePos.y, selectedTower.type.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        // Draw range preview
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(mousePos.x, mousePos.y, selectedTower.type.range, 0, Math.PI * 2);
        ctx.stroke();
    }
}

function spawnEnemy() {
    if (waveEnemies.length > 0) {
        const enemyType = waveEnemies.shift();
        enemies.push(new Enemy(gameState.wave - 1, enemyType));
        setTimeout(spawnEnemy, 800);
    }
}

function startWave() {
    if (gameState.isWaveActive) return;
    
    gameState.isWaveActive = true;
    gameState.waveStartTime = Date.now();
    gameState.gold += 100;
    waveEnemies = getWaveEnemies(gameState.wave);
    
    spawnEnemy();
    updateHUD();
}

function updateHUD() {
    document.getElementById('gold').textContent = gameState.gold;
    document.getElementById('lives').textContent = gameState.lives;
    document.getElementById('wave').textContent = gameState.wave;
    
    const btn = document.getElementById('startWaveBtn');
    btn.disabled = gameState.isWaveActive || gameState.lives <= 0;
    
    if (gameState.lives <= 0) {
        btn.textContent = 'Game Over!';
    } else if (gameState.isWaveActive) {
        btn.textContent = 'Wave Active...';
    } else {
        btn.textContent = 'Start Wave ' + gameState.wave;
    }
    
    // Update tower buttons
    document.querySelectorAll('.tower-btn').forEach(btn => {
        const cost = parseInt(btn.dataset.cost);
        btn.classList.toggle('disabled', gameState.gold < cost);
        btn.classList.toggle('selected', selectedTower && selectedTower.type === towerTypes[btn.dataset.type]);
    });
}

// Event listeners
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mousePos.x = e.clientX - rect.left;
    mousePos.y = e.clientY - rect.top;
});

document.getElementById('skipWaveBtn').addEventListener('click', () => {
    // End current wave and start next wave
    waveEnemies = [];
    gameState.isWaveActive = false;
    gameState.wave++;
    document.getElementById('skipWaveBtn').style.display = 'none';
    updateHUD();
});

document.getElementById('startWaveBtn').addEventListener('click', () => {
    startWave();
});

document.querySelectorAll('.tower-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        const cost = parseInt(e.target.dataset.cost);
        
        if (gameState.gold >= cost) {
            selectedTower = { type: towerTypes[type], cost: cost, typeKey: type };
            updateHUD();
        }
    });
});

canvas.addEventListener('click', (e) => {
    if (!selectedTower) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on path area (simplified)
    if (y > 50 && y < canvas.height - 50) {
        const tower = new Tower(x, y, selectedTower.typeKey);
        towers.push(tower);
        gameState.gold -= selectedTower.cost;
        selectedTower = null;
        updateHUD();
    }
});

canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    mousePos.x = touch.clientX - rect.left;
    mousePos.y = touch.clientY - rect.top;
});

canvas.addEventListener('touchstart', (e) => {
    if (!selectedTower) return;
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    if (y > 50 && y < canvas.height - 50) {
        const tower = new Tower(x, y, selectedTower.typeKey);
        towers.push(tower);
        gameState.gold -= selectedTower.cost;
        selectedTower = null;
        updateHUD();
    }
});

// Game loop
function gameLoop() {
    updateGame();
    drawGame();
    requestAnimationFrame(gameLoop);
}

// Menu event listener
document.getElementById('startGameBtn').addEventListener('click', () => {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('mapMenu').style.display = 'flex';
});

document.querySelectorAll('.map-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const mapName = btn.dataset.map;
        loadMapBackground(mapName);
        
        // Reset game state
        gameState.gold = 200;
        gameState.lives = 20;
        gameState.wave = 1;
        gameState.isWaveActive = false;
        towers = [];
        enemies = [];
        waveEnemies = [];
        selectedTower = null;
        
        document.getElementById('mapMenu').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'flex';
        updateHUD();
    });
});

// Initialize
updateHUD();
gameLoop();

// Main Menu button
document.getElementById('mainMenuBtn').addEventListener('click', () => {
    document.getElementById('confirmDialog').style.display = 'flex';
});

// Confirmation dialog handlers
document.getElementById('confirmYes').addEventListener('click', () => {
    document.getElementById('gameContainer').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('confirmDialog').style.display = 'none';
});

document.getElementById('confirmNo').addEventListener('click', () => {
    document.getElementById('confirmDialog').style.display = 'none';
});
