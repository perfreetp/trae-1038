class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameMap = null;
        this.player = null;
        this.orderManager = null;
        this.uiManager = null;
        this.selectedChapter = 1;
        this.unlockedChapters = [1, 2, 3];
        this.currentChapter = null;
        this.isRunning = false;
        this.isPaused = false;
        this.gameTime = 0;
        this.gameTimeSpeed = 10;
        this.realStartTime = 0;
        this.lastFrameTime = 0;
        this.keys = {};
        this.weather = 'clear';
        this.weatherModifier = GameConfig.weatherTypes.clear;
        this.messages = [];
        this.storyMessageIndex = 0;
        this.lastStoryMessageTime = 0;
        this.orderGenerateTimer = 0;
        this.lastTrafficLightCheck = 0;
        this.trafficLightCooldown = {};
        this.init();
    }

    init() {
        this.gameMap = new GameMap(this.canvas);
        this.player = new Player();
        this.orderManager = new OrderManager();
        this.uiManager = new UIManager(this);
        this.initKeyboardControls();
        this.uiManager.updateChapterList(this.selectedChapter, this.unlockedChapters);
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startGame();
        });
    }

    initKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Escape') {
                this.togglePause();
            }
            if (e.key.toLowerCase() === 'e' && !this.isPaused) {
                this.interact();
            }
            if (e.key === ' ' && !this.isPaused) {
                e.preventDefault();
                this.interact();
            }
            if (e.key.toLowerCase() === 'm' && !this.isPaused) {
                this.uiManager.switchPanel('map');
            }
        });
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    selectChapter(chapterId) {
        this.selectedChapter = chapterId;
        this.uiManager.updateChapterList(this.selectedChapter, this.unlockedChapters);
    }

    startGame() {
        this.currentChapter = GameConfig.chapters.find(c => c.id === this.selectedChapter);
        if (!this.currentChapter) return;
        this.player = new Player();
        this.orderManager = new OrderManager();
        this.weather = this.currentChapter.weather;
        this.weatherModifier = GameConfig.weatherTypes[this.weather];
        this.gameTime = this.currentChapter.startTime * 60;
        this.realStartTime = Date.now();
        this.lastStoryMessageTime = 0;
        this.storyMessageIndex = 0;
        this.messages = [];
        this.orderGenerateTimer = 0;
        this.trafficLightCooldown = {};
        this.orderManager.generateAvailableOrders(this.currentChapter, 3);
        this.addSystemMessage('系统', `欢迎来到${this.currentChapter.name}！今晚的天气是${this.weatherModifier.name}`);
        this.addSystemMessage('站长', `今晚目标完成${this.currentChapter.orderCount}单，加油！`);
        document.getElementById('start-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        this.isRunning = true;
        this.isPaused = false;
        this.lastFrameTime = performance.now();
        this.uiManager.switchPanel('map');
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        if (!this.isPaused) {
            this.update(deltaTime);
        }
        this.render();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        this.updateGameTime(deltaTime);
        this.handlePlayerMovement(deltaTime);
        this.checkTrafficLights();
        this.player.update(deltaTime, this.weatherModifier, this.player.isMoving);
        this.orderManager.update(deltaTime, this.player);
        this.gameMap.updateTrafficLights(deltaTime);
        this.gameMap.updateWeather(this.weather, deltaTime);
        this.updateOrderGeneration(deltaTime);
        this.updateStoryMessages();
        this.updateUI();
        this.checkGameEnd();
        if (this.player.energy <= 0) {
            this.addSystemMessage('系统', '体力耗尽！请休息或使用补给品');
            this.player.energy = 10;
        }
    }

    updateGameTime(deltaTime) {
        this.gameTime += (deltaTime / 1000) * this.gameTimeSpeed / 60;
        const endTimeMinutes = this.currentChapter.endTime < this.currentChapter.startTime 
            ? (this.currentChapter.endTime + 24) * 60 
            : this.currentChapter.endTime * 60;
        if (this.gameTime >= endTimeMinutes) {
            this.endShift();
        }
    }

    handlePlayerMovement(deltaTime) {
        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['arrowup']) dy = -1;
        if (this.keys['s'] || this.keys['arrowdown']) dy = 1;
        if (this.keys['a'] || this.keys['arrowleft']) dx = -1;
        if (this.keys['d'] || this.keys['arrowright']) dx = 1;
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        if (dx !== 0 || dy !== 0) {
            this.player.move(dx, dy, this.weatherModifier, this.gameMap);
        } else {
            this.player.isMoving = false;
        }
    }

    checkTrafficLights() {
        if (!this.player.isMoving) return;
        
        for (const light of this.gameMap.trafficLights) {
            const distance = Math.sqrt(
                Math.pow(this.player.x - light.x, 2) + 
                Math.pow(this.player.y - light.y, 2)
            );
            
            if (distance < 50) {
                const cooldownKey = `light_${light.id}`;
                const now = Date.now();
                
                if (light.state === 'red' && !this.trafficLightCooldown[cooldownKey]) {
                    this.trafficLightCooldown[cooldownKey] = now + 5000;
                    this.punishRedLight();
                } else if (light.state === 'yellow' && !this.trafficLightCooldown[cooldownKey]) {
                    if (Math.random() < 0.3) {
                        this.trafficLightCooldown[cooldownKey] = now + 5000;
                        this.punishYellowLight();
                    }
                }
                
                if (this.trafficLightCooldown[cooldownKey] && now > this.trafficLightCooldown[cooldownKey]) {
                    delete this.trafficLightCooldown[cooldownKey];
                }
            }
        }
    }

    punishRedLight() {
        this.player.stats.satisfaction = Math.max(0, this.player.stats.satisfaction - 10);
        this.player.vehicleDurability = Math.max(0, this.player.vehicleDurability - 5);
        const fine = 10;
        this.player.money = Math.max(0, this.player.money - fine);
        this.addSystemMessage('系统', `⚠️ 闯红灯！罚款 ¥${fine}，扣除满意度，车辆耐久下降`);
    }

    punishYellowLight() {
        this.player.stats.satisfaction = Math.max(0, this.player.stats.satisfaction - 3);
        this.player.vehicleDurability = Math.max(0, this.player.vehicleDurability - 2);
        this.addSystemMessage('系统', '⚠️ 抢黄灯！注意安全，轻微扣除满意度');
    }

    updateOrderGeneration(deltaTime) {
        this.orderGenerateTimer += deltaTime;
        const targetOrders = this.currentChapter.orderCount - this.orderManager.completedOrders.length;
        if (this.orderGenerateTimer > 5000 && this.orderManager.availableOrders.length < 3 && targetOrders > 0) {
            this.orderGenerateTimer = 0;
            this.orderManager.generateAvailableOrders(this.currentChapter, 1);
        }
    }

    updateStoryMessages() {
        const gameMinutes = this.gameTime;
        if (this.storyMessageIndex < GameConfig.storyMessages.length) {
            const msg = GameConfig.storyMessages[this.storyMessageIndex];
            const [h, m] = msg.time.split(':').map(Number);
            const msgMinutes = h * 60 + m;
            const adjustedMsgMinutes = msgMinutes < this.currentChapter.startTime * 60 
                ? msgMinutes + 24 * 60 
                : msgMinutes;
            if (gameMinutes >= adjustedMsgMinutes && Date.now() - this.lastStoryMessageTime > 5000) {
                this.addMessage({
                    sender: msg.sender,
                    content: msg.content,
                    time: msg.time,
                    type: msg.type === 'story' ? 'system' : msg.type
                });
                this.storyMessageIndex++;
                this.lastStoryMessageTime = Date.now();
            }
        }
    }

    interact() {
        for (const order of this.orderManager.activeOrders) {
            if (order.status === 'accepted' && this.orderManager.isNearRestaurant(order, this.player)) {
                this.pickupOrder(order.id);
                return;
            }
            if (order.status === 'picked' && this.orderManager.isNearDeliveryLocation(order, this.player)) {
                this.showBuildingSelect(order.id);
                return;
            }
        }
    }

    acceptOrder(orderId) {
        if (this.orderManager.activeOrders.length >= GameConfig.gameSettings.maxActiveOrders) {
            this.uiManager.showDialog('订单已满', `最多同时接${GameConfig.gameSettings.maxActiveOrders}单，请先完成已有订单`);
            return;
        }
        const result = this.orderManager.acceptOrder(orderId, this.player);
        if (result.success) {
            this.addSystemMessage('系统', `已接单：${result.order.restaurant.name} -> ${result.order.deliveryLocation.name}`);
            this.uiManager.updateAllPanels();
        } else {
            this.uiManager.showDialog('接单失败', result.message);
        }
    }

    pickupOrder(orderId) {
        const order = this.orderManager.activeOrders.find(o => o.id === orderId);
        if (!order) return;
        if (!this.orderManager.isNearRestaurant(order, this.player)) {
            this.uiManager.showDialog('距离太远', '请先到餐厅位置再取餐');
            return;
        }
        const result = this.orderManager.pickupOrder(orderId);
        if (result.success) {
            this.addSystemMessage('系统', `已取餐：${order.food}，请尽快送达`);
            this.uiManager.updateAllPanels();
        }
    }

    showBuildingSelect(orderId) {
        const order = this.orderManager.activeOrders.find(o => o.id === orderId);
        if (!order) return;
        if (!this.orderManager.isNearDeliveryLocation(order, this.player)) {
            this.uiManager.showDialog('距离太远', '请先到送餐位置再送达');
            return;
        }
        
        this.uiManager.showBuildingSelectDialog(order, (result) => {
            if (result.timePenalty > 0) {
                for (const o of this.orderManager.activeOrders) {
                    o.timeRemaining -= result.timePenalty;
                }
                this.player.stats.satisfaction = Math.max(0, this.player.stats.satisfaction - result.satisfactionPenalty);
                
                let msg = '找错了楼栋！';
                if (result.timePenalty >= 60) {
                    msg += ' 浪费了大量时间，满意度下降较多';
                } else {
                    msg += ' 浪费了一点时间';
                }
                this.addSystemMessage('系统', msg);
            }
            
            this.completeDelivery(orderId);
        });
    }

    completeDelivery(orderId) {
        const result = this.orderManager.deliverOrder(orderId, this.player);
        if (result.success) {
            let message = `送达成功！获得 ¥${result.pay}`;
            if (result.tip > 0) {
                message += `，小费 ¥${result.tip}`;
            }
            if (result.satisfaction > 90) {
                message += '，顾客非常满意！';
            } else if (result.satisfaction < 60) {
                message += '，顾客不太满意...';
            }
            this.addSystemMessage('系统', message);
            this.uiManager.updateAllPanels();
            
            if (this.orderManager.completedOrders.length >= this.currentChapter.orderCount) {
                setTimeout(() => this.endShift(), 1000);
            }
        }
    }

    deliverOrder(orderId) {
        this.showBuildingSelect(orderId);
    }

    cancelOrder(orderId) {
        const result = this.orderManager.cancelOrder(orderId, this.player);
        if (result.success) {
            this.addSystemMessage('系统', '订单已取消，扣除信誉分');
            this.uiManager.updateAllPanels();
        }
    }

    submitReport(orderId, reason) {
        const order = this.orderManager.activeOrders.find(o => o.id === orderId);
        if (!order) return;
        
        order.reported = true;
        order.timeRemaining += 60;
        
        this.addSystemMessage('系统', `报备成功！订单 #${orderId} 已标记"${reason}"，平台处理中，配送时间延长60秒`);
        this.addMessage({
            sender: '系统',
            content: `报备记录：订单 #${orderId} - ${reason}`,
            time: this.getGameTimeString(),
            type: 'system'
        });
        
        this.uiManager.updateAllPanels();
    }

    addSystemMessage(sender, content) {
        const timeStr = this.getGameTimeString();
        this.addMessage({
            sender: sender,
            content: content,
            time: timeStr,
            type: 'system'
        });
    }

    addPlayerMessage(content) {
        const timeStr = this.getGameTimeString();
        this.addMessage({
            sender: '我',
            content: content,
            time: timeStr,
            type: 'player'
        });
        setTimeout(() => {
            const responses = [
                '好的，知道了',
                '收到',
                '嗯',
                '加油！',
                '注意安全'
            ];
            this.addMessage({
                sender: '站长',
                content: responses[Math.floor(Math.random() * responses.length)],
                time: this.getGameTimeString(),
                type: 'system'
            });
        }, 2000);
    }

    addMessage(message) {
        this.messages.push(message);
        if (this.messages.length > 50) {
            this.messages.shift();
        }
    }

    getGameTimeString() {
        let hours = Math.floor(this.gameTime / 60);
        const minutes = Math.floor(this.gameTime % 60);
        if (hours >= 24) hours -= 24;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    updateUI() {
        this.uiManager.updateAllPanels();
    }

    render() {
        this.gameMap.render(this.weather, this.weatherModifier.visibility);
        this.player.render(this.ctx);
        this.renderOrderRoutes();
        this.renderInteractionHints();
        this.renderTrafficLightWarnings();
    }

    renderOrderRoutes() {
        const ctx = this.ctx;
        for (const order of this.orderManager.activeOrders) {
            ctx.strokeStyle = order.status === 'accepted' ? '#3b82f6' : '#f59e0b';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.globalAlpha = 0.5;
            const targetX = order.status === 'accepted' ? order.restaurant.x : order.deliveryLocation.x;
            const targetY = order.status === 'accepted' ? order.restaurant.y : order.deliveryLocation.y;
            ctx.beginPath();
            ctx.moveTo(this.player.x, this.player.y);
            ctx.lineTo(targetX, targetY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 1;
            ctx.fillStyle = order.status === 'accepted' ? '#3b82f6' : '#f59e0b';
            ctx.beginPath();
            ctx.arc(targetX, targetY, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(order.status === 'accepted' ? '取' : '送', targetX, targetY + 4);
        }
    }

    renderInteractionHints() {
        const ctx = this.ctx;
        for (const order of this.orderManager.activeOrders) {
            if (order.status === 'accepted' && this.orderManager.isNearRestaurant(order, this.player)) {
                ctx.fillStyle = 'rgba(74, 158, 255, 0.9)';
                ctx.fillRect(order.restaurant.x - 50, order.restaurant.y - 50, 100, 25);
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('按E/空格取餐', order.restaurant.x, order.restaurant.y - 33);
            }
            if (order.status === 'picked' && this.orderManager.isNearDeliveryLocation(order, this.player)) {
                ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
                ctx.fillRect(order.deliveryLocation.x - 50, order.deliveryLocation.y - 50, 100, 25);
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('按E/空格送达', order.deliveryLocation.x, order.deliveryLocation.y - 33);
            }
        }
    }

    renderTrafficLightWarnings() {
        const ctx = this.ctx;
        for (const light of this.gameMap.trafficLights) {
            const distance = Math.sqrt(
                Math.pow(this.player.x - light.x, 2) + 
                Math.pow(this.player.y - light.y, 2)
            );
            
            if (distance < 80 && light.state === 'red') {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
                ctx.fillRect(light.x - 40, light.y - 50, 80, 20);
                ctx.fillStyle = '#fff';
                ctx.font = '11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('红灯！停车', light.x, light.y - 36);
            }
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            document.getElementById('pause-screen').classList.add('active');
        } else {
            document.getElementById('pause-screen').classList.remove('active');
            document.getElementById('shop-screen').classList.remove('active');
        }
    }

    restart() {
        document.getElementById('pause-screen').classList.remove('active');
        this.startGame();
    }

    quitToMenu() {
        this.isRunning = false;
        document.getElementById('pause-screen').classList.remove('active');
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('start-screen').classList.add('active');
    }

    checkGameEnd() {
        if (this.player.battery <= 0 && this.player.money < 2) {
            this.uiManager.showDialog('游戏结束', '电池耗尽且余额不足，无法继续工作。今晚的工作结束了。', [
                { text: '返回主菜单', primary: true, callback: () => this.quitToMenu() }
            ]);
            this.isRunning = false;
        }
    }

    endShift() {
        this.isPaused = true;
        const completed = this.orderManager.completedOrders.length;
        const totalEarnings = this.player.stats.totalEarnings + this.player.stats.totalTips;
        const target = this.currentChapter.orderCount;
        let message = `班次结束！\n\n`;
        message += `完成订单: ${completed}/${target}\n`;
        message += `配送收入: ¥${this.player.stats.totalEarnings}\n`;
        message += `小费收入: ¥${this.player.stats.totalTips}\n`;
        message += `总收入: ¥${totalEarnings}\n`;
        message += `满意度: ${Math.floor(this.player.stats.satisfaction)}%\n\n`;
        if (completed >= target) {
            message += '🎉 恭喜完成目标！';
            const nextChapter = this.selectedChapter + 1;
            if (nextChapter <= GameConfig.chapters.length && !this.unlockedChapters.includes(nextChapter)) {
                this.unlockedChapters.push(nextChapter);
                message += `\n已解锁新章节：${GameConfig.chapters[nextChapter - 1].name}`;
            }
        } else {
            message += '未能完成目标，继续加油！';
        }
        this.uiManager.showDialog('班次结算', message, [
            { text: '返回主菜单', primary: true, callback: () => this.quitToMenu() }
        ]);
    }
}
