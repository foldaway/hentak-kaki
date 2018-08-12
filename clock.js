const { CronJob } = require('cron');
const glob = require('glob');
const path = require('path');

const Telegram = require('telegraf/telegram');

const telegram = new Telegram(process.env.TELEGRAM_BOT_TOKEN);

glob.sync('./tasks/**/*.js').forEach((file) => {
  const exp = require(path.resolve(file)); // eslint-disable-line global-require
  const task = path.basename(file).replace(/\.js/, '');
  console.log(`Setting up cronjob '${task}' at '${exp.cron}'`);
  const job = new CronJob({
    cronTime: exp.cron,
    onTick: async () => exp.func(telegram),
    start: false,
    runOnInit: true,
    timeZone: 'Asia/Singapore'
  });
  job.start();
});
