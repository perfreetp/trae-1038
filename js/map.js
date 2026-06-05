class GameMap {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.roads = this.generateRoads();
        this.buildings = this.generateBuildings();
        this.trafficLights = JSON.parse(JSON.stringify(GameConfig.trafficLights));
        this.rainDrops = [];
        this.snowFlakes = [];
    }

    generateRoads() {
        const roads = [];
        roads.push({ x1: 0, y1: 100, x2: 800, y2: 100, type: 'horizontal' });
        roads.push({ x1: 0, y1: 250, x2: 800, y2: 250, type: 'horizontal' });
        roads.push({ x1: 0, y1: 400, x2: 800, y2: 400, type: 'horizontal' });
        roads.push({ x1: 0, y1: 550, x2: 800, y2: 550, type: 'horizontal' });
        roads.push({ x1: 100, y1: 0, x2: 100, y2: 600, type: 'vertical' });
        roads.push({ x1: 250, y1: 0, x2: 250, y2: 600, type: 'vertical' });
        roads.push({ x1: 400, y1: 0, x2: 400, y2: 600, type: 'vertical' });
        roads.push({ x1: 550, y1: 0, x2: 550, y2: 600, type: 'vertical' });
        roads.push({ x1: 700, y1: 0, x2: 700, y2: 600, type: 'vertical' });
        return roads;
    }

    generateBuildings() {
        const buildings = [];
        const colors = ['#2d3748', '#374151', '#4a5568', '#1f2937'];
        for (let i = 0; i < 20; i++) {
            buildings.push({
                x: Math.random() * 700 + 50,
                y: Math.random() * 500 + 50,
                width: Math.random() * 60 + 40,
                height: Math.random() * 80 + 60,
                color: colors[Math.floor(Math.random() * colors.length)],
                windows: Math.floor(Math.random() * 10) + 5
            });
        }
        return buildings;
    }

    isOnRoad(x, y) {
        const roadWidth = 40;
        for (const road of this.roads) {
            if (road.type === 'horizontal') {
                if (y >= road.y1 - roadWidth / 2 && y <= road.y1 + roadWidth / 2) {
                    return true;
                }
            } else {
                if (x >= road.x1 - roadWidth / 2 && x <= road.x1 + roadWidth / 2) {
                    return true;
                }
            }
        }
        return false;
    }

    updateTrafficLights(deltaTime) {
        for (const light of this.trafficLights) {
            light.timer += deltaTime;
            if (light.timer > 3000) {
                light.timer = 0;
                if (light.state === 'red') light.state = 'green';
                else if (light.state === 'green') light.state = 'yellow';
                else light.state = 'red';
            }
        }
    }

    updateWeather(weather, deltaTime) {
        if (weather === 'rain' || weather === 'storm') {
            if (Math.random() < (weather === 'storm' ? 0.5 : 0.2)) {
                this.rainDrops.push({
                    x: Math.random() * this.width,
                    y: -10,
                    speed: weather === 'storm' ? 15 : 8,
                    length: weather === 'storm' ? 20 : 10
                });
            }
            this.rainDrops = this.rainDrops.filter(drop => {
                drop.y += drop.speed;
                return drop.y < this.height;
            });
        } else {
            this.rainDrops = [];
        }

        if (weather === 'snow') {
            if (Math.random() < 0.3) {
                this.snowFlakes.push({
                    x: Math.random() * this.width,
                    y: -10,
                    speed: 2 + Math.random() * 2,
                    size: 2 + Math.random() * 3,
                    drift: Math.random() * 2 - 1
                });
            }
            this.snowFlakes = this.snowFlakes.filter(flake => {
                flake.y += flake.speed;
                flake.x += flake.drift;
                return flake.y < this.height;
            });
        } else {
            this.snowFlakes = [];
        }
    }

    render(weather, visibility) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.fillStyle = '#0d1117';
        ctx.fillRect(0, 0, this.width, this.height);
        for (const building of this.buildings) {
            ctx.fillStyle = building.color;
            ctx.fillRect(building.x, building.y, building.width, building.height);
            ctx.fillStyle = '#fbbf24';
            for (let w = 0; w < building.windows; w++) {
                const wx = building.x + 5 + (w % 4) * 12;
                const wy = building.y + 10 + Math.floor(w / 4) * 15;
                if (wy < building.y + building.height - 10) {
                    if (Math.random() > 0.3) {
                        ctx.fillRect(wx, wy, 8, 8);
                    }
                }
            }
        }
        for (const road of this.roads) {
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = 40;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(road.x1, road.y1);
            ctx.lineTo(road.x2, road.y2);
            ctx.stroke();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.setLineDash([20, 20]);
            ctx.beginPath();
            ctx.moveTo(road.x1, road.y1);
            ctx.lineTo(road.x2, road.y2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        for (const light of this.trafficLights) {
            ctx.fillStyle = '#1f2937';
            ctx.fillRect(light.x - 8, light.y - 25, 16, 50);
            const colors = { red: '#ef4444', yellow: '#fbbf24', green: '#22c55e' };
            ctx.fillStyle = colors[light.state];
            ctx.beginPath();
            ctx.arc(light.x, light.state === 'red' ? light.y - 15 : light.state === 'yellow' ? light.y : light.y + 15, 5, 0, Math.PI * 2);
            ctx.fill();
        }
        for (const restaurant of GameConfig.restaurants) {
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(restaurant.icon, restaurant.x, restaurant.y);
            ctx.font = '10px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText(restaurant.name, restaurant.x, restaurant.y + 18);
        }
        for (const location of GameConfig.deliveryLocations) {
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🏠', location.x, location.y);
            ctx.font = '9px Arial';
            ctx.fillStyle = '#9ca3af';
            ctx.fillText(location.name, location.x, location.y + 15);
        }
        for (const station of GameConfig.chargeStations) {
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔌', station.x, station.y);
            ctx.font = '10px Arial';
            ctx.fillStyle = '#22c55e';
            ctx.fillText(station.name, station.x, station.y + 18);
        }
        ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
        for (const drop of this.rainDrops) {
            ctx.fillRect(drop.x, drop.y, 1, drop.length);
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const flake of this.snowFlakes) {
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
            ctx.fill();
        }
        if (visibility < 1) {
            const gradient = ctx.createRadialGradient(
                this.width / 2, this.height / 2, this.width * visibility * 0.3,
                this.width / 2, this.height / 2, this.width * 0.6
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, `rgba(0, 0, 0, ${1 - visibility})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }
}
