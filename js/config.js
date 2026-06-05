const GameConfig = {
    chapters: [
        {
            id: 1,
            name: '新手街区',
            icon: '🏘️',
            description: '熟悉基本操作，在安静的街区开始你的骑手生涯',
            unlocked: true,
            weather: 'clear',
            startTime: 22,
            endTime: 24,
            orderCount: 5,
            basePay: 8,
            difficulty: 1
        },
        {
            id: 2,
            name: '写字楼群',
            icon: '🏢',
            description: '加班族的深夜订单，电梯等待是最大挑战',
            unlocked: true,
            weather: 'cloudy',
            startTime: 22,
            endTime: 2,
            orderCount: 8,
            basePay: 10,
            difficulty: 2
        },
        {
            id: 3,
            name: '夜市',
            icon: '🍜',
            description: '热闹的夜市商圈，出餐慢但单价高',
            unlocked: true,
            weather: 'clear',
            startTime: 23,
            endTime: 3,
            orderCount: 10,
            basePay: 12,
            difficulty: 2
        },
        {
            id: 4,
            name: '医院周边',
            icon: '🏥',
            description: '24小时营业的药店和便利店，急需订单多',
            unlocked: false,
            weather: 'rain',
            startTime: 23,
            endTime: 4,
            orderCount: 12,
            basePay: 15,
            difficulty: 3
        },
        {
            id: 5,
            name: '坡道社区',
            icon: '⛰️',
            description: '老旧小区没有电梯，爬坡上楼考验体力',
            unlocked: false,
            weather: 'cloudy',
            startTime: 22,
            endTime: 3,
            orderCount: 10,
            basePay: 14,
            difficulty: 3
        },
        {
            id: 6,
            name: '暴雨高峰',
            icon: '⛈️',
            description: '暴雨天气订单暴增，视线受阻难度加倍',
            unlocked: false,
            weather: 'storm',
            startTime: 22,
            endTime: 2,
            orderCount: 15,
            basePay: 20,
            difficulty: 4
        },
        {
            id: 7,
            name: '节日连单',
            icon: '🎉',
            description: '节日夜晚订单不断，奖励丰厚但超时惩罚重',
            unlocked: false,
            weather: 'snow',
            startTime: 20,
            endTime: 4,
            orderCount: 20,
            basePay: 25,
            difficulty: 5
        }
    ],

    restaurants: [
        { id: 1, name: '深夜食堂', icon: '🍜', x: 100, y: 150, type: 'food' },
        { id: 2, name: '24小时便利店', icon: '🏪', x: 250, y: 100, type: 'convenience' },
        { id: 3, name: '烧烤王', icon: '🍖', x: 400, y: 200, type: 'food' },
        { id: 4, name: '奶茶铺子', icon: '🧋', x: 150, y: 350, type: 'drink' },
        { id: 5, name: '药店', icon: '💊', x: 500, y: 300, type: 'medical' },
        { id: 6, name: '汉堡快餐', icon: '🍔', x: 300, y: 450, type: 'food' },
        { id: 7, name: '咖啡店', icon: '☕', x: 600, y: 150, type: 'drink' },
        { id: 8, name: '披萨店', icon: '🍕', x: 450, y: 400, type: 'food' },
        { id: 9, name: '水果店', icon: '🍎', x: 200, y: 250, type: 'food' },
        { id: 10, name: '超市', icon: '🛒', x: 550, y: 500, type: 'convenience' }
    ],

    deliveryLocations: [
        { id: 1, name: '幸福小区1号楼', x: 150, y: 200, type: 'residential', floor: 6 },
        { id: 2, name: '科技大厦A座', x: 350, y: 150, type: 'office', floor: 15 },
        { id: 3, name: '和平里3号楼', x: 500, y: 250, type: 'residential', floor: 4 },
        { id: 4, name: '中心医院住院部', x: 250, y: 400, type: 'hospital', floor: 8 },
        { id: 5, name: '学生公寓B栋', x: 600, y: 350, type: 'dorm', floor: 7 },
        { id: 6, name: '老城区胡同', x: 100, y: 450, type: 'oldtown', floor: 2 },
        { id: 7, name: '商务中心', x: 450, y: 100, type: 'office', floor: 20 },
        { id: 8, name: '阳光花园', x: 300, y: 500, type: 'residential', floor: 10 },
        { id: 9, name: '工业园宿舍', x: 650, y: 200, type: 'dorm', floor: 5 },
        { id: 10, name: '别墅区', x: 550, y: 450, type: 'villa', floor: 3 }
    ],

    chargeStations: [
        { id: 1, name: '充电站A', x: 200, y: 200, price: 2, speed: 1 },
        { id: 2, name: '充电站B', x: 500, y: 400, price: 3, speed: 1.5 },
        { id: 3, name: '换电站', x: 350, y: 300, price: 10, speed: 5 }
    ],

    shopItems: [
        { id: 1, name: '加厚保温箱', icon: '📦', price: 200, type: 'equipment', slot: 'box', stats: { insulation: 20 } },
        { id: 2, name: '大容量电池', icon: '🔋', price: 500, type: 'equipment', slot: 'battery', stats: { batteryMax: 30 } },
        { id: 3, name: '防滑轮胎', icon: '🛞', price: 300, type: 'equipment', slot: 'tire', stats: { grip: 15 } },
        { id: 4, name: '高亮车灯', icon: '💡', price: 150, type: 'equipment', slot: 'light', stats: { vision: 20 } },
        { id: 5, name: '高效电机', icon: '⚙️', price: 400, type: 'equipment', slot: 'motor', stats: { speed: 10 } },
        { id: 6, name: '舒适头盔', icon: '🪖', price: 100, type: 'equipment', slot: 'helmet', stats: { defense: 10 } },
        { id: 7, name: '功能饮料', icon: '🥤', price: 10, type: 'consumable', stats: { energy: 20 } },
        { id: 8, name: '能量棒', icon: '🍫', price: 5, type: 'consumable', stats: { energy: 10 } },
        { id: 9, name: '雨衣', icon: '🧥', price: 50, type: 'consumable', stats: { rainProtection: 1 } },
        { id: 10, name: '手机防水套', icon: '📱', price: 30, type: 'consumable', stats: { phoneProtection: 1 } }
    ],

    skills: [
        { id: 1, name: '闪电取餐', icon: '⚡', maxLevel: 5, baseLevel: 1, description: '取餐速度提升', effect: { pickupSpeed: 10 } },
        { id: 2, name: '路线大师', icon: '🗺️', maxLevel: 5, baseLevel: 1, description: '导航更精准，距离显示更准确', effect: { navigation: 10 } },
        { id: 3, name: '保温达人', icon: '🔥', maxLevel: 5, baseLevel: 1, description: '餐品温度保持更久', effect: { insulation: 10 } },
        { id: 4, name: '体力充沛', icon: '💪', maxLevel: 5, baseLevel: 1, description: '体力上限提升', effect: { energyMax: 10 } },
        { id: 5, name: '沟通高手', icon: '💬', maxLevel: 5, baseLevel: 1, description: '顾客满意度提升', effect: { satisfaction: 10 } },
        { id: 6, name: '幸运之星', icon: '🍀', maxLevel: 5, baseLevel: 1, description: '获得小费概率提升', effect: { tipChance: 5 } }
    ],

    storyMessages: [
        { id: 1, sender: '系统', content: '欢迎来到城市夜班外卖骑手！今晚是你的第一个班次，注意安全。', time: '22:00', type: 'system' },
        { id: 2, sender: '站长', content: '小伙子，今晚订单不多，慢慢熟悉路线，有问题随时联系我。', time: '22:05', type: 'system' },
        { id: 3, sender: '妈妈', content: '儿子，工作别太辛苦了，注意保暖，记得按时吃饭。', time: '22:15', type: 'story' },
        { id: 4, sender: '顾客-王先生', content: '骑手你好，我点的药麻烦快点，家里老人等着用。', time: '22:30', type: 'customer' },
        { id: 5, sender: '系统', content: '今晚雨势可能加大，请准备好雨具，注意骑行安全。', time: '23:00', type: 'system' },
        { id: 6, sender: '女朋友', content: '亲爱的，什么时候下班呀？我给你留了夜宵。', time: '23:30', type: 'story' },
        { id: 7, sender: '顾客-李女士', content: '不好意思，我临时出门了，餐可以放在门口吗？谢谢！', time: '00:15', type: 'customer' },
        { id: 8, sender: '站长', content: '干得不错！今晚你是片区单量第一，继续加油！', time: '01:00', type: 'system' },
        { id: 9, sender: '老朋友', content: '兄弟，听说你在跑外卖？周末出来聚聚？', time: '01:30', type: 'story' },
        { id: 10, sender: '系统', content: '距离班次结束还有1小时，坚持就是胜利！', time: '02:00', type: 'system' }
    ],

    customerMessages: {
        greeting: ['你好', '您好', 'hi', '在吗'],
        waiting: ['什么时候到啊？', '快了吗？', '还有多久？'],
        thanks: ['谢谢', '辛苦了', '非常感谢'],
        complaint: ['怎么这么慢？', '汤撒了！', '餐凉了！'],
        tip: ['给你点小费，辛苦了', '好评已给', '下次还找你']
    },

    weatherTypes: {
        clear: { name: '晴朗', icon: '🌙', speedModifier: 1, visibility: 1, energyDrain: 1 },
        cloudy: { name: '多云', icon: '☁️', speedModifier: 0.95, visibility: 0.9, energyDrain: 1.1 },
        rain: { name: '小雨', icon: '🌧️', speedModifier: 0.8, visibility: 0.7, energyDrain: 1.3 },
        storm: { name: '暴雨', icon: '⛈️', speedModifier: 0.6, visibility: 0.5, energyDrain: 1.6 },
        snow: { name: '小雪', icon: '🌨️', speedModifier: 0.7, visibility: 0.6, energyDrain: 1.5 }
    },

    trafficLights: [
        { id: 1, x: 300, y: 200, state: 'red', timer: 0 },
        { id: 2, x: 400, y: 350, state: 'green', timer: 0 },
        { id: 3, x: 200, y: 400, state: 'yellow', timer: 0 },
        { id: 4, x: 550, y: 250, state: 'red', timer: 0 }
    ],

    gameSettings: {
        playerSpeed: 2,
        maxEnergy: 100,
        maxBattery: 100,
        energyDrainRate: 0.05,
        batteryDrainRate: 0.03,
        foodCoolingRate: 0.02,
        vehicleDurabilityDrain: 0.01,
        maxActiveOrders: 3,
        orderTimeLimit: 30,
        overTimePenalty: 0.5,
        earlyBonus: 0.2,
        tipChance: 0.3,
        baseSatisfaction: 100,
        durabilitySpeedPenalty: {
            high: 0.7,
            medium: 0.85,
            low: 0.95
        },
        breakdownChance: {
            high: 0.02,
            medium: 0.005,
            low: 0
        },
        chainOrderBonus: 0.15,
        detourSatisfactionPenalty: 0.05
    },

    vehicleEvents: [
        { id: 'breakdown', name: '车辆抛锚', duration: 5000, speedMultiplier: 0, durabilityThreshold: 30 },
        { id: 'skid', name: '轮胎打滑', duration: 3000, speedMultiplier: 0.4, durabilityThreshold: 50 },
        { id: 'stutter', name: '动力卡顿', duration: 2000, speedMultiplier: 0.6, durabilityThreshold: 70 }
    ],

    chapterFeatures: {
        1: { elevatorWait: 0, urgentRate: 0, energyMultiplier: 1, durabilityMultiplier: 1, visionMultiplier: 1 },
        2: { elevatorWait: 15, urgentRate: 0.1, energyMultiplier: 1, durabilityMultiplier: 1, visionMultiplier: 1 },
        3: { elevatorWait: 5, urgentRate: 0.05, energyMultiplier: 1, durabilityMultiplier: 1, visionMultiplier: 1 },
        4: { elevatorWait: 10, urgentRate: 0.4, energyMultiplier: 1.1, durabilityMultiplier: 1.1, visionMultiplier: 1 },
        5: { elevatorWait: 0, urgentRate: 0.15, energyMultiplier: 1.5, durabilityMultiplier: 1.3, visionMultiplier: 1 },
        6: { elevatorWait: 10, urgentRate: 0.25, energyMultiplier: 1.3, durabilityMultiplier: 1.2, visionMultiplier: 0.6 },
        7: { elevatorWait: 8, urgentRate: 0.3, energyMultiplier: 1.2, durabilityMultiplier: 1.1, visionMultiplier: 0.8 }
    },

    customerInteractions: [
        { id: 'urge', name: '顾客催单', responses: [
            { text: '马上到，请稍等', effect: { time: 10, satisfaction: 0 } },
            { text: '路上有点堵，还需一会', effect: { time: 0, satisfaction: -5 } },
            { text: '抱歉抱歉，尽快！', effect: { time: 5, satisfaction: -2 } }
        ]},
        { id: 'change_address', name: '顾客改地址', responses: [
            { text: '好的，马上过去', effect: { time: -30, satisfaction: 5, changeTarget: true } },
            { text: '太远了，送不了原地址吧', effect: { time: 0, satisfaction: -10 } },
            { text: '可以，但要加钱哦', effect: { time: -20, satisfaction: -5, extraPay: 3 } }
        ]},
        { id: 'leave_door', name: '要求放门口', responses: [
            { text: '好的，放门口了', effect: { time: 15, satisfaction: 0, leaveAtDoor: true } },
            { text: '最好您来取一下，怕丢', effect: { time: 0, satisfaction: -3 } },
            { text: '没问题，拍照给您', effect: { time: 10, satisfaction: 5 } }
        ]}
    ],

    leaderboard: [
        { rank: 1, name: '风驰电掣', score: 9850 },
        { rank: 2, name: '夜跑王者', score: 8720 },
        { rank: 3, name: '单王', score: 7650 },
        { rank: 4, name: '准时达人', score: 6540 },
        { rank: 5, name: '新人骑手', score: 5430 },
        { rank: 6, name: '雨中漫步', score: 4320 },
        { rank: 7, name: '夜猫子', score: 3210 },
        { rank: 8, name: '新手小白', score: 2100 }
    ]
};
