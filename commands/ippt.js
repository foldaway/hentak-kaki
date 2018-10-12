const ageGroups = [
  '< 22',
  '22-24',
  '25-27',
  '28-30',
  '31-33',
  '34-36',
  '37-39',
  '40-42',
  '43-45',
  '46-48',
  '49-51',
  '52-54',
  '55-57',
  '58-60'
];

const pushUpAgeScores = {
  0: 0,
  15: 1,
  16: 2,
  17: 4,
  18: 6,
  19: 8,
  20: 9,
  21: 10,
  22: 11,
  23: 12,
  24: 13,
  25: 14,
  26: 15,
  29: 16,
  32: 17,
  35: 18,
  36: 18,
  37: 18,
  38: 19,
  40: 20,
  45: 21,
  49: 22,
  53: 23,
  57: 24,
  60: 25
};

const sitUpAgeScores = {
  0: 0,
  15: 1,
  16: 2,
  17: 3,
  18: 4,
  19: 5,
  20: 6,
  22: 7,
  24: 8,
  25: 9,
  26: 10,
  27: 11,
  28: 12,
  29: 13,
  31: 14,
  33: 15,
  34: 16,
  35: 17,
  36: 18,
  37: 18,
  38: 19,
  40: 20,
  44: 21,
  45: 21,
  49: 22,
  53: 23,
  54: 23,
  57: 24,
  60: 25
};

const runAgeScores = {
  1000000: 0,
  960: 1,
  950: 2,
  940: 4,
  930: 6,
  920: 8,
  910: 10,
  900: 12,
  890: 14,
  880: 16,
  870: 18,
  860: 19,
  850: 20,
  840: 21,
  830: 22,
  820: 23,
  810: 24,
  800: 25,
  790: 26,
  780: 27,
  770: 28,
  760: 29,
  750: 30,
  740: 31,
  730: 32,
  720: 33,
  710: 34,
  700: 35,
  680: 36,
  660: 37,
  640: 38,
  620: 39,
  600: 40,
  580: 41,
  570: 42,
  560: 43,
  550: 44,
  540: 46,
  530: 48,
  520: 49,
  510: 50
};

const getScore = (score, map, ascending) => {
  if (map[score.toString()]) {
    return Number(map[score.toString()]);
  }
  const keys = Object.keys(map)
    .sort((a, b) => ascending ? b - a : a - b);
  const relevantKey = keys
    .map((key) => Number(key))
    .find((key) => ascending ?
      score > key :
      score < key);
  return map[relevantKey];
};

const calculateScore = (ageGroupIndex, pushups, situps, run) => {
  const p = pushups + ageGroupIndex;
  const s = situps + ageGroupIndex;
  const r = run - (ageGroupIndex * 10);

  return {
    pushups: getScore(p, pushUpAgeScores, true),
    situps: getScore(s, sitUpAgeScores, true),
    run: getScore(r, runAgeScores, false)
  };
};

const getRating = (points) => {
  if (points >= 90) {
    return 'Gold (Commando/Guards/NDU)';
  } else if (points >= 85) {
    return 'Gold';
  } else if (points >= 75) {
    return 'Silver';
  } else if (points >= 61) {
    return 'Pass';
  }
  return 'Fail';
};

module.exports = {
  manualSceneHandling: true,
  initialHandler: (ctx) => {
    ctx.scene.state.station = 'agegroup';
    ctx.reply('What is your age group?', {
      reply_markup: {
        keyboard: ageGroups.map((text) => [{ text }]),
        one_time_keyboard: true,
        selective: true,
        resize_keyboard: true
      },
      reply_to_message_id: ctx.update.message.message_id
    });
  },
  responseHandler: (ctx) => {
    switch (ctx.scene.state.station) {
      case 'agegroup': {
        const agi = ageGroups.indexOf(ctx.message.text);
        if (agi === -1) {
          ctx.reply('Invalid age group');
          ctx.scene.leave();
          return;
        }
        ctx.scene.state.ageGroupIndex = agi;
        ctx.scene.state.station = 'pushups';
        ctx.reply('How many push-ups?', {
          reply_markup: {
            force_reply: true,
            selective: true,
            resize_keyboard: true
          },
          reply_to_message_id: ctx.update.message.message_id
        });
        break;
      }
      case 'pushups':
        ctx.scene.state.pushups = Number(ctx.message.text);
        ctx.scene.state.station = 'situps';
        ctx.reply('How many sit-ups?', {
          reply_markup: {
            force_reply: true,
            selective: true,
            resize_keyboard: true
          },
          reply_to_message_id: ctx.update.message.message_id
        });
        break;
      case 'situps':
        ctx.scene.state.situps = Number(ctx.message.text);
        ctx.scene.state.station = 'run';
        ctx.reply('How long was your run?', {
          reply_markup: {
            force_reply: true,
            selective: true,
            resize_keyboard: true
          },
          reply_to_message_id: ctx.update.message.message_id
        });
        break;
      case 'run': {
        const split = ctx.message.text.split(':');
        ctx.scene.state.run = (Number(split[0]) * 60) + Number(split[1]);
        const {
          ageGroupIndex, pushups, situps, run
        } = ctx.scene.state;
        const points = calculateScore(ageGroupIndex, pushups, situps, run);
        const totalScore = points.pushups + points.situps + points.run;
        ctx.replyWithMarkdown(`*${pushups}* push-ups = *${points.pushups}* pts
*${situps}* sit-ups = *${points.situps}* pts
*${run}s* run = *${points.run}* pts
Total pts = *${totalScore}* _(${getRating(totalScore)})_`);
        ctx.scene.leave();
        break;
      }
      default:
        ctx.reply('Unknown state');
        break;
    }
  }
};
