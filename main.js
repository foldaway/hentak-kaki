require('dotenv').config();
const glob = require('glob');
const path = require('path');

const Telegraf = require('telegraf');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN, { username: process.env.TELEGRAM_BOT_USERNAME });

// Load all commands
glob.sync('./commands/**/*.js').forEach((file) => {
  bot.command(path.basename(file).replace(/\.jsx?/, ''), require(path.resolve(file))); // eslint-disable-line global-require
});

bot.startPolling();
