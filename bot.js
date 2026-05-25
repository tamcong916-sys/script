const menu = require('./menu-handler');
const messageHandler = require('./message-handler');
const groupHandler = require('./group-handler');

class Bot {
    constructor() {
        this.prefix = process.env.BOT_PREFIX || '/';
        this.adminID = process.env.ADMIN_ID;
        this.botID = null;
        this.typingDelay = process.env.MESSAGE_DELAY || 1000;
    }

    async handleMessage(api, event) {
        try {
            // Bỏ qua tin nhắn của chính mình
            if (event.senderID === global.botID) return;
            
            const { threadID, messageID, senderID, body, type, attachments } = event;
            
            // Log tin nhắn
            console.log(`📨 [${threadID}] ${senderID}: ${body || 'Attachment'}`);
            
            // Auto seen
            if (process.env.AUTO_SEEN === 'true') {
                api.markAsRead(threadID);
            }
            
            // Xác định loại chat (inbox hay group)
            const isGroup = threadID !== senderID;
            
            // Xử lý tin nhắn
            if (body) {
                const message = body.trim();
                
                // Kiểm tra prefix command
                if (message.startsWith(this.prefix)) {
                    await this.handleCommand(api, event, message);
                } 
                // Auto reply cho inbox
                else if (!isGroup && process.env.AUTO_REPLY === 'true') {
                    await this.autoReply(api, event);
                }
                // Xử lý trong group
                else if (isGroup) {
                    await groupHandler.handleGroupMessage(api, event);
                }
            }
            
            // Xử lý attachment
            if (attachments && attachments.length > 0) {
                await this.handleAttachment(api, event);
            }
            
        } catch (error) {
            console.error('❌ Lỗi xử lý tin nhắn:', error);
        }
    }

    async handleCommand(api, event, message) {
        const { threadID, senderID } = event;
        
        // Parse command
        const args = message.slice(this.prefix.length).trim().split(' ');
        const command = args.shift().toLowerCase();
        
        console.log(`⚡ Command: ${command} from ${senderID}`);
        
        switch (command) {
            case 'menu':
            case 'help':
                await menu.sendMainMenu(api, threadID);
                break;
                
            case 'info':
                await this.sendBotInfo(api, threadID);
                break;
                
            case 'id':
                await api.sendMessage(`🆔 ID của bạn: ${senderID}`, threadID);
                break;
                
            case 'uid':
                await this.getUID(api, threadID, args);
                break;
                
            case 'say':
                if (args.length > 0) {
                    await api.sendMessage(args.join(' '), threadID);
                }
                break;
                
            case 'emoji':
                await api.sendMessage(this.getRandomEmoji(), threadID);
                break;
                
            case 'weather':
                await messageHandler.getWeather(api, threadID, args);
                break;
                
            case 'news':
                await messageHandler.getNews(api, threadID);
                break;
                
            case 'group':
                await groupHandler.getGroupInfo(api, threadID);
                break;
                
            case 'members':
                await groupHandler.getGroupMembers(api, threadID);
                break;
                
            case 'everyone':
                await groupHandler.tagEveryone(api, threadID, event);
                break;
                
            // Admin commands
            case 'admin':
                if (senderID === this.adminID) {
                    await this.handleAdminCommand(api, event, args);
                } else {
                    await api.sendMessage('⛔ Bạn không có quyền admin!', threadID);
                }
                break;
                
            default:
                await api.sendMessage(
                    `❌ Lệnh "${command}" không tồn tại!\n` +
                    `Gõ ${this.prefix}menu để xem danh sách lệnh.`,
                    threadID
                );
        }
    }

