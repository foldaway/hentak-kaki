import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DateTime } from 'luxon';

import { getAllSectors } from '../db/getAllSectors';
import { TableNameSubscriber } from '../db/tableNames';
import fetchWeatherData from '../util/fetchWeatherData';

const client = new DynamoDBClient({});
const db = DynamoDBDocument.from(client);

enum Option {
  Check = 'Check a sector',
  Subscribe = 'Subscribe to a sector',
  Unsubscribe = 'Unsubscribe from a sector',
  View = 'View subscriptions',
}

interface State {
  option: Option;
}

async function getSubscriber(chatId: number): Promise<DB.Subscriber | null> {
  const query = await db.get({
    TableName: TableNameSubscriber,
    Key: {
      chatId,
    },
  });

  return (query.Item ?? null) as DB.Subscriber | null;
}

const WeatherCommand: App.CommandDefinition<State> = {
  name: 'weather',
  initialState: {
    option: Option.Check,
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
              text: 'Choose an action.',
              options: {
                reply_markup: {
                  keyboard: Object.values(Option).map((text) => {
                    return [
                      {
                        text,
                      },
                    ];
                  }),
                  one_time_keyboard: true,
                  force_reply: true,
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
          case Option.Check: {
            const sectors = await getAllSectors();

            return {
              responses: [
                {
                  type: 'text',
                  text: 'Select your sector.',
                  options: {
                    reply_markup: {
                      keyboard: sectors.map((sector) => {
                        return [
                          {
                            text: sector.name,
                          },
                        ];
                      }),
                      one_time_keyboard: true,
                      force_reply: true,
                      selective: true,
                      resize_keyboard: true,
                    },
                  },
                },
              ],
              nextState: {
                option: Option.Check,
              },
            };
          }
          case Option.Subscribe: {
            const sectors = await getAllSectors();
            const subscriber = await getSubscriber(msg.chat.id);

            const subscribedSectorNames = new Set(
              subscriber?.sectorNames ?? []
            );

            return {
              responses: [
                {
                  type: 'text',
                  text: 'Select a sector.',
                  options: {
                    reply_markup: {
                      keyboard: sectors
                        .filter(
                          (sector) => !subscribedSectorNames.has(sector.name)
                        )
                        .map((text) => {
                          return [
                            {
                              text,
                            },
                          ];
                        }),
                      one_time_keyboard: true,
                      force_reply: true,
                      selective: true,
                      resize_keyboard: true,
                    },
                  },
                },
              ],
              nextState: {
                option: Option.Subscribe,
              },
            };
          }
          case Option.Unsubscribe: {
            const subscriber = await getSubscriber(msg.chat.id);

            const subscribedSectorNames = subscriber?.sectorNames ?? [];

            if (subscribedSectorNames.length === 0) {
              return {
                responses: [
                  {
                    type: 'text',
                    text: 'You are not subscribed to any sectors',
                  },
                ],
              };
            }

            return {
              responses: [
                {
                  type: 'text',
                  text: 'Select a sector to unsubscribe from.',
                  options: {
                    reply_markup: {
                      keyboard: subscribedSectorNames
                        .sort((a, b) => a.localeCompare(b))
                        .map((text) => {
                          return [
                            {
                              text,
                            },
                          ];
                        }),
                      one_time_keyboard: true,
                      force_reply: true,
                      selective: true,
                      resize_keyboard: true,
                    },
                  },
                },
              ],
              nextState: {
                option: Option.Unsubscribe,
              },
            };
          }
          case Option.View: {
            return {
              responses: [
                {
                  type: 'text',
                  text: 'Are you sure?',
                  options: {
                    reply_markup: {
                      keyboard: [
                        [
                          {
                            text: 'Yes',
                          },
                          {
                            text: 'No',
                          },
                        ],
                      ],
                    },
                    one_time_keyboard: true,
                    force_reply: true,
                    selective: true,
                    resize_keyboard: true,
                  },
                },
              ],
              nextState: {
                option: Option.View,
              },
            };
          }
          default: {
            return {
              responses: [
                {
                  type: 'text',
                  text: 'Sorry, I do not understand.',
                },
              ],
            };
          }
        }
      },
    },
    {
      type: 'text',
      trigger: {
        type: 'text',
      },
      async handle(msg, prevState) {
        switch (prevState.option) {
          case Option.Check: {
            const response = await fetchWeatherData();

            const latestItem = response.items[response.items.length - 1];
            const periodEnd = DateTime.fromJSDate(
              latestItem.valid_period.end
            ).toFormat('HHMM');

            const relevantForecast =
              latestItem.forecasts.find((forecast) => {
                return forecast.area === msg.text;
              }) || null;

            if (relevantForecast === null) {
              return {
                responses: [
                  {
                    type: 'text',
                    text: 'Invalid sector',
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

            const isCatOne = relevantForecast.forecast.match(/Thunder/i);

            return {
              responses: [
                {
                  type: 'text',
                  text: `*${
                    isCatOne ? '' : 'Not'
                  }* Cat 1 (valid until ${periodEnd})`,
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
          case Option.Subscribe: {
            const subscriber = await getSubscriber(msg.chat.id);

            const subscribedSectorNames = subscriber?.sectorNames ?? [];

            const newSubscriber: DB.Subscriber = {
              chatId: msg.chat.id,
              sectorNames: [...subscribedSectorNames, msg.text!],
            };

            await db.put({
              TableName: TableNameSubscriber,
              Item: newSubscriber,
            });

            return {
              responses: [
                {
                  type: 'text',
                  text: 'Subscribed.',
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
          case Option.Unsubscribe: {
            const subscriber = await getSubscriber(msg.chat.id);

            const subscribedSectorNames = new Set(
              subscriber?.sectorNames ?? []
            );

            if (!subscribedSectorNames.has(msg.text ?? '')) {
              return {
                responses: [
                  {
                    type: 'text',
                    text: 'Invalid sector. Action cancelled.',
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

            subscribedSectorNames.delete(msg.text ?? '');

            const newSubscriber: DB.Subscriber = {
              chatId: msg.chat.id,
              sectorNames: Array.from(subscribedSectorNames),
            };

            await db.put({
              TableName: TableNameSubscriber,
              Item: newSubscriber,
            });

            return {
              responses: [
                {
                  type: 'text',
                  text: 'Unsubscribed.',
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
          case Option.View: {
            switch (msg.text) {
              case 'Yes': {
                const subscriber = await getSubscriber(msg.chat.id);

                const subscribedSectorNames = subscriber?.sectorNames ?? [];

                return {
                  responses: [
                    {
                      type: 'text',
                      text: `You are subscribed to:\n\n${subscribedSectorNames
                        .map((name) => `- ${name}  `)
                        .join('\n')}`,
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
              case 'No':
              default: {
                return {
                  responses: [
                    {
                      type: 'text',
                      text: 'Nothing to do.',
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
          }
        }
      },
    },
  ],
};

export default WeatherCommand;
