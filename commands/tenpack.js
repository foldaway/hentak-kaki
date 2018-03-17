module.exports = (ctx) => ctx.replyWithMarkdown(`
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
- Water canteen
`, {
  reply_to_message_id: ctx.update.message.message_id
});
