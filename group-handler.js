class GroupHandler {
    async handleGroupMessage(api, event) {
        const { threadID, body, senderID } = event;
        
        // Bot mention
        if (body && body.includes('@bot')) {
            const reply = `👋 Chào bạn! Tôi là bot. Gõ ${process.env.BOT_PREFIX}menu để xem lệnh!`;
            await api.sendMessage(reply, threadID);
        }
    }

    async getGroupInfo(api, threadID) {
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            
            const info = `
👥 THÔNG TIN NHÓM

📌 Tên: ${threadInfo.threadName}
🆔 ID: ${threadID}
👤 Thành viên: ${threadInfo.participantIDs.length}
👑 Admin: ${threadInfo.adminIDs ? threadInfo.adminIDs.length : 0}
📷 Ảnh: ${threadInfo.imageSrc ? 'Có' : 'Không'}
🔒 Loại: ${threadInfo.isGroup ? 'Nhóm' : 'Chat riêng'}
            `;
            
            await api.sendMessage(info, threadID);
        } catch (error) {
            await api.sendMessage('❌ Không thể lấy thông tin nhóm!', threadID);
        }
    }

    async getGroupMembers(api, threadID) {
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            let memberList = '👥 DANH SÁCH THÀNH VIÊN:\n\n';
            
            threadInfo.userInfo.forEach((member, index) => {
                memberList += `${index + 1}. ${member.name}\n`;
            });
            
            if (memberList.length > 2000) {
                // Chia nhỏ nếu quá dài
                const parts = this.splitMessage(memberList, 2000);
                for (let part of parts) {
                    await api.sendMessage(part, threadID);
                }
            } else {
                await api.sendMessage(memberList, threadID);
            }
        } catch (error) {
            await api.sendMessage('❌ Lỗi lấy danh sách thành viên!', threadID);
        }
    }

    async tagEveryone(api, threadID, event) {
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            const mentions = [];
            let body = '📢 THÔNG BÁO @everyone\n';
            
            threadInfo.participantIDs.forEach(id => {
                mentions.push({
                    tag: `@${id}`,
                    id: id
                });
            });
            
            body += 'Tất cả mọi người chú ý!';
            
            await api.sendMessage({
                body: body,
                mentions: mentions
            }, threadID);
        } catch (error) {
            await api.sendMessage('❌ Lỗi khi tag!', threadID);
        }
    }

    splitMessage(message, maxLength) {
        const parts = [];
        while (message.length > maxLength) {
            let part = message.substring(0, maxLength);
            const lastNewLine = part.lastIndexOf('\n');
            if (lastNewLine > 0) {
                part = message.substring(0, lastNewLine);
                message = message.substring(lastNewLine + 1);
            } else {
                message = message.substring(maxLength);
            }
            parts.push(part);
        }
        if (message.length > 0) parts.push(message);
        return parts;
    }
}

module.exports = new GroupHandler();
