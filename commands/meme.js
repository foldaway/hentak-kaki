const fetch = require('node-fetch');
const pry = require('pryjs');

const arraySample = array => array[Math.floor(Math.random() * array.length)];

module.exports = async (ctx) => {
  const feed = await fetch(`https://graph.facebook.com/officialsafmemes/posts?access_token=${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}&fields=attachments`)
    .then(r => r.json());

  const chosenPost = arraySample(feed.data.filter(post => post.attachments.data.length > 0));
  const chosenImage = chosenPost.attachments.data[0];
  ctx.replyWithPhoto(chosenImage.media.image.src, {
    caption: chosenImage.description
  });
};
