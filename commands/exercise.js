module.exports = {
    initialHandler: (ctx) => {
	ctx.reply('What kind of exercise:',{
	    reply_markup:{
		keyboard:[
		    [{ text: '5BX'}],
		    [{ text: 'SAF Warm Ups'}]
		],
		one_time_keyboard: true,
		selective: true
	    }
	});
    },

    responseHandlers: {
	'5BX': (ctx) => ctx.replyWithMarkdown(`
	*5BX:*
	1. Jumping Jacks
	2. High Jumper
	3. Crunches
	4. Push up
	5. Run
	`),

	'SAF Warm Ups': (ctx) => ctx.replyWithMarkdown(`
	*SAF Warm Ups:*
	1. Jogging on the Spot
	2. Jumping Jacks
	3. Pectoral Stretch
	4. High Jumper
	5. Side Stretch
	6. Quad Stretch
	7. Hamstring Stretch
	8. Calf Stretch
	`)
    },
    responseHandler: (ctx) => ctx.reply('ciao recruit')
};