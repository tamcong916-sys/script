require('dotenv').config();
const express = require('express');
const login = require('facebook-chat-api-v2');
const fs = require('fs-extra');
const path = require('path');
const bot = require('./bot');
const menu = require('./menu-handler');

const app = express();
app.use(express.json());

// Đường dẫn file appstate
const appStatePath = path.join(__dirname, 'appstate.json');

// Hàm đăng nhập và khởi động bot
async function startBot() {
    try {
        let credentials = {};
        
        // Kiểm tra nếu có appstate thì dùng lại
        if (fs.existsSync(appStatePath)) {
            credentials.appState = JSON.parse(fs.readFileSync(appStatePath, 'utf8'));
            console.log('📂 Đã tìm thấy appstate cũ, đang đăng nhập tự động...');
        } else {
            // Nếu không có appstate thì đăng nhập mới
            credentials = {
                email: process.env.FB_EMAIL,
                password: process.env.FB_PASSWORD
            };
            
            if (process.env.FB_2FA_SECRET) {
                credentials.twoFactorSecret = process.env.FB_2FA_SECRET;
            }
            
            console.log('🔐 Đang đăng nhập vào Facebook...');
        }
        
        // Đăng nhập
        login(credentials, async (err, api) => {
            if (err) {
                console.error('❌ Lỗi đăng nhập:', err);
                
                // Nếu lỗi, xóa appstate cũ và thử lại
                if (fs.existsSync(appStatePath)) {
                    fs.unlinkSync(appStatePath);
                    console.log('🔄 Đã xóa appstate cũ, đang thử đăng nhập lại...');
                    return startBot();
                }
                return;
            }
            
            // Lưu appstate để lần sau không cần đăng nhập lại
            fs.writeFileSync(appStatePath, JSON.stringify(api.getAppState()));
            console.log('✅ Đăng nhập thành công!');
            
            // Thiết lập options cho bot
            api.setOptions({
                listenEvents: true,
                selfListen: false,
                logLevel: "silent",
                updatePresence: true,
                forceLogin: true,
                autoMarkDelivery: true,
                autoMarkRead: process.env.AUTO_SEEN === 'true'
            });
            
            // Lấy thông tin user
            const userInfo = await api.getUserInfo(api.getCurrentUserID());
            const botName = userInfo[api.getCurrentUserID()].name;
            console.log(`👤 Bot đang chạy với tài khoản: ${botName}`);
            console.log(`🆔 ID: ${api.getCurrentUserID()}`);
            
            // Khởi động listener
            setupListeners(api);
            
            // Lưu api instance để dùng sau
            global.api = api;
            global.botID = api.getCurrentUserID();
            
            // Thông báo admin
            const adminID = process.env.ADMIN_ID;
            api.sendMessage('🤖 Bot đã khởi động thành công!\n✅ Sẵn sàng nhận lệnh!', adminID);
        });
        
    } catch (error) {
        console.error('❌ Lỗi khởi động bot:', error);
        setTimeout(startBot, 5000); // Thử lại sau 5s
    }
}

// Thiết lập listeners
function setupListeners(api) {
    // Lắng nghe tin nhắn mới
    api.listenMqtt(async (err, event) => {
        if (err) return console.error(err);
        
        // Xử lý các loại sự kiện
        switch (event.type) {
            case 'message':
            case 'message_reply':
                await bot.handleMessage(api, event);
                break;
                
            case 'message_unsend':
                console.log(`📝 Tin nhắn đã bị thu hồi từ ${event.senderID}`);
                break;
                
            case 'message_reaction':
                console.log(`❤️ ${event.senderID} đã thả cảm xúc ${event.reaction}`);
                break;
                
            case 'event':
                console.log(`👥 Sự kiện nhóm: ${event.logMessageType}`);
                break;
                
            case 'typ':
                console.log(`✍️ ${event.senderID} đang nhập...`);
                break;
                
            default:
                break;
        }
    });
    
    console.log('👂 Bot đang lắng nghe tin nhắn...');
}

// Web server cho render
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: 'Facebook Personal Bot',
        version: '2.0.0',
        uptime: process.uptime()
    });
});

// Endpoint health check
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Web server đang chạy tại port ${PORT}`);
    startBot();
});

// Xử lý khi process bị kill
process.on('SIGINT', async () => {
    console.log('🛑 Đang tắt bot...');
    if (global.api) {
        global.api.logout();
    }
    process.exit(0);
});

// Tự động restart nếu có lỗi
process.on('uncaughtException', (err) => {
    console.error('💥 Lỗi không xử lý:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('💥 Promise rejection:', err);
});