    async autoReply(api, event) {
        const { threadID, body } = event;
        const message = body.toLowerCase();
        
        // Simulate typing
        api.sendTypingIndicator(threadID, true);
        await this.sleep(this.typingDelay);
        
        let reply = null;
        
        // Pattern matching
        if (this.matchAny(message, ['hi', 'hello', 'chào', 'hey', 'alo'])) {
            const greetings = [
                '👋 Chào bạn! Tôi có thể giúp gì cho bạn?',
                'Xin chào! 😊 Bạn cần gì ạ?',
                'Hi! Rất vui được gặp bạn! 🤗',
                'Chào bạn! Gõ /menu để xem các chức năng nhé!'
            ];
            reply = greetings[Math.floor(Math.random() * greetings.length)];
        }
        else if (this.matchAny(message, ['menu', 'help', 'chức năng'])) {
            await menu.sendMainMenu(api, threadID);
            return;
        }
        else if (this.matchAny(message, ['cảm ơn', 'thanks', 'thank you'])) {
            reply = '🙏 Không có gì! Rất vui được giúp đỡ bạn!';
        }
        else if (this.matchAny(message, ['yêu', 'love'])) {
            reply = '❤️ Yêu bạn nhiều!';
        }
        else if (this.matchAny(message, ['buồn', 'sad', 'chán'])) {
            reply = '🥺 Đừng buồn nữa! Cuộc sống luôn có những điều tốt đẹp!';
        }
        else if (message.includes('bot')) {
            reply = '🤖 Tôi đây! Bot trợ lý ảo của bạn!';
        }
        else {
            reply = '🤔 Tôi chưa hiểu ý bạn. Gõ /menu để xem hướng dẫn nhé!';
        }
        
        if (reply) {
            await api.sendMessage(reply, threadID);
        }
        
        api.sendTypingIndicator(threadID, false);
    }

    async handleAttachment(api, event) {
        const { threadID, attachments } = event;
        const attachmentTypes = attachments.map(a => a.type).join(', ');
        await api.sendMessage(`📎 Đã nhận: ${attachmentTypes}`, threadID);
    }

    async handleAdminCommand(api, event, args) {
        const { threadID } = event;
        const subCommand = args.shift();
        
        switch (subCommand) {
            case 'restart':
                await api.sendMessage('🔄 Đang khởi động lại bot...', threadID);
                process.exit(1);
                break;
                
            case 'say':
                const [targetID, ...msgParts] = args;
                if (targetID && msgParts.length > 0) {
                    await api.sendMessage(msgParts.join(' '), targetID);
                    await api.sendMessage('✅ Đã gửi tin nhắn!', threadID);
                }
                break;
                
            case 'list':
                // Liệt kê tất cả thread
                const threadList = await api.getThreadList(20, null, ['INBOX']);
                let listMsg = '📋 Danh sách hội thoại:\n';
                threadList.forEach((thread, i) => {
                    listMsg += `\n${i+1}. ${thread.name || 'Inbox'} - ${thread.threadID}`;
                });
                await api.sendMessage(listMsg, threadID);
                break;
                
            default:
                await api.sendMessage('Admin commands: restart, say [id] [msg], list', threadID);
        }
    }

    async getUID(api, threadID, args) {
        try {
            const name = args.join(' ');
            if (!name) {
                return api.sendMessage('⚠️ Vui lòng nhập tên người dùng!', threadID);
            }
            // Tìm UID từ tên trong thread
            const threadInfo = await api.getThreadInfo(threadID);
            const members = threadInfo.userInfo;
            for (let member of members) {
                if (member.name.toLowerCase().includes(name.toLowerCase())) {
                    return api.sendMessage(`🆔 UID của ${member.name}: ${member.id}`, threadID);
                }
            }
            await api.sendMessage('❌ Không tìm thấy người dùng!', threadID);
        } catch (error) {
            await api.sendMessage('❌ Lỗi khi tìm UID!', threadID);
        }
    }

    async sendBotInfo(api, threadID) {
        const info = `
╔══════════════════╗
║   🤖 BOT INFO   ║
╚══════════════════╝

📌 Tên: ${process.env.BOT_NAME}
🔖 Prefix: ${this.prefix}
⏰ Uptime: ${Math.floor(process.uptime() / 60)} phút
👑 Admin: ${this.adminID}
🌐 Version: 2.0.0

📊 Thống kê:
• Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
• Platform: ${process.platform}
• Node.js: ${process.version}
`;
        await api.sendMessage(info, threadID);
    }

    // Helper functions
    matchAny(text, keywords) {
        return keywords.some(keyword => text.includes(keyword));
    }

    getRandomEmoji() {
        const emojis = ['😀', '😂', '🤣', '😍', '🥰', '😘', '🤩', '😎', '🤗', '🤔'];
        return emojis[Math.floor(Math.random() * emojis.length)];
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new Bot();
