const puppeteer = require('puppeteer');

/* eslint-disable no-await-in-loop */

const options = {
  headless: true
};

if (process.env.GOOGLE_CHROME_SHIM) {
  options.args = ['--no-sandbox', '--disable-gpu'];
  options.executablePath = process.env.GOOGLE_CHROME_SHIM;
}

module.exports = async (ctx) => {
  await ctx.reply('Fetching, this will take a while...');

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();

  await page.goto('https://www.instagram.com/memedefsg/');
  await page.waitForSelector('article', { timeout: 10000 });

  // Load more posts
  for (let i = 0; i < 5; i += 1) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitFor(600);
  }

  const posts = await page.$$('a[href^="/p/"]');
  console.log(`Loaded ${posts.length} posts`);

  const chosenPost = posts[Math.floor(Math.random() * (posts.length - 1))];
  await chosenPost.focus();

  ctx.replyWithChatAction('typing');

  try {
    await chosenPost.click();
  } catch (e) {
    console.error(e);
  }

  await page.waitForSelector('div[role="dialog"]', { timeout: 1500 });

  let img = null;
  let caption = '(no caption)';

  try {
    await page.waitForSelector('a[title="memedefsg"]', { timeout: 2000 });
    const authorElem = (await page.$$('a[title="memedefsg"]'))[1];
    if (authorElem) {
      const authorElemGrandParent = (await authorElem.$x('../..'))[0];
      caption = await (await authorElemGrandParent.getProperty('textContent')).jsonValue();
      caption = caption.replace(/\s?memedefsg\s?/i, '');
    }
  } catch (e) { console.error(e); }

  try {
    await page.waitForFunction(() => document.querySelectorAll('article').length >= 2, { timeout: 3000 });
    const article = (await page.$$('article'))[1];
    const imgElem = await article.$('img[style*="object-fit"]');
    img = await (await imgElem.getProperty('src')).jsonValue();
  } catch (e) { console.error(e); }

  await browser.close();

  if (img) {
    ctx.replyWithPhoto(img, {
      caption
    });
  } else {
    ctx.reply(caption);
  }
};
