class UIManager {
    constructor(game) {
        this.game = game;
        this.currentPanel = 'map';
        this.selectedReportOrder = null;
        this.selectedReportReason = null;
        this.initEventListeners();
    }

    initEventListeners() {
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchPanel(tab.dataset.panel);
            });
        });
        document.getElementById('btn-pause').addEventListener('click', () => {
            this.game.togglePause();
        });
        document.getElementById('resume-btn').addEventListener('click', () => {
            this.game.togglePause();
        });
        document.getElementById('shop-btn').addEventListener('click', () => {
            this.showShop();
        });
        document.getElementById('close-shop').addEventListener('click', () => {
            this.hideShop();
        });
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.game.restart();
        });
        document.getElementById('quit-btn').addEventListener('click', () => {
            this.game.quitToMenu();
        });
        document.getElementById('btn-report').addEventListener('click', () => {
            this.showReportDialog();
        });
        document.getElementById('btn-appeal').addEventListener('click', () => {
            this.showAppealDialog();
        });
        document.getElementById('send-message').addEventListener('click', () => {
            this.sendMessage();
        });
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    switchPanel(panelName) {
        this.currentPanel = panelName;
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.panel === panelName);
        });
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${panelName}`);
        });
        this.updateCurrentPanel();
    }

    updateCurrentPanel() {
        if (!this.game.player || !this.game.orderManager) return;
        
        switch (this.currentPanel) {
            case 'map':
                this.updateMapPanel();
                break;
            case 'backpack':
                this.updateBackpack(this.game.player);
                break;
            case 'vehicle':
                this.updateVehicle(this.game.player);
                break;
            case 'stats':
                this.updateStats(this.game.player, this.game.orderManager);
                break;
        }
    }

    updateAllPanels() {
        if (!this.game.player || !this.game.orderManager) return;
        this.updatePlayerStats(this.game.player, this.game.getGameTimeString(), this.game.weather);
        this.updateOrders(this.game.orderManager);
        this.updateMessages(this.game.messages);
        this.updateCurrentPanel();
    }

    updateMapPanel() {
        const chapter = this.game.currentChapter;
        const player = this.game.player;
        const orderManager = this.game.orderManager;

        if (chapter) {
            const chapterInfo = document.getElementById('chapter-info');
            const weatherInfo = GameConfig.weatherTypes[chapter.weather];
            chapterInfo.innerHTML = `
                <h4>${chapter.icon} ${chapter.name}</h4>
                <p>${chapter.description}</p>
                <p style="margin-top: 8px;">
                    🌡️ 天气: ${weatherInfo.icon} ${weatherInfo.name} | 
                    🎯 目标: ${chapter.orderCount}单 | 
                    ⭐ 难度: ${'★'.repeat(chapter.difficulty)}
                </p>
            `;
        }

        const locationLegend = document.getElementById('location-legend');
        locationLegend.innerHTML = `
            <div class="legend-item">
                <span class="legend-icon">🍜</span>
                <span class="legend-text">餐厅/商家</span>
                <span class="legend-count">${GameConfig.restaurants.length}个</span>
            </div>
            <div class="legend-item">
                <span class="legend-icon">🏠</span>
                <span class="legend-text">配送地点</span>
                <span class="legend-count">${GameConfig.deliveryLocations.length}个</span>
            </div>
            <div class="legend-item">
                <span class="legend-icon">🔌</span>
                <span class="legend-text">充电站</span>
                <span class="legend-count">${GameConfig.chargeStations.length}个</span>
            </div>
            <div class="legend-item">
                <span class="legend-icon">🚦</span>
                <span class="legend-text">红绿灯路口</span>
                <span class="legend-count">${GameConfig.trafficLights.length}个</span>
            </div>
        `;

        const currentTargets = document.getElementById('current-targets');
        if (orderManager.activeOrders.length === 0) {
            currentTargets.innerHTML = '<p style="color: #888; font-size: 13px;">暂无进行中的订单</p>';
        } else {
            currentTargets.innerHTML = '';
            for (const order of orderManager.activeOrders) {
                const targetEl = document.createElement('div');
                const isPickup = order.status === 'accepted';
                const target = isPickup ? order.restaurant : order.deliveryLocation;
                const distance = Math.sqrt(Math.pow(target.x - player.x, 2) + Math.pow(target.y - player.y, 2));
                targetEl.className = `target-item ${isPickup ? 'pickup' : ''}`;
                targetEl.innerHTML = `
                    <div class="target-title">
                        ${isPickup ? '📍 取餐' : '🏠 送餐'}: ${target.name}
                    </div>
                    <div class="target-detail">
                        距离: ${Math.floor(distance)}m | 剩余: ${Math.floor(order.timeRemaining)}s
                        ${order.status === 'picked' ? ` | 温度: ${Math.floor(order.foodTemperature)}%` : ''}
                    </div>
                `;
                currentTargets.appendChild(targetEl);
            }
        }

        const routeHints = document.getElementById('route-hints');
        routeHints.innerHTML = '';
        
        if (orderManager.activeOrders.length > 0) {
            const nearestOrder = orderManager.activeOrders.reduce((nearest, order) => {
                const target = order.status === 'accepted' ? order.restaurant : order.deliveryLocation;
                const dist = Math.sqrt(Math.pow(target.x - player.x, 2) + Math.pow(target.y - player.y, 2));
                if (!nearest || dist < nearest.dist) {
                    return { order, dist };
                }
                return nearest;
            }, null);

            if (nearestOrder) {
                const target = nearestOrder.order.status === 'accepted' 
                    ? nearestOrder.order.restaurant 
                    : nearestOrder.order.deliveryLocation;
                const dx = target.x - player.x;
                const dy = target.y - player.y;
                let direction = '';
                if (Math.abs(dx) > Math.abs(dy)) {
                    direction = dx > 0 ? '向东' : '向西';
                } else {
                    direction = dy > 0 ? '向南' : '向北';
                }
                routeHints.innerHTML += `
                    <div class="route-hint">
                        <strong>最近目标:</strong> ${target.name}<br>
                        建议${direction}行驶，距离约${Math.floor(nearestOrder.dist)}米
                    </div>
                `;
            }
        }

        const lowBattery = player.battery < 30;
        const lowEnergy = player.energy < 30;
        if (lowBattery) {
            const nearestStation = GameConfig.chargeStations.reduce((nearest, station) => {
                const dist = Math.sqrt(Math.pow(station.x - player.x, 2) + Math.pow(station.y - player.y, 2));
                if (!nearest || dist < nearest.dist) {
                    return { station, dist };
                }
                return nearest;
            }, null);
            if (nearestStation) {
                routeHints.innerHTML += `
                    <div class="route-hint warning">
                        ⚠️ <strong>电量不足!</strong><br>
                        最近充电站: ${nearestStation.station.name} (${Math.floor(nearestStation.dist)}m)
                    </div>
                `;
            }
        }
        if (lowEnergy) {
            routeHints.innerHTML += `
                <div class="route-hint warning">
                    ⚠️ <strong>体力不足!</strong> 请使用背包中的补给品恢复体力
                </div>
            `;
        }

        if (routeHints.innerHTML === '') {
            routeHints.innerHTML = '<p style="color: #888; font-size: 13px;">在订单面板接单后，这里会显示路线提示</p>';
        }
    }

    updatePlayerStats(player, gameTime, weather) {
        document.getElementById('game-time').textContent = gameTime;
        document.getElementById('player-money').textContent = `¥${player.money}`;
        const energyPercent = (player.energy / player.maxEnergy) * 100;
        document.getElementById('energy-bar').style.width = `${energyPercent}%`;
        const batteryPercent = (player.battery / player.maxBattery) * 100;
        document.getElementById('battery-bar').style.width = `${batteryPercent}%`;
        const weatherInfo = GameConfig.weatherTypes[weather];
        document.getElementById('weather-icon').textContent = weatherInfo.icon;
        document.getElementById('weather-text').textContent = weatherInfo.name;
    }

    updateOrders(orderManager) {
        document.getElementById('active-order-count').textContent = orderManager.activeOrders.length;
        const currentOrdersEl = document.getElementById('current-orders');
        currentOrdersEl.innerHTML = '';
        for (const order of orderManager.activeOrders) {
            const card = this.createOrderCard(order, true);
            currentOrdersEl.appendChild(card);
        }
        const availableOrdersEl = document.getElementById('available-orders');
        availableOrdersEl.innerHTML = '';
        for (const order of orderManager.availableOrders) {
            const card = this.createOrderCard(order, false);
            availableOrdersEl.appendChild(card);
        }
    }

    createOrderCard(order, isActive) {
        const card = document.createElement('div');
        card.className = `order-card ${order.isUrgent ? 'urgent' : ''} ${isActive ? 'delivering' : ''} ${order.reported ? 'reported' : ''}`;
        const timeRemaining = Math.max(0, Math.floor(order.timeRemaining));
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        let statusText = '';
        if (isActive) {
            if (order.status === 'accepted') statusText = '待取餐';
            else if (order.status === 'picked') statusText = '配送中';
        }
        card.innerHTML = `
            <div class="order-header">
                <span class="order-restaurant">${order.restaurant.icon} ${order.restaurant.name}</span>
                <span class="order-price">¥${order.pay}${order.tip > 0 ? ` +¥${order.tip}` : ''}</span>
            </div>
            <div class="order-info">
                送往: ${order.deliveryLocation.name} (${order.deliveryLocation.floor}楼)
            </div>
            <div class="order-info">
                餐品: ${order.food}
            </div>
            ${order.note ? `<div class="order-info">备注: ${order.note}</div>` : ''}
            ${order.reported ? '<div class="order-info" style="color: #f59e0b;">⚠️ 已报备，平台处理中</div>' : ''}
            <div class="order-timer">
                ${statusText ? statusText + ' | ' : ''}剩余 ${minutes}:${seconds.toString().padStart(2, '0')}
                ${order.status === 'picked' ? ` | 温度: ${Math.floor(order.foodTemperature)}%` : ''}
            </div>
            <div class="order-actions">
                ${isActive ? `
                    ${order.status === 'accepted' ? `<button class="order-btn" data-action="pickup" data-id="${order.id}">取餐</button>` : ''}
                    ${order.status === 'picked' ? `<button class="order-btn" data-action="deliver" data-id="${order.id}">送达</button>` : ''}
                    <button class="order-btn cancel" data-action="cancel" data-id="${order.id}">取消</button>
                ` : `
                    <button class="order-btn" data-action="accept" data-id="${order.id}">接单</button>
                `}
            </div>
        `;
        card.querySelectorAll('.order-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                const orderId = parseInt(btn.dataset.id);
                this.handleOrderAction(action, orderId);
            });
        });
        return card;
    }

    handleOrderAction(action, orderId) {
        const game = this.game;
        switch (action) {
            case 'accept':
                game.acceptOrder(orderId);
                break;
            case 'pickup':
                game.pickupOrder(orderId);
                break;
            case 'deliver':
                game.showBuildingSelect(orderId);
                break;
            case 'cancel':
                this.showConfirmDialog('取消订单', '确定要取消这个订单吗？这会影响您的评分。', () => {
                    game.cancelOrder(orderId);
                });
                break;
        }
    }

    updateBackpack(player) {
        const backpackGrid = document.getElementById('backpack-grid');
        backpackGrid.innerHTML = '';
        for (let i = 0; i < 16; i++) {
            const slot = document.createElement('div');
            slot.className = `backpack-slot ${i >= player.backpack.length ? 'empty' : ''}`;
            if (player.backpack[i]) {
                slot.textContent = player.backpack[i].icon;
                slot.title = `${player.backpack[i].name}\n点击使用`;
                slot.addEventListener('click', () => {
                    this.useBackpackItem(i);
                });
            }
            backpackGrid.appendChild(slot);
        }
        const equipmentSlots = document.getElementById('equipment-slots');
        equipmentSlots.innerHTML = '';
        const slotNames = {
            box: '保温箱',
            battery: '电池',
            tire: '轮胎',
            light: '车灯',
            motor: '电机',
            helmet: '头盔'
        };
        const slotIcons = {
            box: '📦',
            battery: '🔋',
            tire: '🛞',
            light: '💡',
            motor: '⚙️',
            helmet: '🪖'
        };
        for (const [slot, item] of Object.entries(player.equipment)) {
            const slotEl = document.createElement('div');
            slotEl.className = 'equipment-slot';
            if (item) {
                slotEl.innerHTML = `
                    <div class="equipment-icon">${item.icon}</div>
                    <div class="equipment-info">
                        <div class="equipment-name">${item.name}</div>
                        <div class="equipment-stats">${Object.entries(item.stats).map(([k, v]) => `${k}: +${v}`).join(', ')}</div>
                    </div>
                `;
            } else {
                slotEl.innerHTML = `
                    <div class="equipment-icon">${slotIcons[slot]}</div>
                    <div class="equipment-info">
                        <div class="equipment-name">${slotNames[slot]}</div>
                        <div class="equipment-stats">未装备</div>
                    </div>
                `;
            }
            equipmentSlots.appendChild(slotEl);
        }
    }

    useBackpackItem(index) {
        const item = this.game.player.backpack[index];
        if (item && item.type === 'consumable') {
            if (this.game.player.useConsumable(item)) {
                this.game.player.removeFromBackpack(index);
                this.updateBackpack(this.game.player);
                this.showDialog('使用成功', `已使用 ${item.name}`);
            }
        }
    }

    updateVehicle(player) {
        const vehicleInfo = document.getElementById('vehicle-info');
        const durabilityColor = player.vehicleDurability > 50 ? '#22c55e' : player.vehicleDurability > 20 ? '#f59e0b' : '#ef4444';
        const speedPenalty = player.vehicleDurability < 30 ? ' (速度降低)' : player.vehicleDurability < 50 ? ' (轻微降速)' : '';
        vehicleInfo.innerHTML = `
            <div class="vehicle-name">🛵 电动摩托车</div>
            <div class="vehicle-stat">
                <span>耐久度${speedPenalty}</span>
                <span>${Math.floor(player.vehicleDurability)}%</span>
            </div>
            <div class="vehicle-stat-bar">
                <div class="vehicle-stat-fill" style="width: ${player.vehicleDurability}%; background: ${durabilityColor}"></div>
            </div>
            <div class="vehicle-stat">
                <span>电池电量</span>
                <span>${Math.floor(player.battery)}/${player.maxBattery}</span>
            </div>
            <div class="vehicle-stat-bar">
                <div class="vehicle-stat-fill" style="width: ${(player.battery / player.maxBattery) * 100}%; background: #3b82f6"></div>
            </div>
            <div class="vehicle-stat">
                <span>当前速度</span>
                <span>${player.speed.toFixed(1)} 格/秒</span>
            </div>
            <button class="repair-btn" id="repair-btn" ${player.vehicleDurability >= 100 ? 'disabled' : ''}>
                ${player.vehicleDurability >= 100 ? '车辆状态良好' : `维修车辆 (¥${Math.ceil((100 - player.vehicleDurability) * 0.5)})`}
            </button>
        `;
        
        const repairBtn = document.getElementById('repair-btn');
        if (repairBtn && !repairBtn.disabled) {
            repairBtn.addEventListener('click', () => {
                this.repairVehicle();
            });
        }

        const chargeStations = document.getElementById('charge-stations');
        chargeStations.innerHTML = '';
        for (const station of GameConfig.chargeStations) {
            const distance = Math.sqrt(Math.pow(station.x - player.x, 2) + Math.pow(station.y - player.y, 2));
            const inRange = distance <= 50;
            const canAfford = player.money >= station.price;
            const stationEl = document.createElement('div');
            stationEl.className = 'charge-station';
            stationEl.innerHTML = `
                <div>
                    <div>${station.name}</div>
                    <div style="font-size: 11px; color: #888;">
                        距离: ${Math.floor(distance)}m | ¥${station.price}/次
                        ${!inRange ? ' | ❌ 距离太远' : !canAfford ? ' | ❌ 余额不足' : ' | ✅ 可以充电'}
                    </div>
                </div>
                <button class="charge-btn" data-station="${station.id}" ${!inRange || !canAfford ? 'disabled' : ''}>
                    ${!inRange ? '距离远' : !canAfford ? '余额不足' : '充电'}
                </button>
            `;
            const btn = stationEl.querySelector('.charge-btn');
            if (!btn.disabled) {
                btn.addEventListener('click', () => {
                    this.chargeVehicle(station);
                });
            }
            chargeStations.appendChild(stationEl);
        }
    }

    chargeVehicle(station) {
        const player = this.game.player;
        const chargeAmount = 30 * station.speed;
        const cost = station.price;
        
        if (player.money < cost) {
            this.showDialog('余额不足', `需要 ¥${cost} 才能充电`);
            return;
        }
        
        const distance = Math.sqrt(Math.pow(station.x - player.x, 2) + Math.pow(station.y - player.y, 2));
        if (distance > 50) {
            this.showDialog('距离太远', `请先靠近充电站（当前距离: ${Math.floor(distance)}m）`);
            return;
        }
        
        if (player.battery >= player.maxBattery) {
            this.showDialog('电量已满', '电池已经是满电状态');
            return;
        }
        
        player.battery = Math.min(player.maxBattery, player.battery + chargeAmount);
        player.money -= cost;
        
        this.updateAllPanels();
        this.showDialog('充电完成', `已充电 +${Math.floor(chargeAmount)}，花费 ¥${cost}`);
    }

    repairVehicle() {
        const player = this.game.player;
        const repairCost = Math.ceil((100 - player.vehicleDurability) * 0.5);
        
        if (player.money < repairCost) {
            this.showDialog('余额不足', `维修需要 ¥${repairCost}`);
            return;
        }
        
        player.money -= repairCost;
        player.vehicleDurability = 100;
        
        this.updateAllPanels();
        this.showDialog('维修完成', `车辆已修复，花费 ¥${repairCost}`);
    }

    updateMessages(messages) {
        const messageList = document.getElementById('message-list');
        messageList.innerHTML = '';
        for (const msg of messages.slice(-20)) {
            const msgEl = document.createElement('div');
            msgEl.className = `message-item ${msg.type || 'system'}`;
            msgEl.innerHTML = `
                <div class="message-sender">${msg.sender}</div>
                <div class="message-text">${msg.content}</div>
                <div class="message-time">${msg.time}</div>
            `;
            messageList.appendChild(msgEl);
        }
        messageList.scrollTop = messageList.scrollHeight;
    }

    sendMessage() {
        const input = document.getElementById('message-input');
        const text = input.value.trim();
        if (text) {
            this.game.addPlayerMessage(text);
            input.value = '';
        }
    }

    updateStats(player, orderManager) {
        const statsSummary = document.getElementById('stats-summary');
        const totalOrders = player.stats.ordersCompleted + player.stats.ordersFailed;
        const completionRate = totalOrders > 0 ? Math.floor((player.stats.ordersCompleted / totalOrders) * 100) : 0;
        statsSummary.innerHTML = `
            <div class="stat-row">
                <span class="label">完成订单</span>
                <span class="value positive">${player.stats.ordersCompleted}</span>
            </div>
            <div class="stat-row">
                <span class="label">失败订单</span>
                <span class="value negative">${player.stats.ordersFailed}</span>
            </div>
            <div class="stat-row">
                <span class="label">完成率</span>
                <span class="value">${completionRate}%</span>
            </div>
            <div class="stat-row">
                <span class="label">配送收入</span>
                <span class="value positive">¥${player.stats.totalEarnings}</span>
            </div>
            <div class="stat-row">
                <span class="label">小费收入</span>
                <span class="value positive">¥${player.stats.totalTips}</span>
            </div>
            <div class="stat-row">
                <span class="label">总收入</span>
                <span class="value positive">¥${player.stats.totalEarnings + player.stats.totalTips}</span>
            </div>
            <div class="stat-row">
                <span class="label">行驶距离</span>
                <span class="value">${Math.floor(player.stats.distanceTraveled)}m</span>
            </div>
            <div class="stat-row">
                <span class="label">顾客满意度</span>
                <span class="value ${player.stats.satisfaction > 70 ? 'positive' : player.stats.satisfaction > 40 ? '' : 'negative'}">${Math.floor(player.stats.satisfaction)}%</span>
            </div>
            <div class="stat-row">
                <span class="label">差评数</span>
                <span class="value negative">${player.stats.badReviews}</span>
            </div>
            <div class="stat-row">
                <span class="label">当前余额</span>
                <span class="value positive">¥${player.money}</span>
            </div>
        `;
        const skillList = document.getElementById('skill-list');
        skillList.innerHTML = '';
        for (const skill of GameConfig.skills) {
            const level = player.skills[skill.id] || 1;
            const cost = (level + 1) * 50;
            const canUpgrade = level < skill.maxLevel && player.money >= cost;
            const skillEl = document.createElement('div');
            skillEl.className = 'skill-item';
            skillEl.innerHTML = `
                <div class="skill-icon">${skill.icon}</div>
                <div class="skill-info">
                    <div class="skill-name">${skill.name}</div>
                    <div class="skill-level">Lv.${level}/${skill.maxLevel}</div>
                    <div class="skill-desc">${skill.description}</div>
                </div>
                ${level < skill.maxLevel ? `
                    <button class="skill-upgrade" data-skill="${skill.id}" ${!canUpgrade ? 'disabled' : ''}>
                        ¥${cost}
                    </button>
                ` : '<span style="color: #22c55e; font-size: 12px;">已满级</span>'}
            `;
            const btn = skillEl.querySelector('.skill-upgrade');
            if (btn) {
                btn.addEventListener('click', () => {
                    if (player.upgradeSkill(skill.id)) {
                        this.updateStats(player, orderManager);
                        this.showDialog('升级成功', `${skill.name} 已升级到 Lv.${player.skills[skill.id]}`);
                    } else if (player.money < cost) {
                        this.showDialog('余额不足', `升级需要 ¥${cost}`);
                    }
                });
            }
            skillList.appendChild(skillEl);
        }
        const leaderboard = document.getElementById('leaderboard');
        const playerScore = player.stats.totalEarnings + player.stats.totalTips + player.stats.ordersCompleted * 100;
        const allScores = [...GameConfig.leaderboard, { rank: 0, name: '你', score: playerScore }];
        allScores.sort((a, b) => b.score - a.score);
        leaderboard.innerHTML = '';
        allScores.slice(0, 8).forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            const rank = index + 1;
            item.innerHTML = `
                <div class="leaderboard-rank rank-${rank <= 3 ? rank : ''}">${rank}</div>
                <div class="leaderboard-name">${entry.name}</div>
                <div class="leaderboard-score">${entry.score}</div>
            `;
            leaderboard.appendChild(item);
        });
    }

    updateChapterList(selectedChapter, unlockedChapters) {
        const chapterList = document.getElementById('chapter-list');
        chapterList.innerHTML = '';
        for (const chapter of GameConfig.chapters) {
            const isUnlocked = unlockedChapters.includes(chapter.id);
            const isSelected = selectedChapter === chapter.id;
            const chapterEl = document.createElement('div');
            chapterEl.className = `chapter-item ${isSelected ? 'selected' : ''} ${!isUnlocked ? 'locked' : ''}`;
            chapterEl.innerHTML = `
                <div class="chapter-icon">${isUnlocked ? chapter.icon : '🔒'}</div>
                <div class="chapter-name">${chapter.name}</div>
                <div class="chapter-desc">${isUnlocked ? chapter.description : '完成前一章节解锁'}</div>
            `;
            if (isUnlocked) {
                chapterEl.addEventListener('click', () => {
                    this.game.selectChapter(chapter.id);
                });
            }
            chapterList.appendChild(chapterEl);
        }
    }

    showDialog(title, message, buttons = [{ text: '确定', primary: true }]) {
        const dialog = document.getElementById('dialog-box');
        document.getElementById('dialog-title').textContent = title;
        document.getElementById('dialog-message').textContent = message;
        const buttonsEl = document.getElementById('dialog-buttons');
        buttonsEl.innerHTML = '';
        for (const btn of buttons) {
            const button = document.createElement('button');
            button.className = `dialog-btn ${btn.primary ? 'primary' : ''} ${btn.danger ? 'danger' : ''}`;
            button.textContent = btn.text;
            button.addEventListener('click', () => {
                dialog.classList.add('hidden');
                if (btn.callback) btn.callback();
            });
            buttonsEl.appendChild(button);
        }
        dialog.classList.remove('hidden');
    }

    showConfirmDialog(title, message, onConfirm) {
        this.showDialog(title, message, [
            { text: '取消' },
            { text: '确定', primary: true, callback: onConfirm }
        ]);
    }

    showReportDialog() {
        const activeOrders = this.game.orderManager.activeOrders;
        if (activeOrders.length === 0) {
            this.showDialog('异常报备', '当前没有进行中的订单，无法报备');
            return;
        }
        
        this.selectedReportOrder = null;
        this.selectedReportReason = null;
        
        const reasons = ['商家出餐慢', '顾客联系不上', '地址错误', '道路拥堵', '天气原因', '车辆故障'];
        
        let content = '<div style="margin-bottom: 15px;"><strong>选择要报备的订单：</strong></div>';
        for (const order of activeOrders) {
            content += `
                <div class="report-dialog-order" data-order-id="${order.id}">
                    #${order.id}: ${order.restaurant.name} → ${order.deliveryLocation.name}
                </div>
            `;
        }
        content += '<div style="margin: 15px 0 10px;"><strong>选择报备原因：</strong></div>';
        for (const reason of reasons) {
            content += `<span class="report-dialog-reason" data-reason="${reason}">${reason}</span>`;
        }
        
        const dialog = document.getElementById('dialog-box');
        document.getElementById('dialog-title').textContent = '异常报备';
        document.getElementById('dialog-message').innerHTML = content;
        
        const buttonsEl = document.getElementById('dialog-buttons');
        buttonsEl.innerHTML = '';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'dialog-btn';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => {
            dialog.classList.add('hidden');
        });
        buttonsEl.appendChild(cancelBtn);
        
        const submitBtn = document.createElement('button');
        submitBtn.className = 'dialog-btn primary';
        submitBtn.textContent = '提交报备';
        submitBtn.addEventListener('click', () => {
            if (this.selectedReportOrder && this.selectedReportReason) {
                this.game.submitReport(this.selectedReportOrder, this.selectedReportReason);
                dialog.classList.add('hidden');
            } else {
                this.showDialog('提示', '请选择订单和报备原因');
            }
        });
        buttonsEl.appendChild(submitBtn);
        
        dialog.classList.remove('hidden');
        
        setTimeout(() => {
            document.querySelectorAll('.report-dialog-order').forEach(el => {
                el.addEventListener('click', () => {
                    document.querySelectorAll('.report-dialog-order').forEach(e => e.classList.remove('selected'));
                    el.classList.add('selected');
                    this.selectedReportOrder = parseInt(el.dataset.orderId);
                });
            });
            document.querySelectorAll('.report-dialog-reason').forEach(el => {
                el.addEventListener('click', () => {
                    document.querySelectorAll('.report-dialog-reason').forEach(e => e.classList.remove('selected'));
                    el.classList.add('selected');
                    this.selectedReportReason = el.dataset.reason;
                });
            });
        }, 50);
    }

    showAppealDialog() {
        const badReviews = this.game.player.stats.badReviews;
        if (badReviews === 0) {
            this.showDialog('差评申诉', '您当前没有差评记录');
            return;
        }
        this.showDialog('差评申诉', `您有 ${badReviews} 条差评记录。\n\n申诉需要消耗50元，成功率50%`, [
            { text: '取消' },
            { text: '提交申诉 (¥50)', primary: true, callback: () => {
                if (this.game.player.money >= 50) {
                    this.game.player.money -= 50;
                    if (Math.random() > 0.5) {
                        this.game.player.stats.badReviews = Math.max(0, this.game.player.stats.badReviews - 1);
                        this.game.player.stats.satisfaction = Math.min(100, this.game.player.stats.satisfaction + 10);
                        this.updateAllPanels();
                        this.showDialog('申诉成功', '申诉成功！差评已撤销，满意度恢复');
                    } else {
                        this.showDialog('申诉失败', '申诉失败，请提供更多证据');
                    }
                } else {
                    this.showDialog('余额不足', '您的余额不足以申诉');
                }
            }}
        ]);
    }

    showBuildingSelectDialog(order, onComplete) {
        const location = order.deliveryLocation;
        const maxFloor = location.floor || 6;
        const correctFloor = Math.ceil(maxFloor * 0.5) + Math.floor(Math.random() * Math.ceil(maxFloor * 0.5));
        const units = ['1单元', '2单元', '3单元'];
        const correctUnit = units[Math.floor(Math.random() * units.length)];
        
        let selectedFloor = null;
        let selectedUnit = null;
        
        const content = `
            <div class="building-select-dialog">
                <p><strong>${location.name}</strong></p>
                <p style="font-size: 13px; color: #aaa;">请选择正确的单元和楼层进行配送</p>
                
                <div>
                    <p style="margin: 10px 0 5px;">选择单元：</p>
                    <div class="unit-select">
                        ${units.map(u => `<button class="unit-btn" data-unit="${u}">${u}</button>`).join('')}
                    </div>
                </div>
                
                <div>
                    <p style="margin: 10px 0 5px;">选择楼层：</p>
                    <div class="floor-grid">
                        ${Array.from({length: maxFloor}, (_, i) => i + 1).map(f => 
                            `<button class="floor-btn" data-floor="${f}">${f}楼</button>`
                        ).join('')}
                    </div>
                </div>
                
                <p style="font-size: 11px; color: #f59e0b; margin-top: 10px;">
                    ⚠️ 选错会消耗额外时间并可能影响满意度
                </p>
            </div>
        `;
        
        const dialog = document.getElementById('dialog-box');
        document.getElementById('dialog-title').textContent = '楼栋选择';
        document.getElementById('dialog-message').innerHTML = content;
        
        const buttonsEl = document.getElementById('dialog-buttons');
        buttonsEl.innerHTML = '';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'dialog-btn';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => {
            dialog.classList.add('hidden');
        });
        buttonsEl.appendChild(cancelBtn);
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'dialog-btn primary';
        confirmBtn.textContent = '确认送达';
        confirmBtn.addEventListener('click', () => {
            if (selectedFloor && selectedUnit) {
                dialog.classList.add('hidden');
                
                const isCorrect = selectedFloor === correctFloor && selectedUnit === correctUnit;
                const isPartial = selectedFloor === correctFloor || selectedUnit === correctUnit;
                
                if (isCorrect) {
                    onComplete({ success: true, timePenalty: 0, satisfactionPenalty: 0 });
                } else if (isPartial) {
                    onComplete({ success: true, timePenalty: 30, satisfactionPenalty: 5 });
                } else {
                    onComplete({ success: true, timePenalty: 60, satisfactionPenalty: 15 });
                }
            }
        });
        buttonsEl.appendChild(confirmBtn);
        
        dialog.classList.remove('hidden');
        
        setTimeout(() => {
            document.querySelectorAll('.unit-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedUnit = btn.dataset.unit;
                });
            });
            document.querySelectorAll('.floor-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.floor-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedFloor = parseInt(btn.dataset.floor);
                });
            });
        }, 50);
    }

    showShop() {
        document.getElementById('pause-screen').classList.remove('active');
        document.getElementById('shop-screen').classList.add('active');
        this.renderShop();
    }

    hideShop() {
        document.getElementById('shop-screen').classList.remove('active');
        document.getElementById('pause-screen').classList.add('active');
    }

    renderShop() {
        const shopItems = document.getElementById('shop-items');
        shopItems.innerHTML = '';
        for (const item of GameConfig.shopItems) {
            const canAfford = this.game.player.money >= item.price;
            const itemEl = document.createElement('div');
            itemEl.className = 'shop-item';
            itemEl.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-desc">${Object.entries(item.stats).map(([k, v]) => `${k}: +${v}`).join(', ')}</div>
                <div class="shop-item-price">¥${item.price}</div>
                <button class="shop-item-btn" data-item="${item.id}" ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? '购买' : '余额不足'}
                </button>
            `;
            const btn = itemEl.querySelector('.shop-item-btn');
            if (!btn.disabled) {
                btn.addEventListener('click', () => {
                    this.buyItem(item);
                });
            }
            shopItems.appendChild(itemEl);
        }
    }

    buyItem(item) {
        const player = this.game.player;
        if (player.money >= item.price) {
            if (item.type === 'equipment') {
                player.equipItem(item);
                player.money -= item.price;
                this.showDialog('购买成功', `已装备 ${item.name}`);
            } else {
                if (player.addToBackpack(item)) {
                    player.money -= item.price;
                    this.showDialog('购买成功', `${item.name} 已放入背包`);
                } else {
                    this.showDialog('背包已满', '请先清理背包空间');
                    return;
                }
            }
            this.renderShop();
            this.updateAllPanels();
        }
    }
}
