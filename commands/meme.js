const webdriver = require('selenium-webdriver');
const { By, until, Browser } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

/* eslint-disable no-await-in-loop */

let options = new chrome.Options()
  .addArguments('--headless');

if (process.env.GOOGLE_CHROME_SHIM) {
  options = options.addArguments('--no-sandbox')
    .addArguments('--disable-gpu')
    .setChromeBinaryPath(process.env.GOOGLE_CHROME_SHIM);
}

module.exports = async (ctx) => {
  await ctx.reply('Fetching, this will take a while...');

  let driver = new webdriver.Builder()
    .forBrowser(Browser.CHROME)
    .setChromeOptions(options)
    .build();
  await driver.navigate().to('https://www.instagram.com/memedefsg/');
  await driver.wait(until.elementLocated(By.css('article')), 10000);
  const posts = await driver.findElements(By.css('a[href^="/p/"]'));

  const chosenPost = posts[Math.floor(Math.random() * (posts.length - 1))];
  await driver.executeScript('arguments[0].scrollIntoView()', chosenPost);

  ctx.replyWithChatAction('typing');

  try {
    await chosenPost.click();
  } catch (e) {
    console.error(e);
  }

  await driver.wait(until.elementLocated(By.css('div[role="dialog"]')), 1500);

  let img = await chosenPost.findElement(By.css('img')).getAttribute('src');
  let caption = '(no caption)';

  try {
    await driver.wait(until.elementLocated(By.css('a[title="memedefsg"]')), 2000);
    const authorElem = (await driver.findElements(By.css('a[title="memedefsg"]')))[1];
    caption = await authorElem.findElement(By.xpath('..')).findElement(By.xpath('..')).getText();
    caption = caption.replace(/\s?memedefsg\s?/i, '');
  } catch (e) { console.error(e); }

  await driver.quit();
  if (img) {
    ctx.replyWithPhoto(img, {
      caption
    });
  } else {
    ctx.reply(caption);
  }
};
