const webdriver = require('selenium-webdriver');
const { By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

/* eslint-disable no-await-in-loop */

const options = new firefox.Options()
  .addArguments('--headless');

module.exports = async (ctx) => {
  await ctx.reply('Fetching, this will take a while...');
  ctx.replyWithChatAction('typing');

  let driver = new webdriver.Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .build();
  await driver.navigate().to('https://www.facebook.com/pg/MemedefSG/photos/?ref=page_internal');
  await driver.wait(until.elementLocated(By.css('._2eea')), 10000);
  const posts = await driver.findElements(By.css('._2eea'));

  const chosenPost = posts[Math.floor(Math.random() * (posts.length - 1))];
  await driver.executeScript('arguments[0].scrollIntoView()', chosenPost);

  try {
    await chosenPost.click();
  } catch (e) {
    console.error(e);
    const notNowButton = await driver.findElement(By.id('#expanding_cta_close_button'));
    await notNowButton.click();
    await chosenPost.click();
  }

  await driver.wait(until.elementLocated(By.css('._n3')), 1500);

  let img = null;
  let caption = '(no caption)';

  try {
    await driver.wait(until.elementLocated(By.css('.hasCaption')), 2000);
    caption = await (await driver.findElement(By.css('.hasCaption'))).getText();
  } catch (e) {}

  try {
    await driver.wait(until.elementLocated(By.css('img.spotlight')), 2000);
    img = await (await driver.findElement(By.css('img.spotlight'))).getAttribute('src');
  } catch (e) {}

  if (img) {
    ctx.replyWithPhoto(img, {
      caption
    });
  } else {
    ctx.reply(caption);
  }

  await driver.quit();
};
