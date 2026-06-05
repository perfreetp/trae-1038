let game;

window.addEventListener('DOMContentLoaded', () => {
    console.log('城市夜班外卖骑手模拟 - 游戏加载中...');
    try {
        game = new Game();
        console.log('游戏初始化成功！');
    } catch (error) {
        console.error('游戏初始化失败:', error);
        alert('游戏初始化失败，请刷新页面重试');
    }
});
