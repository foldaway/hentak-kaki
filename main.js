require('dotenv').config();

const Telegraf = require('telegraf')

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
bot.command('help', (ctx) => ctx.reply('Try send a sticker!'));
bot.startPolling();
