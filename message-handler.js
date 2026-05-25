const axios = require('axios');

class MessageHandler {
    async getWeather(api, threadID, args) {
        try {
            const city = args.join(' ') || 'Hanoi';
            const response = await axios.get(
                `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=YOUR_API_KEY&units=metric`
            );
            
            const weather = response.data;
            const message = `
🌤️ THỜI TIẾT TẠI ${weather.name}

🌡️ Nhiệt độ: ${weather.main.temp}°C
💧 Độ ẩm: ${weather.main.humidity}%
🌬️ Gió: ${weather.wind.speed} m/s
☁️ Mây: ${weather.clouds.all}%
📊 Áp suất: ${weather.main.pressure} hPa

📝 Mô tả: ${weather.weather[0].description}
            `;
            
            await api.sendMessage(message, threadID);
        } catch (error) {
            await api.sendMessage('❌ Không thể lấy dữ liệu thời tiết!', threadID);
        }
    }

    async getNews(api, threadID) {
        try {
            // Dùng API miễn phí hoặc scrape
            const response = await axios.get(
                'https://api.rss2json.com/v1/api.json?rss_url=https://vnexpress.net/rss/tin-moi-nhat.rss'
            );
            
            const news = response.data.items.slice(0, 5);
            let newsMessage = '📰 TIN TỨC MỚI NHẤT:\n\n';
            
            news.forEach((item, index) => {
                newsMessage += `${index + 1}. ${item.title}\n${item.link}\n\n`;
            });
            
            await api.sendMessage(newsMessage, threadID);
        } catch (error) {
            await api.sendMessage('❌ Không thể lấy tin tức!', threadID);
        }
    }

    async translateText(api, threadID, args) {
        try {
            const text = args.join(' ');
            if (!text) {
                return api.sendMessage('⚠️ Vui lòng nhập text cần dịch!', threadID);
            }
            
            // Google Translate API
            const response = await axios.get(
                `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`
            );
            
            const translated = response.data[0][0][0];
            await api.sendMessage(`🌐 Dịch: ${translated}`, threadID);
        } catch (error) {
            await api.sendMessage('❌ Lỗi dịch!', threadID);
        }
    }
}

module.exports = new MessageHandler();
