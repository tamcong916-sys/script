class MenuHandler {
    constructor() {
        this.prefix = process.env.BOT_PREFIX || '/';
    }

    async sendMainMenu(api, threadID) {
        const menuMessage = `
╔══════════════════════════╗
║    🤖 MENU CHÍNH        ║
╠══════════════════════════╣
║                          ║
║ 📋 LỆNH CƠ BẢN:         ║
║  ├ ${this.prefix}menu    - Menu này ║
║  ├ ${this.prefix}info    - Thông tin ║
║  ├ ${this.prefix}id      - ID bạn   ║
║  ├ ${this.prefix}uid     - Tìm UID  ║
║  ├ ${this.prefix}say     - Bot nói  ║
║  └ ${this.prefix}emoji   - Icon     ║
║                          ║
║ 🛠️ TIỆN ÍCH:            ║
║  ├ ${this.prefix}weather - Thời tiết║
║  ├ ${this.prefix}news    - Tin tức  ║
║  └ ${this.prefix}translate - Dịch  ║
║                          ║
║ 👥 NHÓM:                 ║
║  ├ ${this.prefix}group   - Info     ║
║  ├ ${this.prefix}members - TV       ║
║  └ ${this.prefix}everyone - @all   ║
║                          ║
║ 🤖 TỰ ĐỘNG:              ║
║  • Auto reply chat       ║
║  • Auto seen message     ║
║  • Nhận diện text        ║
║                          ║
╚══════════════════════════╝
        `;
        
        await api.sendMessage(menuMessage, threadID);
    }

    async sendQuickButtons(api, threadID) {
        // Gửi menu dạng reply buttons (nếu hỗ trợ)
        await api.sendMessage({
            body: '📋 Chọn chức năng:',
            mentions: []
        }, threadID);
        
        // Gửi thêm các lựa chọn
        const buttons = [
            `${this.prefix}info - ℹ️ Thông tin bot`,
            `${this.prefix}menu - 📋 Menu`,
            `${this.prefix}weather - 🌤️ Thời tiết`,
            `${this.prefix}news - 📰 Tin tức`,
            `${this.prefix}help - ❓ Trợ giúp`
        ];
        
        await api.sendMessage(buttons.join('\n'), threadID);
    }
}

module.exports = new MenuHandler();
