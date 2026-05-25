require('dotenv').config();
const login = require('facebook-chat-api-v2');
const fs = require('fs-extra');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔐 ĐĂNG NHẬP FACEBOOK\n');

const credentials = {
    email: process.env.FB_EMAIL,
    password: process.env.FB_PASSWORD
};

login(credentials, (err, api) => {
    if (err) {
        switch (err.error) {
            case 'login-approval':
                console.log('🔒 Cần mã xác thực 2FA!');
                rl.question('Nhập mã 2FA: ', (code) => {
                    err.continue(code);
                });
                break;
                
            default:
                console.error('❌ Lỗi đăng nhập:', err);
                process.exit(1);
        }
        return;
    }
    
    // Lưu appstate
    fs.writeFileSync('appstate.json', JSON.stringify(api.getAppState()));
    console.log('✅ Đăng nhập thành công! Đã lưu appstate.json');
    
    api.getUserInfo(api.getCurrentUserID(), (err, info) => {
        if (err) return console.error(err);
        console.log(`👤 Đăng nhập với: ${info[api.getCurrentUserID()].name}`);
        process.exit(0);
    });
});
