const webdriver = require('selenium-webdriver');
const { By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
require('geckodriver');

/* eslint-disable no-await-in-loop */

const options = new firefox.Options()
  .addArguments('--headless');

module.exports = async (ctx) => {
  await ctx.reply('Fetching, this will take a while...');

  let driver = new webdriver.Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build();
  await driver.navigate().to('https://www.facebook.com/pg/MemedefSG/photos/?ref=page_internal');
  await driver.wait(until.elementLocated(By.css('._2eea')), 10000);
  const posts = await driver.findElements(By.css('._2eea'));

  const chosenPost = posts[Math.floor(Math.random() * (posts.length - 1))];
  await driver.executeScript('arguments[0].scrollIntoView()', chosenPost);

  ctx.replyWithChatAction('typing');

  try {
    await chosenPost.click();
  } catch (e) {
    console.error(e);
    try {
      const notNowButton = await driver.findElement(By.id('#expanding_cta_close_button'));
      await notNowButton.click();
      await chosenPost.click();
    } catch (ee) {
      throw ee;
    }
  }

  await driver.wait(until.elementLocated(By.css('._n3')), 1500);

  let img = null;
  let caption = '(no caption)';

  try {
    await driver.wait(until.elementLocated(By.css('.hasCaption')), 2000);
    caption = await (await driver.findElement(By.css('.hasCaption'))).getText();
  } catch (e) { console.error(e); }

  try {
    await driver.wait(until.elementLocated(By.css('img.spotlight')), 2000);
    img = await (await driver.findElement(By.css('img.spotlight'))).getAttribute('src');
  } catch (e) { console.error(e); }

  if (img) {
    ctx.replyWithPhoto(img, {
      caption
    });
  } else {
    ctx.reply(caption);
  }

  await driver.quit();
};
