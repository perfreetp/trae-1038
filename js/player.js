class Player {
    constructor() {
        this.x = 400;
        this.y = 300;
        this.speed = GameConfig.gameSettings.playerSpeed;
        this.baseSpeed = GameConfig.gameSettings.playerSpeed;
        this.energy = GameConfig.gameSettings.maxEnergy;
        this.maxEnergy = GameConfig.gameSettings.maxEnergy;
        this.battery = GameConfig.gameSettings.maxBattery;
        this.maxBattery = GameConfig.gameSettings.maxBattery;
        this.money = 0;
        this.vehicleDurability = 100;
        this.direction = 0;
        this.isMoving = false;
        this.backpack = [];
        this.equipment = {
            box: null,
            battery: null,
            tire: null,
            light: null,
            motor: null,
            helmet: null
        };
        this.skills = {};
        for (const skill of GameConfig.skills) {
            this.skills[skill.id] = skill.baseLevel;
        }
        this.stats = {
            ordersCompleted: 0,
            ordersFailed: 0,
            totalEarnings: 0,
            totalTips: 0,
            distanceTraveled: 0,
            rating: 5,
            satisfaction: 100,
            badReviews: 0,
            redLightsRun: 0,
            reportsSubmitted: 0,
            wrongBuildings: 0,
            chargesMade: 0,
            repairsMade: 0
        };
        this.activeMessages = [];
        this.activeEvent = null;
        this.eventEndTime = 0;
        this.lastEventCheck = 0;
        this.priorityOrderId = null;
    }

    update(deltaTime, weatherModifier, isMoving, chapterFeatures = null) {
        const settings = GameConfig.gameSettings;
        const featureMult = chapterFeatures || { energyMultiplier: 1, durabilityMultiplier: 1 };
        
        if (isMoving) {
            this.energy -= settings.energyDrainRate * weatherModifier.energyDrain * featureMult.energyMultiplier;
            this.battery -= settings.batteryDrainRate;
            this.vehicleDurability -= settings.vehicleDurabilityDrain * featureMult.durabilityMultiplier;
        }
        this.energy = Math.max(0, Math.min(this.maxEnergy, this.energy));
        this.battery = Math.max(0, Math.min(this.maxBattery, this.battery));
        this.vehicleDurability = Math.max(0, Math.min(100, this.vehicleDurability));
        
        this.calculateEffectiveSpeed();
        
        if (isMoving && Date.now() - this.lastEventCheck > 1000) {
            this.checkVehicleEvents();
            this.lastEventCheck = Date.now();
        }
        
        if (this.activeEvent && Date.now() > this.eventEndTime) {
            this.activeEvent = null;
            this.calculateEffectiveSpeed();
        }
        
        const energySkill = this.skills[4] || 1;
        this.maxEnergy = GameConfig.gameSettings.maxEnergy * (1 + (energySkill - 1) * 0.1);
        const batteryEquip = this.equipment.battery;
        if (batteryEquip) {
            this.maxBattery = GameConfig.gameSettings.maxBattery + batteryEquip.stats.batteryMax;
        } else {
            this.maxBattery = GameConfig.gameSettings.maxBattery;
        }
    }
    
    calculateEffectiveSpeed() {
        const settings = GameConfig.gameSettings;
        let speed = this.baseSpeed;
        
        if (this.battery <= 0) {
            speed *= 0.3;
        } else {
            const motorEquip = this.equipment.motor;
            if (motorEquip) {
                speed *= 1 + motorEquip.stats.speed / 100;
            }
        }
        
        if (this.vehicleDurability < 30) {
            speed *= settings.durabilitySpeedPenalty.high;
        } else if (this.vehicleDurability < 50) {
            speed *= settings.durabilitySpeedPenalty.medium;
        } else if (this.vehicleDurability < 80) {
            speed *= settings.durabilitySpeedPenalty.low;
        }
        
        if (this.activeEvent) {
            speed *= this.activeEvent.speedMultiplier;
        }
        
        this.speed = speed;
    }
    
    checkVehicleEvents() {
        if (this.activeEvent) return;
        
        const possibleEvents = GameConfig.vehicleEvents.filter(
            e => this.vehicleDurability <= e.durabilityThreshold
        );
        
        if (possibleEvents.length === 0) return;
        
        let chance;
        if (this.vehicleDurability < 30) {
            chance = GameConfig.gameSettings.breakdownChance.high;
        } else if (this.vehicleDurability < 50) {
            chance = GameConfig.gameSettings.breakdownChance.medium;
        } else {
            return;
        }
        
        if (Math.random() < chance) {
            const event = possibleEvents[Math.floor(Math.random() * possibleEvents.length)];
            this.activeEvent = event;
            this.eventEndTime = Date.now() + event.duration;
            this.calculateEffectiveSpeed();
            return event;
        }
        return null;
    }

    move(dx, dy, weatherModifier, gameMap) {
        const actualSpeed = this.speed * weatherModifier.speedModifier;
        let newX = this.x + dx * actualSpeed;
        let newY = this.y + dy * actualSpeed;
        newX = Math.max(20, Math.min(780, newX));
        newY = Math.max(20, Math.min(580, newY));
        if (gameMap.isOnRoad(newX, newY) || gameMap.isOnRoad(this.x, newY) || gameMap.isOnRoad(newX, this.y)) {
            if (!gameMap.isOnRoad(newX, newY)) {
                if (gameMap.isOnRoad(this.x, newY)) {
                    newX = this.x;
                } else if (gameMap.isOnRoad(newX, this.y)) {
                    newY = this.y;
                } else {
                    return;
                }
            }
            const oldX = this.x;
            const oldY = this.y;
            this.x = newX;
            this.y = newY;
            this.stats.distanceTraveled += Math.sqrt(Math.pow(newX - oldX, 2) + Math.pow(newY - oldY, 2));
            if (dx !== 0 || dy !== 0) {
                this.direction = Math.atan2(dy, dx);
            }
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
    }

    charge(amount, cost) {
        if (this.money >= cost) {
            this.battery = Math.min(this.maxBattery, this.battery + amount);
            this.money -= cost;
            return true;
        }
        return false;
    }

    rest(amount) {
        this.energy = Math.min(this.maxEnergy, this.energy + amount);
    }

    addToBackpack(item) {
        if (this.backpack.length < 16) {
            this.backpack.push(item);
            return true;
        }
        return false;
    }

    removeFromBackpack(index) {
        if (index >= 0 && index < this.backpack.length) {
            return this.backpack.splice(index, 1)[0];
        }
        return null;
    }

    equipItem(item) {
        if (item.type === 'equipment' && this.equipment[item.slot] !== undefined) {
            this.equipment[item.slot] = item;
            return true;
        }
        return false;
    }

    useConsumable(item) {
        if (item.type === 'consumable' && item.stats) {
            if (item.stats.energy) {
                this.rest(item.stats.energy);
            }
            return true;
        }
        return false;
    }

    upgradeSkill(skillId) {
        const skill = GameConfig.skills.find(s => s.id === skillId);
        if (skill && this.skills[skillId] < skill.maxLevel) {
            const cost = (this.skills[skillId] + 1) * 50;
            if (this.money >= cost) {
                this.money -= cost;
                this.skills[skillId]++;
                return true;
            }
        }
        return false;
    }

    getSkillEffect(skillId) {
        const skill = GameConfig.skills.find(s => s.id === skillId);
        if (skill) {
            const level = this.skills[skillId] || 1;
            const effectKey = Object.keys(skill.effect)[0];
            return (level - 1) * skill.effect[effectKey];
        }
        return 0;
    }

    addMessage(message) {
        this.activeMessages.push({
            ...message,
            timestamp: Date.now()
        });
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.direction);
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛵', 0, 0);
        ctx.restore();
        if (this.equipment.light) {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 80);
            gradient.addColorStop(0, 'rgba(255, 255, 200, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 80, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
