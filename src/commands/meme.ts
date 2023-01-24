import puppeteer from 'puppeteer';

const MemeCommand: App.CommandDefinition = {
  name: 'meme',
  initialState: undefined,
  stages: [
    {
      type: 'text',
      trigger: {
        type: 'command',
      },
      async handle() {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto('https://www.instagram.com/memedefsg/');
        await page.waitForSelector('article', { timeout: 10000 });

        // Load more posts
        for (let i = 0; i < 5; i += 1) {
          await page.evaluate(() => window.scrollBy(0, window.innerHeight));
          await page.waitForTimeout(600);
        }

        const posts = await page.$$('a[href^="/p/"]');
        console.log(`Loaded ${posts.length} posts`);

        const chosenPost =
          posts[Math.floor(Math.random() * (posts.length - 1))];
        await chosenPost.focus();

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
            const textContent = await authorElemGrandParent.getProperty(
              'textContent'
            );
            caption = (await textContent.jsonValue())!;
            caption = caption.replace(/\s?memedefsg\s?/i, '');
          }
        } catch (e) {
          console.error(e);
        }

        try {
          await page.waitForFunction(
            () => document.querySelectorAll('article').length >= 2,
            { timeout: 3000 }
          );
          const article = (await page.$$('article'))[1];
          const imgElem = await article.$('img[style*="object-fit"]');
          img = await (await imgElem!.getProperty('src')).jsonValue();
        } catch (e) {
          console.error(e);
        }

        await browser.close();

        return {
          responses:
            img != null
              ? [
                  {
                    type: 'photo',
                    data: img,
                  },
                  {
                    type: 'text',
                    text: caption,
                  },
                ]
              : [
                  {
                    type: 'text',
                    text: caption,
                  },
                ],
        };
      },
    },
  ],
};

export default MemeCommand;
