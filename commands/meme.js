const fetch = require('node-fetch');
const cheerio = require('cheerio');

/* eslint-disable no-await-in-loop */

module.exports = async (ctx) => {
  let url = 'https://www.facebook.com/pages_reaction_units/more/?page_id=1562306407140115&cursor={%22timeline_section_cursor%22:{},%22has_next_page%22:true}&surface=www_pages_posts&unit_count=8&__user=0&__a=1';

  ctx.replyWithChatAction('typing');

  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.1 Safari/605.1.15' },
  }).then(r => r.text())
    .then(r => r.match(/"__html":"(.*?)"}]],"jsmods"/)[1]);

  const decodedResp = JSON.parse(`"${response}"`).slice(1, -1);

  const $ = cheerio.load(decodedResp);
  const nodes = $('.userContent, .scaledImageFitWidth').toArray();

  const posts = [];

  for (let index = 0; index < nodes.length; index += 1) {
    const element = nodes[index];
    const nextElement = nodes[index + 1];
    const post = {};
    if (element.name === 'div') {
      post.text = $(element).find('p')
        .toArray()
        .map(x => $(x))
        .map(x => x.text())
        .join(' ');

      if (nextElement && nextElement.name === 'img') {
        post.imgSrc = $(nextElement).attr('src');
        index += 1;
      }

      posts.push(post);
    }
  }

  const chosenPost = posts[Math.floor(Math.random() * posts.length)];

  if (chosenPost.imgSrc) {
    ctx.replyWithPhoto(chosenPost.imgSrc, {
      caption: chosenPost.text
    });
  } else {
    ctx.reply(chosenPost.text);
  }
};
