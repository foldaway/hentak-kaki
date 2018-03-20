require('dotenv').config();
const glob = require('glob');
const path = require('path');

const Telegraf = require('telegraf');
const session = require('telegraf/session')
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const { leave } = Stage;

const bot = new Telegraf(
  process.env.TELEGRAM_BOT_TOKEN,
  { username: process.env.TELEGRAM_BOT_USERNAME }
);

const stage = new Stage();
bot.use(session());
bot.use(stage.middleware());

// Load all commands
glob.sync('./commands/**/*.js').forEach((file) => {
  const exp = require(path.resolve(file)); // eslint-disable-line global-require
  const commandName = path.basename(file).replace(/\.js/, '');
  if (exp instanceof Function) {
    bot.command(commandName, exp);
  } else if (exp instanceof Object) {
    const scene = new Scene(commandName);
    scene.enter(exp.initialHandler);

    if ('responseHandlers' in exp) {
      // Fixed-answer handlers
      scene.on('message', (ctx) => {
        if (ctx.update.message.text in exp.responseHandlers) {
          exp.responseHandlers[ctx.update.message.text](ctx);
        } else if ('responseHandler' in exp) {
          // Last resort. Fallback, can be used to show an error message
          exp.responseHandler(ctx);
        }
        ctx.scene.leave();
      });
    } else {
      // Single catch-all handler, for open-ended responses
      scene.on('message', (ctx) => {
        exp.responseHandler(ctx);
        ctx.scene.leave();
      });
    }
    stage.register(scene);

    bot.command(commandName, (ctx) => ctx.scene.enter(commandName));
  }
});

bot.command('cancel', leave());
bot.startPolling();
