class UIManager {
    constructor(game) {
        this.game = game;
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
        document.querySelectorAll('.panel-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.panel === panelName);
        });
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${panelName}`);
        });
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
        card.className = `order-card ${order.isUrgent ? 'urgent' : ''} ${isActive ? 'delivering' : ''}`;
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
                送往: ${order.deliveryLocation.name}
            </div>
            <div class="order-info">
                餐品: ${order.food}
            </div>
            ${order.note ? `<div class="order-info">备注: ${order.note}</div>` : ''}
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
                game.deliverOrder(orderId);
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
                slot.title = player.backpack[i].name;
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
            }
        }
    }

    updateVehicle(player) {
        const vehicleInfo = document.getElementById('vehicle-info');
        vehicleInfo.innerHTML = `
            <div class="vehicle-name">🛵 电动摩托车</div>
            <div class="vehicle-stat">
                <span>耐久度</span>
                <span>${Math.floor(player.vehicleDurability)}%</span>
            </div>
            <div class="vehicle-stat-bar">
                <div class="vehicle-stat-fill" style="width: ${player.vehicleDurability}%; background: ${player.vehicleDurability > 50 ? '#22c55e' : player.vehicleDurability > 20 ? '#f59e0b' : '#ef4444'}"></div>
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
        `;
        const chargeStations = document.getElementById('charge-stations');
        chargeStations.innerHTML = '';
        for (const station of GameConfig.chargeStations) {
            const distance = Math.sqrt(Math.pow(station.x - player.x, 2) + Math.pow(station.y - player.y, 2));
            const stationEl = document.createElement('div');
            stationEl.className = 'charge-station';
            stationEl.innerHTML = `
                <div>
                    <div>${station.name}</div>
                    <div style="font-size: 11px; color: #888;">距离: ${Math.floor(distance)}m | ¥${station.price}/次</div>
                </div>
                <button class="charge-btn" data-station="${station.id}" ${distance > 50 ? 'disabled' : ''}>充电</button>
            `;
            const btn = stationEl.querySelector('.charge-btn');
            if (!btn.disabled) {
                btn.addEventListener('click', () => {
                    if (player.charge(30 * station.speed, station.price)) {
                        this.showDialog('充电完成', `已为车辆充电，花费 ¥${station.price}`);
                    } else {
                        this.showDialog('余额不足', '您的余额不足以充电');
                    }
                });
            }
            chargeStations.appendChild(stationEl);
        }
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
            this.showDialog('异常报备', '当前没有进行中的订单');
            return;
        }
        const reasons = ['商家出餐慢', '顾客联系不上', '地址错误', '道路拥堵', '天气原因', '车辆故障'];
        let message = '选择报备的订单和原因：\n\n';
        for (const order of activeOrders) {
            message += `${order.id}: ${order.restaurant.name} -> ${order.deliveryLocation.name}\n`;
        }
        this.showDialog('异常报备', '请选择要报备的订单（功能演示）', [
            { text: '取消' },
            { text: '提交报备', primary: true, callback: () => {
                this.game.addSystemMessage('系统', '报备已提交，平台会尽快处理');
            }}
        ]);
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
        }
    }
}
