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
        const features = this.game.chapterFeatures || GameConfig.chapterFeatures[1];

        if (chapter) {
            const chapterInfo = document.getElementById('chapter-info');
            const weatherInfo = GameConfig.weatherTypes[chapter.weather];
            let featureText = '';
            if (features.elevatorWait > 10) featureText += ' | 🛗 电梯等待时间长';
            if (features.urgentRate > 0.2) featureText += ' | ⚡ 急单较多';
            if (features.energyMultiplier > 1.2) featureText += ' | 💪 体力消耗大';
            if (features.visionMultiplier < 0.8) featureText += ' | 👁️ 视野受限';
            
            chapterInfo.innerHTML = `
                <h4>${chapter.icon} ${chapter.name}</h4>
                <p>${chapter.description}</p>
                <p style="margin-top: 8px;">
                    🌡️ 天气: ${weatherInfo.icon} ${weatherInfo.name} | 
                    🎯 目标: ${chapter.orderCount}单 | 
                    ⭐ 难度: ${'★'.repeat(chapter.difficulty)}
                    ${featureText}
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
            
            let priorityOrder = null;
            if (player.priorityOrderId) {
                priorityOrder = orderManager.activeOrders.find(o => o.id === player.priorityOrderId);
            }
            
            if (priorityOrder) {
                const isPickup = priorityOrder.status === 'accepted';
                const target = isPickup ? priorityOrder.restaurant : priorityOrder.deliveryLocation;
                const routeInfo = orderManager.getOrderRouteInfo(priorityOrder, player);
                const targetEl = document.createElement('div');
                targetEl.className = 'target-item priority-target';
                targetEl.innerHTML = `
                    <div class="target-title">
                        ⭐ <strong>优先目标</strong>: ${isPickup ? '取餐' : '送餐'} - ${target.name}
                    </div>
                    <div class="target-detail">
                        📏 距离: ${routeInfo.distance}m | ⏱️ 预计: ${routeInfo.estimatedTime}s
                    </div>
                    <div class="target-detail">
                        🚦 红绿灯: ${routeInfo.trafficLights}个 | 🔌 最近充电站: ${routeInfo.nearestStation.name} (${routeInfo.stationDistance}m)
                    </div>
                    <div class="target-detail">
                        ⏰ 剩余时间: ${Math.floor(priorityOrder.timeRemaining)}s
                        ${priorityOrder.isUrgent ? ' | <span style="color: #ef4444;">⚠️ 急单</span>' : ''}
                    </div>
                `;
                currentTargets.appendChild(targetEl);
            }
            
            for (const order of orderManager.activeOrders) {
                if (order.id === player.priorityOrderId) continue;
                
                const targetEl = document.createElement('div');
                const isPickup = order.status === 'accepted';
                const target = isPickup ? order.restaurant : order.deliveryLocation;
                const routeInfo = orderManager.getOrderRouteInfo(order, player);
                targetEl.className = `target-item ${isPickup ? 'pickup' : ''}`;
                targetEl.innerHTML = `
                    <div class="target-title">
                        ${isPickup ? '📍 取餐' : '🏠 送餐'}: ${target.name}
                        ${order.isUrgent ? ' <span style="color: #ef4444;">(急)</span>' : ''}
                    </div>
                    <div class="target-detail">
                        距离: ${routeInfo.distance}m | 剩余: ${Math.floor(order.timeRemaining)}s
                        ${order.status === 'picked' ? ` | 温度: ${Math.floor(order.foodTemperature)}%` : ''}
                    </div>
                `;
                currentTargets.appendChild(targetEl);
            }
        }

        const routeHints = document.getElementById('route-hints');
        routeHints.innerHTML = '';
        
        if (orderManager.activeOrders.length > 0) {
            let targetOrder = null;
            if (player.priorityOrderId) {
                targetOrder = orderManager.activeOrders.find(o => o.id === player.priorityOrderId);
            }
            
            if (!targetOrder) {
                targetOrder = orderManager.activeOrders.reduce((nearest, order) => {
                    const target = order.status === 'accepted' ? order.restaurant : order.deliveryLocation;
                    const dist = Math.sqrt(Math.pow(target.x - player.x, 2) + Math.pow(target.y - player.y, 2));
                    if (!nearest || dist < nearest.dist) {
                        return { order, dist };
                    }
                    return nearest;
                }, null)?.order;
            }

            if (targetOrder) {
                const target = targetOrder.status === 'accepted' 
                    ? targetOrder.restaurant 
                    : targetOrder.deliveryLocation;
                const routeInfo = orderManager.getOrderRouteInfo(targetOrder, player);
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
                        <strong>${player.priorityOrderId ? '⭐ 优先路线' : '建议路线'}:</strong> ${target.name}<br>
                        建议${direction}行驶，距离约${routeInfo.distance}米，预计${routeInfo.estimatedTime}秒<br>
                        沿途约${routeInfo.trafficLights}个红绿灯
                    </div>
                `;
            }
            
            if (orderManager.activeOrders.length > 1) {
                routeHints.innerHTML += `
                    <div class="route-hint" style="background: rgba(74, 158, 255, 0.1);">
                        💡 <strong>提示:</strong> 在订单面板点击"设优先"可切换优先目标
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
        
        if (player.activeEvent) {
            routeHints.innerHTML += `
                <div class="route-hint warning">
                    ⚠️ <strong>${player.activeEvent.name}!</strong> 车辆状态异常，请小心驾驶
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
        const isPriority = this.game.player.priorityOrderId === order.id;
        card.className = `order-card ${order.isUrgent ? 'urgent' : ''} ${isActive ? 'delivering' : ''} ${order.reported ? 'reported' : ''} ${order.isChainOrder ? 'chain-order' : ''} ${isPriority ? 'priority' : ''}`;
        const timeRemaining = Math.max(0, Math.floor(order.timeRemaining));
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        let statusText = '';
        if (isActive) {
            if (order.status === 'accepted') statusText = '待取餐';
            else if (order.status === 'picked') statusText = '配送中';
        }
        
        let routeInfo = '';
        if (isActive && this.game.player) {
            const info = this.game.orderManager.getOrderRouteInfo(order, this.game.player);
            routeInfo = `
                <div class="order-info route-info">
                    📏 ${info.distance}m | ⏱️ 约${info.estimatedTime}s | 🚦 ${info.trafficLights}个红绿灯
                </div>
            `;
        }
        
        let chainTag = '';
        if (order.isChainOrder) {
            const convenience = order.detourDistance < 50 ? '🔥 超顺路' : order.detourDistance < 100 ? '✅ 顺路' : '➡️ 较顺路';
            chainTag = `<div class="order-info chain-tag">${convenience} | 绕行${order.detourDistance}m | 连单奖励</div>`;
        }
        
        let addressInfo = '';
        if (order.deliveryDetails) {
            addressInfo = `<div class="order-info address-info">📍 ${order.deliveryDetails.fullAddress}</div>`;
        }
        
        card.innerHTML = `
            <div class="order-header">
                <span class="order-restaurant">${order.restaurant.icon} ${order.restaurant.name}</span>
                <span class="order-price">¥${order.pay}${order.tip > 0 ? ` +¥${order.tip}` : ''}</span>
            </div>
            ${addressInfo}
            <div class="order-info">
                送往: ${order.deliveryLocation.name} (${order.deliveryLocation.floor}楼)
            </div>
            <div class="order-info">
                餐品: ${order.food}
            </div>
            ${order.note ? `<div class="order-info">备注: ${order.note}</div>` : ''}
            ${chainTag}
            ${routeInfo}
            ${order.reported ? '<div class="order-info" style="color: #f59e0b;">⚠️ 已报备，平台处理中</div>' : ''}
            ${order.leaveAtDoor ? '<div class="order-info" style="color: #22c55e;">🚪 顾客要求放门口</div>' : ''}
            <div class="order-timer">
                ${statusText ? statusText + ' | ' : ''}剩余 ${minutes}:${seconds.toString().padStart(2, '0')}
                ${order.status === 'picked' ? ` | 温度: ${Math.floor(order.foodTemperature)}%` : ''}
            </div>
            <div class="order-actions">
                ${isActive ? `
                    <button class="order-btn priority-btn" data-action="priority" data-id="${order.id}" ${isPriority ? 'disabled' : ''}>
                        ${isPriority ? '⭐ 优先' : '设优先'}
                    </button>
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
            case 'priority':
                game.setPriorityOrder(orderId);
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
        const speedPenalty = player.vehicleDurability < 30 ? ' (速度大幅降低)' : player.vehicleDurability < 50 ? ' (轻微降速)' : player.vehicleDurability < 80 ? ' (效率略降)' : '';
        
        let eventStatus = '';
        if (player.activeEvent) {
            const remaining = Math.max(0, Math.ceil((player.eventEndTime - Date.now()) / 1000));
            eventStatus = `<div class="vehicle-event">⚠️ ${player.activeEvent.name}中... 剩余${remaining}秒</div>`;
        }
        
        vehicleInfo.innerHTML = `
            <div class="vehicle-name">🛵 电动摩托车</div>
            ${eventStatus}
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
            <div class="vehicle-stat">
                <span>维修记录</span>
                <span>${player.stats.repairsMade}次</span>
            </div>
            <div class="vehicle-stat">
                <span>充电记录</span>
                <span>${player.stats.chargesMade}次</span>
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
        player.stats.chargesMade++;
        
        for (const order of this.game.orderManager.activeOrders) {
            order.record.charged = true;
        }
        
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
        player.stats.repairsMade++;
        player.activeEvent = null;
        player.eventEndTime = 0;
        player.calculateEffectiveSpeed();
        
        for (const order of this.game.orderManager.activeOrders) {
            order.record.repaired = true;
        }
        
        this.updateAllPanels();
        this.showDialog('维修完成', `车辆已修复，异常状态已清除，花费 ¥${repairCost}`);
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
        const details = order.deliveryDetails || { unit: '1单元', floor: 3, room: '301' };
        const maxFloor = location.floor || 6;
        const correctFloor = details.floor;
        const correctUnit = details.unit;
        
        let selectedFloor = null;
        let selectedUnit = null;
        let attempts = 0;
        let isOpen = true;
        
        const renderContent = () => `
            <div class="building-select-dialog">
                <p><strong>${location.name}</strong></p>
                <p style="font-size: 13px; color: #4a9eff; margin-bottom: 10px;">
                    📍 目标地址：${details.fullAddress}
                </p>
                <p style="font-size: 13px; color: #aaa;">请选择正确的单元和楼层进行配送</p>
                
                ${attempts > 0 ? `<p style="font-size: 12px; color: #ef4444;">❌ 上次选错了，请重新选择（已尝试 ${attempts} 次）</p>` : ''}
                
                <div>
                    <p style="margin: 10px 0 5px;">选择单元：</p>
                    <div class="unit-select">
                        ${['1单元', '2单元', '3单元'].map(u => 
                            `<button class="unit-btn" data-unit="${u}" ${selectedUnit === u ? 'class="selected"' : ''}>${u}</button>`
                        ).join('')}
                    </div>
                </div>
                
                <div>
                    <p style="margin: 10px 0 5px;">选择楼层：</p>
                    <div class="floor-grid">
                        ${Array.from({length: maxFloor}, (_, i) => i + 1).map(f => 
                            `<button class="floor-btn" data-floor="${f}" ${selectedFloor === f ? 'class="selected"' : ''}>${f}楼</button>`
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
        
        const updateContent = () => {
            if (!isOpen) return;
            document.getElementById('dialog-message').innerHTML = renderContent();
            
            setTimeout(() => {
                if (!isOpen) return;
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
                
                if (selectedUnit) {
                    const unitBtn = document.querySelector(`.unit-btn[data-unit="${selectedUnit}"]`);
                    if (unitBtn) unitBtn.classList.add('selected');
                }
                if (selectedFloor) {
                    const floorBtn = document.querySelector(`.floor-btn[data-floor="${selectedFloor}"]`);
                    if (floorBtn) floorBtn.classList.add('selected');
                }
            }, 50);
        };
        
        updateContent();
        
        const buttonsEl = document.getElementById('dialog-buttons');
        buttonsEl.innerHTML = '';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'dialog-btn';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => {
            isOpen = false;
            dialog.classList.add('hidden');
            onComplete({ success: false, cancelled: true });
        });
        buttonsEl.appendChild(cancelBtn);
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'dialog-btn primary';
        confirmBtn.textContent = '确认送达';
        confirmBtn.addEventListener('click', () => {
            if (selectedFloor && selectedUnit) {
                const isCorrect = selectedFloor === correctFloor && selectedUnit === correctUnit;
                
                if (isCorrect) {
                    isOpen = false;
                    dialog.classList.add('hidden');
                    onComplete({ 
                        success: true, 
                        timePenalty: attempts * 20, 
                        satisfactionPenalty: attempts * 3 
                    });
                } else {
                    attempts++;
                    
                    if (attempts >= 3) {
                        const oldOnComplete = onComplete;
                        this.showDialog('提示', '多次选错，建议仔细核对地址信息。点击确定后继续选择。', [
                            { text: '确定', primary: true, callback: () => {
                                selectedFloor = null;
                                selectedUnit = null;
                                updateContent();
                            }}
                        ]);
                    } else {
                        selectedFloor = null;
                        selectedUnit = null;
                        updateContent();
                    }
                }
            }
        });
        buttonsEl.appendChild(confirmBtn);
        
        dialog.classList.remove('hidden');
    }
    
    showCustomerInteractionDialog(order, interaction, messageContent) {
        const content = `
            <div class="customer-interaction-dialog">
                <p style="margin-bottom: 10px;">
                    <strong>顾客-${order.customerName}</strong> (订单 #${order.id})
                </p>
                <p style="background: rgba(245, 158, 11, 0.1); padding: 10px; border-radius: 6px; margin-bottom: 15px;">
                    "${messageContent}"
                </p>
                <p style="font-size: 13px; color: #aaa; margin-bottom: 10px;">请选择回复：</p>
                <div class="response-options">
                    ${interaction.responses.map((r, i) => `
                        <button class="response-btn" data-index="${i}">
                            ${r.text}
                            ${r.effect.time > 0 ? `<span class="effect positive">+${r.effect.time}s</span>` : ''}
                            ${r.effect.time < 0 ? `<span class="effect negative">${r.effect.time}s</span>` : ''}
                            ${r.effect.satisfaction > 0 ? `<span class="effect positive">+${r.effect.satisfaction}满意度</span>` : ''}
                            ${r.effect.satisfaction < 0 ? `<span class="effect negative">${r.effect.satisfaction}满意度</span>` : ''}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        const dialog = document.getElementById('dialog-box');
        document.getElementById('dialog-title').textContent = '顾客消息';
        document.getElementById('dialog-message').innerHTML = content;
        
        const buttonsEl = document.getElementById('dialog-buttons');
        buttonsEl.innerHTML = '';
        
        dialog.classList.remove('hidden');
        
        setTimeout(() => {
            document.querySelectorAll('.response-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    dialog.classList.add('hidden');
                    this.game.handleCustomerResponse(order.id, index);
                });
            });
        }, 50);
    }
    
    showShiftReview(summary, completedOrders, finalScore, buttons) {
        let orderDetails = '';
        if (completedOrders && completedOrders.length > 0) {
            orderDetails = '<div style="margin-top: 15px; max-height: 250px; overflow-y: auto;">';
            orderDetails += '<p style="font-weight: bold; margin-bottom: 8px;">📋 每单详情：</p>';
            for (const order of completedOrders) {
                const record = order.record || {};
                const tags = [];
                const effects = [];
                
                if (record.onTime) {
                    tags.push('<span class="tag positive">准时</span>');
                    effects.push('+50分');
                } else {
                    tags.push('<span class="tag negative">超时</span>');
                    effects.push('-50分');
                }
                if (record.redLightRun) {
                    tags.push('<span class="tag negative">闯红灯</span>');
                    effects.push('-100分');
                }
                if (record.reported) {
                    tags.push('<span class="tag warning">已报备</span>');
                    effects.push('-30分');
                }
                if (record.wrongBuilding) {
                    tags.push('<span class="tag negative">找错楼</span>');
                    effects.push('-50分');
                }
                if (record.charged) {
                    tags.push('<span class="tag info">途中充电</span>');
                }
                if (record.repaired) {
                    tags.push('<span class="tag info">途中维修</span>');
                }
                if (record.chainBonus > 0) {
                    tags.push('<span class="tag positive">连单+¥' + record.chainBonus + '</span>');
                }
                if (record.customerInteraction) {
                    tags.push('<span class="tag info">顾客沟通</span>');
                }
                
                orderDetails += `
                    <div style="padding: 10px; background: rgba(255,255,255,0.05); border-radius: 6px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                            <span style="font-weight: 500;">#${order.id} ${order.restaurant.name} → ${order.deliveryLocation.name}</span>
                            <span style="color: #22c55e;">¥${order.finalPay || order.pay}</span>
                        </div>
                        <div style="margin-bottom: 4px;">${tags.join(' ')}</div>
                        ${record.customerInteraction ? `
                            <div style="font-size: 11px; color: #aaa; margin-top: 4px;">
                                💬 ${record.customerInteraction.type}: "${record.customerInteraction.response}"
                            </div>
                        ` : ''}
                    </div>
                `;
            }
            orderDetails += '</div>';
        }
        
        const content = `
            <div class="shift-review-dialog">
                <pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.8;">${summary}</pre>
                ${orderDetails}
            </div>
        `;
        
        const dialog = document.getElementById('dialog-box');
        document.getElementById('dialog-title').textContent = '班次复盘';
        document.getElementById('dialog-message').innerHTML = content;
        
        const buttonsEl = document.getElementById('dialog-buttons');
        buttonsEl.innerHTML = '';
        
        for (const btn of buttons) {
            const button = document.createElement('button');
            button.className = `dialog-btn ${btn.primary ? 'primary' : ''}`;
            button.textContent = btn.text;
            button.addEventListener('click', () => {
                dialog.classList.add('hidden');
                if (btn.callback) btn.callback();
            });
            buttonsEl.appendChild(button);
        }
        
        dialog.classList.remove('hidden');
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
