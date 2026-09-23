import axios from 'axios'
import FormData from 'form-data'
import te from '../lib/Sung-error.js'

let handler = async (m, { conn, text, command, prefix }) => {
    const cmd = command.toLowerCase()

    if (!text || !text.includes('|')) {
        let helpText = `أهلاً بك! يبدو أن التنسيق الذي أدخلته غير صحيح.\n\n`
        helpText += `هذه الميزة تستخدم لصنع صورة مكالمة وهمية (Fake Call) تبدو وكأن شخصاً ما يتصل بك مباشرة.\n\n`
        helpText += `*الأوامر المتوفرة:*\n`
        helpText += `- *${prefix}fakecall* (لتصميم مكالمة بنظام أندرويد)\n`
        helpText += `- *${prefix}fakecall-ios* (لتصميم مكالمة بنظام آيفون / iOS)\n\n`
        helpText += `*طريقة الاستخدام:*\n`
        helpText += `اكتب الأمر متبوعاً بـ *الاسم* و *المدة* يفصل بينهما خط عمودي (|).\n\n`
        helpText += `*أمثلة:*\n`
        helpText += `- *${prefix}fakecall برهوم | 03:33:33*\n`
        helpText += `- *${prefix}fakecall-ios الغالي | 12:00:00*\n\n`
        helpText += `*نصيحة إضافية:*\n`
        helpText += `يمكنك الرد (Reply) على أي صورة لتكون هي صورة الملف الشخصي للمتصل!`
        
        return m.reply(helpText)
    }

    const [nama, durasi] = text.split('|').map(s => s.trim())

    if (!nama) {
        return m.reply(`عذراً، لا يمكن ترك اسم المتصل فارغاً. يرجى كتابة الاسم أولاً!`)
    }

    if (!durasi) {
        return m.reply(`عذراً، لا يمكن ترك مدة المكالمة فارغة. يرجى تحديد المدة أولاً!`)
    }

    await m.react('🕕')

    try {
        let bufferBase
        
        if (m.isImage) {
            try {
                bufferBase = await m.download()
            } catch (err) {}
        } else if (m.quoted?.isImage) {
            try {
                bufferBase = await m.quoted.download()
            } catch (err) {}
        }

        if (!bufferBase) {
            try {
                const ppUrl = await conn.profilePictureUrl(m.sender, 'image')
                const res = await axios.get(ppUrl, { responseType: 'arraybuffer' })
                bufferBase = Buffer.from(res.data)
            } catch (err) {
                const res = await axios.get('https://files.catbox.moe/nwvkbt.png', { responseType: 'arraybuffer' })
                bufferBase = Buffer.from(res.data)
            }
        }

        const form = new FormData()
        form.append('avatarUrl', bufferBase, { filename: 'avatar.jpg', contentType: 'image/jpeg' })
        form.append('name', nama)
        form.append('duration', durasi)

        let endpoint = 'fakecall-android'
        if (cmd === 'fakecall-ios') {
            endpoint = 'fakecall-ios'
        }

        const apiUrl = `https://my.izuka-api.xyz/api/canvas/${endpoint}`

        const response = await axios.post(apiUrl, form, {
            headers: form.getHeaders(),
            responseType: 'arraybuffer'
        })

        await conn.sendMessage(m.chat, { image: Buffer.from(response.data) }, { quoted: m })

        await m.react('📞')

    } catch (err) {
        await m.react('☢')
        return m.reply(te(prefix, command, m.pushName))
    }
}

handler.help = ['fakecall', 'fakecall-ios']
handler.tags = ['canvas']
handler.command = /^fakecall(-ios)?$/i
handler.cooldown = 10
handler.energi = 1

export default handler