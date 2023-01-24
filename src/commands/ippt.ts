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
  '58-60',
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
  60: 25,
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
  60: 25,
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
  510: 50,
};

const getScore = (
  score: number,
  map: Record<number, number>,
  ascending: boolean
) => {
  if (map[score]) {
    return Number(map[score]);
  }

  const keys = Object.keys(map).sort((a, b) =>
    ascending ? b.localeCompare(a) : a.localeCompare(b)
  );
  const relevantKey = keys
    .map((key) => Number(key))
    .find((key) => (ascending ? score > key : score < key));

  if (relevantKey == null) {
    throw new Error('could not find relevant key');
  }

  return map[relevantKey];
};

const calculateScore = (
  ageGroupIndex: number,
  pushups: number,
  situps: number,
  runTimeSec: number
) => {
  const p = pushups + ageGroupIndex;
  const s = situps + ageGroupIndex;
  const r = runTimeSec - ageGroupIndex * 10;

  return {
    pushups: getScore(p, pushUpAgeScores, true),
    situps: getScore(s, sitUpAgeScores, true),
    run: getScore(r, runAgeScores, false),
  };
};

const getRating = (points: number) => {
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

interface State {
  ageGroupIndex: number;
  pushupCount: number;
  situpCount: number;
  runTime: string;
}

const IpptCommand: App.CommandDefinition<State> = {
  name: 'ippt',
  initialState: {
    ageGroupIndex: -1,
    pushupCount: 0,
    situpCount: 0,
    runTime: '',
  },
  stages: [
    {
      type: 'text',
      trigger: {
        type: 'command',
      },
      async handle() {
        return {
          responses: [
            {
              type: 'text',
              text: 'What is your age group?',
              options: {
                reply_markup: {
                  keyboard: ageGroups.map((text) => {
                    return [
                      {
                        text,
                      },
                    ];
                  }),
                  one_time_keyboard: true,
                  selective: true,
                  resize_keyboard: true,
                },
              },
            },
          ],
        };
      },
    },
    {
      type: 'text',
      trigger: {
        type: 'text',
      },
      async handle(msg, prevState) {
        const ageGroupIndex = ageGroups.indexOf(msg.text ?? '');
        if (ageGroupIndex === -1) {
          return {
            responses: [
              {
                type: 'text',
                text: 'Invalid age group',
              },
            ],
          };
        }

        return {
          responses: [
            {
              type: 'text',
              text: 'How many push-ups?',
            },
          ],
          nextState: {
            ...prevState,
            ageGroupIndex,
          },
        };
      },
    },
    {
      type: 'text',
      trigger: {
        type: 'text',
        matcher: /\d+/,
      },
      async handle(msg, prevState) {
        const pushupCount = parseInt(msg.text ?? '', 10);

        if (isNaN(pushupCount)) {
          return {
            responses: [
              {
                type: 'text',
                text: 'Invalid count, aborting.',
              },
            ],
          };
        }

        return {
          responses: [
            {
              type: 'text',
              text: 'How many sit-ups?',
            },
          ],
          nextState: {
            ...prevState,
            pushupCount,
          },
        };
      },
    },
    {
      type: 'text',
      trigger: {
        type: 'text',
        matcher: /\d+/,
      },
      async handle(msg, prevState) {
        const situpCount = parseInt(msg.text ?? '', 10);

        if (isNaN(situpCount)) {
          return {
            responses: [
              {
                type: 'text',
                text: 'Invalid count, aborting.',
              },
            ],
          };
        }

        return {
          responses: [
            {
              type: 'text',
              text: 'How long was your run?',
            },
          ],
          nextState: {
            ...prevState,
            pushupCount: situpCount,
          },
        };
      },
    },
    {
      type: 'text',
      trigger: {
        type: 'text',
        matcher: /\d+:\d+/,
      },
      async handle(msg, prevState) {
        const [min, sec] = msg.text!.split(':');

        const runTimeSec = parseInt(min, 10) * 60 + parseInt(sec, 10);

        const { ageGroupIndex, pushupCount, situpCount } = prevState;
        const points = calculateScore(
          ageGroupIndex,
          pushupCount,
          situpCount,
          runTimeSec
        );
        const totalScore = points.pushups + points.situps + points.run;

        return {
          responses: [
            {
              type: 'text',
              text: `*${pushupCount}* push-ups = *${points.pushups}* pts
*${situpCount}* sit-ups = *${points.situps}* pts
*${runTimeSec}s* run = *${points.run}* pts
Total pts = *${totalScore}* _(${getRating(totalScore)})_`,
            },
          ],
          nextState: {
            ...prevState,
            runTime: msg.text!,
          },
        };
      },
    },
  ],
};

export default IpptCommand;
