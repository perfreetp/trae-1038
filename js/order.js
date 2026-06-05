class OrderManager {
    constructor() {
        this.activeOrders = [];
        this.availableOrders = [];
        this.completedOrders = [];
        this.orderIdCounter = 0;
    }

    generateOrder(chapter) {
        const restaurant = GameConfig.restaurants[Math.floor(Math.random() * GameConfig.restaurants.length)];
        let deliveryLocation;
        do {
            deliveryLocation = GameConfig.deliveryLocations[Math.floor(Math.random() * GameConfig.deliveryLocations.length)];
        } while (deliveryLocation.x === restaurant.x && deliveryLocation.y === restaurant.y);
        const distance = Math.sqrt(Math.pow(deliveryLocation.x - restaurant.x, 2) + Math.pow(deliveryLocation.y - restaurant.y, 2));
        const basePay = chapter.basePay || 10;
        const distanceBonus = Math.floor(distance / 50);
        const difficultyMultiplier = chapter.difficulty || 1;
        const pay = Math.floor((basePay + distanceBonus) * difficultyMultiplier);
        const timeLimit = GameConfig.gameSettings.orderTimeLimit + Math.floor(distance / 30);
        const foodTypes = ['招牌菜', '套餐', '饮品', '甜点', '小吃'];
        const food = foodTypes[Math.floor(Math.random() * foodTypes.length)];
        const order = {
            id: ++this.orderIdCounter,
            restaurant: restaurant,
            deliveryLocation: deliveryLocation,
            food: food,
            pay: pay,
            tip: Math.random() < (GameConfig.gameSettings.tipChance + (chapter.difficulty || 1) * 0.05) ? Math.floor(pay * 0.3) : 0,
            timeLimit: timeLimit,
            timeRemaining: timeLimit,
            foodTemperature: 100,
            status: 'available',
            isUrgent: Math.random() < 0.2,
            customerName: this.generateCustomerName(),
            note: this.generateOrderNote(),
            createdAt: Date.now()
        };
        return order;
    }

    generateCustomerName() {
        const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
        const names = ['先生', '女士', '小姐', '同学', '老师', '师傅'];
        return surnames[Math.floor(Math.random() * surnames.length)] + names[Math.floor(Math.random() * names.length)];
    }

    generateOrderNote() {
        const notes = [
            '',
            '请放在门口，谢谢',
            '不要辣，谢谢',
            '多放餐具',
            '赶时间，麻烦快点',
            '到了打电话',
            '东西易碎，小心点',
            '可以帮忙带瓶水吗？'
        ];
        return notes[Math.floor(Math.random() * notes.length)];
    }

    generateAvailableOrders(chapter, count = 3) {
        while (this.availableOrders.length < count) {
            const order = this.generateOrder(chapter);
            this.availableOrders.push(order);
        }
    }

    acceptOrder(orderId, player) {
        if (player.activeOrders && player.activeOrders.length >= GameConfig.gameSettings.maxActiveOrders) {
            return { success: false, message: '当前订单已满，请先完成已有订单' };
        }
        const index = this.availableOrders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            const order = this.availableOrders.splice(index, 1)[0];
            order.status = 'accepted';
            order.acceptedAt = Date.now();
            this.activeOrders.push(order);
            return { success: true, order: order };
        }
        return { success: false, message: '订单不存在' };
    }

    pickupOrder(orderId) {
        const order = this.activeOrders.find(o => o.id === orderId);
        if (order && order.status === 'accepted') {
            order.status = 'picked';
            order.pickedAt = Date.now();
            return { success: true, order: order };
        }
        return { success: false, message: '无法取餐' };
    }

    deliverOrder(orderId, player) {
        const order = this.activeOrders.find(o => o.id === orderId);
        if (order && order.status === 'picked') {
            const timeRatio = order.timeRemaining / order.timeLimit;
            const tempRatio = order.foodTemperature / 100;
            let finalPay = order.pay;
            let tip = order.tip;
            let satisfaction = GameConfig.gameSettings.baseSatisfaction;
            if (timeRatio > 0.5) {
                finalPay *= (1 + GameConfig.gameSettings.earlyBonus);
                satisfaction += 10;
            } else if (timeRatio <= 0) {
                finalPay *= (1 - GameConfig.gameSettings.overTimePenalty);
                satisfaction -= 30;
                tip = 0;
            }
            if (tempRatio < 0.5) {
                satisfaction -= 20;
                tip = Math.floor(tip * 0.5);
            }
            const insulationSkill = player.getSkillEffect(3);
            const insulationEquip = player.equipment.box ? player.equipment.box.stats.insulation : 0;
            if (insulationSkill + insulationEquip > 30) {
                satisfaction += 5;
            }
            const tipSkill = player.getSkillEffect(6);
            if (Math.random() < tipSkill / 100) {
                tip += Math.floor(order.pay * 0.2);
            }
            finalPay = Math.floor(finalPay);
            player.money += finalPay + tip;
            player.stats.totalEarnings += finalPay;
            player.stats.totalTips += tip;
            player.stats.ordersCompleted++;
            player.stats.satisfaction = Math.max(0, Math.min(100, player.stats.satisfaction + satisfaction - 100));
            if (satisfaction < 70) {
                player.stats.badReviews++;
            }
            order.status = 'delivered';
            order.deliveredAt = Date.now();
            order.finalPay = finalPay;
            order.finalTip = tip;
            order.satisfaction = satisfaction;
            const index = this.activeOrders.findIndex(o => o.id === orderId);
            if (index !== -1) {
                this.activeOrders.splice(index, 1);
            }
            this.completedOrders.push(order);
            return {
                success: true,
                pay: finalPay,
                tip: tip,
                satisfaction: satisfaction
            };
        }
        return { success: false, message: '无法送达' };
    }

    cancelOrder(orderId, player) {
        const index = this.activeOrders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            const order = this.activeOrders.splice(index, 1)[0];
            order.status = 'cancelled';
            player.stats.ordersFailed++;
            player.stats.satisfaction = Math.max(0, player.stats.satisfaction - 20);
            return { success: true };
        }
        return { success: false, message: '订单不存在' };
    }

    update(deltaTime, player) {
        for (const order of this.activeOrders) {
            order.timeRemaining -= deltaTime / 1000;
            if (order.status === 'picked') {
                let coolingRate = GameConfig.gameSettings.foodCoolingRate;
                const insulationSkill = player.getSkillEffect(3);
                const insulationEquip = player.equipment.box ? player.equipment.box.stats.insulation : 0;
                coolingRate *= (1 - (insulationSkill + insulationEquip) / 100);
                order.foodTemperature -= coolingRate * deltaTime / 1000;
                order.foodTemperature = Math.max(0, order.foodTemperature);
            }
        }
        this.activeOrders = this.activeOrders.filter(order => {
            if (order.timeRemaining <= -60) {
                player.stats.ordersFailed++;
                player.stats.satisfaction = Math.max(0, player.stats.satisfaction - 30);
                return false;
            }
            return true;
        });
    }

    isNearRestaurant(order, player) {
        const distance = Math.sqrt(Math.pow(order.restaurant.x - player.x, 2) + Math.pow(order.restaurant.y - player.y, 2));
        return distance < 40;
    }

    isNearDeliveryLocation(order, player) {
        const distance = Math.sqrt(Math.pow(order.deliveryLocation.x - player.x, 2) + Math.pow(order.deliveryLocation.y - player.y, 2));
        return distance < 40;
    }
}
