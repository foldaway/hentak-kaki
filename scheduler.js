require('dotenv').config();
const glob = require('glob');
const path = require('path');

const Telegram = require('telegraf/telegram');

const telegram = new Telegram(process.env.TELEGRAM_BOT_TOKEN);

glob.sync('./tasks/**/*.js').forEach((file) => {
  const exp = require(path.resolve(file)); // eslint-disable-line global-require
  const task = path.basename(file).replace(/\.js/, '');
  console.log(`Running '${task}' now.`);
  try {
    exp.func(telegram);
  } catch (e) {
    console.error(e);
  }
});
