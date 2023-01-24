const ExerciseCommand: App.CommandDefinition = {
  name: 'exercise',
  initialState: undefined,
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
              text: 'What kind of exercise:',
              options: {
                reply_markup: {
                  keyboard: [[{ text: '5BX' }], [{ text: 'SAF Warm Ups' }]],
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
      async handle(msg) {
        switch (msg.text) {
          case '5BX': {
            return {
              responses: [
                {
                  type: 'text',
                  text: `
*5BX:*
1. Jumping Jacks
2. High Jumper
3. Crunches
4. Push up
5. Run
`,
                  options: {
                    reply_markup: {
                      remove_keyboard: true,
                      selective: true,
                    },
                  },
                },
              ],
            };
          }
          case 'SAF Warm Ups':
          default: {
            return {
              responses: [
                {
                  type: 'text',
                  text: `
*SAF Warm Ups:*
1. Jogging on the Spot
2. Jumping Jacks
3. Pectoral Stretch
4. High Jumper
5. Side Stretch
6. Quad Stretch
7. Hamstring Stretch
8. Calf Stretch
`,
                  options: {
                    reply_markup: {
                      remove_keyboard: true,
                      selective: true,
                    },
                  },
                },
              ],
            };
          }
        }
      },
    },
  ],
};

export default ExerciseCommand;
