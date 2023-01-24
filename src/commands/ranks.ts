const MEDIA = [
  {
    media: 'https://i.imgur.com/MNnUVUz.png',
    caption: 'Enlisted Personnel Ranks',
    type: 'photo',
  },
  {
    media: 'https://i.imgur.com/pxNtRqg.png',
    caption: 'Specialist Ranks',
    type: 'photo',
  },
  {
    media: 'https://i.imgur.com/yGxRQRS.png',
    caption: 'Warrant Officer Ranks',
    type: 'photo',
  },
  {
    media: 'https://i.imgur.com/Ap0DbVX.png',
    caption: 'Junior Officer Ranks',
    type: 'photo',
  },
  {
    media: 'https://i.imgur.com/P9XRE5i.png',
    caption: 'Senior Officer Ranks',
    type: 'photo',
  },
  {
    media: 'https://i.imgur.com/KZ5oXIs.png',
    caption: 'General Level Ranks',
    type: 'photo',
  },
  {
    media: 'https://i.imgur.com/lM8rGKU.png',
    caption: 'Military Domain Experts Ranks',
    type: 'photo',
  },
  {
    media: 'https://i.imgur.com/JKyhP4w.png',
    caption: 'SAF Volunteers Corps Ranks',
    type: 'photo',
  },
];

const RanksCommand: App.CommandDefinition = {
  name: 'ranks',
  initialState: undefined,
  stages: [
    {
      type: 'text',
      trigger: {
        type: 'command',
      },
      async handle() {
        return {
          responses: MEDIA.map((media) => {
            return {
              type: 'photo',
              data: media.media,
            };
          }),
        };
      },
    },
  ],
};

export default RanksCommand;
