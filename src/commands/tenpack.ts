const TenpackCommand: App.CommandDefinition = {
  name: 'tenpack',
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
              text: `
*TEN PACK ITEMS*
- No. 4
- Towel
- Admin, Underwear, Socks
- Toiletries
- Accessories
- Sandals
- Mess Tin
- Sandbag & Range card
- RCK
- Water bag

_Additional:_
- ET Blade & Stick
- Ammo Pouch
- Arc of Fire sticks
- Field pack
- ILBV
- Helmet
- Water canteen`,
            },
          ],
        };
      },
    },
  ],
};

export default TenpackCommand;
