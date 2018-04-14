const fetch = require('node-fetch');

const arraySample = array => array[Math.floor(Math.random() * array.length)];

module.exports = async (ctx) => {
  const posts = [];
  let url = `https://graph.facebook.com/officialsafmemes/posts?access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}&fields=attachments&limit=100`;
  let response = null;

  ctx.replyWithChatAction('typing');

  do {
    response = await fetch(url) // eslint-disable-line no-await-in-loop
      .then(r => r.json());
    posts.push(...response.data);
    url = response.paging.next;
  } while ('next' in response);

  const chosenPost = arraySample(posts.filter(post => 'attachments' in post)
    .filter(post => post.attachments.data.length > 0));

  const chosenAtt = chosenPost.attachments.data[0];
  if (chosenAtt.type === 'photo') {
    ctx.replyWithPhoto(chosenAtt.media.image.src, {
      caption: chosenAtt.description
    });
  } else {
    ctx.reply(chosenAtt.url);
  }
};
