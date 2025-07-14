// Defensive Bot Script for Race Game

let botEnabled = false;

// Helper: Find all objects in a lane ahead of the player
function getObjectsInLane(lane, playerRect) {
    return obstacles.concat(enemyCars).filter(obj => {
        const rect = obj.el.getBoundingClientRect();
        return obj.lane === lane && rect.top > playerRect.top && rect.top - playerRect.bottom < 180;
    });
}

// Helper: Check if lane is safe
function isLaneSafe(lane, playerRect) {
    return getObjectsInLane(lane, playerRect).length === 0;
}

// Find preferred lane: upgrade > boost > current lane (if safe)
function botChooseLane() {
    if (!botEnabled || !gameRunning || upgradePending) return;

    const playerRect = playerCar.getBoundingClientRect();
    let currentLane = playerLane;
    let safeLanes = Array.from({length: laneCount}, (_, i) => i).filter(lane => isLaneSafe(lane, playerRect));

    // Prefer lane with upgrade if safe
    let upgradeLane = upgrades.find(upg => safeLanes.includes(upg.lane));
    if (upgradeLane) {
        if (upgradeLane.lane < currentLane) movePlayer('left');
        else if (upgradeLane.lane > currentLane) movePlayer('right');
        return;
    }
    // Prefer lane with boost if safe
    let boostLane = boosts.find(bst => safeLanes.includes(bst.lane));
    if (boostLane) {
        if (boostLane.lane < currentLane) movePlayer('left');
        else if (boostLane.lane > currentLane) movePlayer('right');
        return;
    }
    // Otherwise, stay in current lane if safe, else pick closest safe lane
    if (!safeLanes.includes(currentLane)) {
        let bestLane = safeLanes.sort((a, b) => Math.abs(a - currentLane) - Math.abs(b - currentLane))[0];
        if (bestLane < currentLane) movePlayer('left');
        else if (bestLane > currentLane) movePlayer('right');
    }
}

// Only choose shield if not already shielded; else prefer magnets
function botUpgradeChoice() {
    if (!botEnabled || !upgradePending) return;
    if (!shield && upgradeBtns.shield) {
        upgradeBtns.shield.click();
    } else if (upgradeBtns.magnetLeft && !magnetLeft) {
        upgradeBtns.magnetLeft.click();
    } else if (upgradeBtns.magnetRight && !magnetRight) {
        upgradeBtns.magnetRight.click();
    } else if (upgradeBtns.size) {
        upgradeBtns.size.click();
    } else if (upgradeBtns.speed) {
        upgradeBtns.speed.click();
    }
}

// Periodically activate magnet logic (if available)
function botMagnetUse() {
    if ((magnetLeft || magnetRight) && upgrades.length) {
        upgrades.forEach(upg => {
            // Simulate magnet effect, if not already moving toward player
            if (magnetLeft && upg.lane < playerLane) {
                upg.lane = playerLane;
                upg.el.style.left = lanes()[upg.lane] - 19 + 'px';
            } else if (magnetRight && upg.lane > playerLane) {
                upg.lane = playerLane;
                upg.el.style.left = lanes()[upg.lane] - 19 + 'px';
            }
        });
    }
}

// Hook into the main game loop
let oldGameLoop = gameLoop;
gameLoop = function () {
    botChooseLane();
    botMagnetUse();
    oldGameLoop();
};

// Hook into upgrade menu logic
let oldShowUpgradeMenu = showUpgradeMenu;
showUpgradeMenu = function () {
    oldShowUpgradeMenu();
    setTimeout(botUpgradeChoice, 500); // Let menu render, then pick
};

// Expose bot toggle
window.toggleBot = function(enable) { botEnabled = enable !== false; };

// Enable bot by default
botEnabled = true;
