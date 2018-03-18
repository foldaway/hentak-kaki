require('dotenv').config();
const glob = require('glob');
const path = require('path');

const Telegraf = require('telegraf');

const bot = new Telegraf(
  process.env.TELEGRAM_BOT_TOKEN,
  { username: process.env.TELEGRAM_BOT_USERNAME }
);

// Load all commands
glob.sync('./commands/**/*.js').forEach((file) => {
  const exp = require(path.resolve(file)); // eslint-disable-line global-require
  const commandName = path.basename(file).replace(/\.js/, '');
  if (exp instanceof Function) {
    bot.command(commandName, exp);
  } else if (exp instanceof Object) {
    bot.command(commandName, exp.initialHandler);
    if ('responseHandler' in exp) {
      // Single catch-all handler, for open-ended responses
      bot.hears(/.+?/i, exp.responseHandler);
    } else {
      // Fixed-answer handlers
      bot.hears(/.+?/i, (ctx) => {
        if (ctx.update.message.text in exp.responseHandlers) {
          exp.responseHandlers[ctx.update.message.text](ctx);
        } else if ('responseHandler' in exp) {
          // Last resort. Fallback, can be used to show an error message
          exp.responseHandler(ctx);
        }
      });
    }
  }
});

bot.startPolling();
