# 🤖 Facebook Personal Bot V2

Bot Facebook cá nhân chạy bằng tài khoản thật, hỗ trợ auto reply, menu lệnh, và nhiều tính năng.

## ⚠️ LƯU Ý
- Dùng cookie/appstate để đăng nhập
- Vi phạm ToS Facebook
- Chỉ dùng cho mục đích học tập

## 🚀 Deploy lên Render.com

### Cách 1: Deploy tự động

1. Fork repo này
2. Vào [Render.com](https://render.com)
3. New Web Service
4. Connect GitHub repo
5. Cấu hình:
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
   - **Environment Variables**: Thêm từ file `.env`

### Cách 2: Manual deploy

```bash
# Clone repo
git clone https://github.com/your-username/fb-bot.git
cd fb-bot

# Cài đặt
npm install

# Tạo file .env với thông tin
cp .env.example .env
nano .env

# Chạy bot
npm start
