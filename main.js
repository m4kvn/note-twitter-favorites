require('dotenv').config();

const util = require('util')
const puppeteer = require('puppeteer');

const NOTE_ID = process.env.NOTE_ID;
const NOTE_PW = process.env.NOTE_PW;

const Twitter = require('twitter');
const client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

(async () => {
    const params = {
        count: 100,
    };
    const result = await client.get('favorites/list', params);
    const urls = result.map((tweet) => {
        const screenName = tweet.user.screen_name;
        const tweetID = tweet.id_str;
        return "https://twitter.com/" + screenName + "/status/" + tweetID
    });
    const tweetCount = urls.length;
    console.log(urls);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({
        width: 1600,
        height: 1200,
    });
    await page.goto('https://note.com/login');

    await page.type('input[name=login]', NOTE_ID);
    await page.type('input[name=password]', NOTE_PW);

    const loginButton = await page.$('.logining_msg')
    await Promise.all([
        page.waitForNavigation(),
        loginButton.click()
    ]);

    await Promise.all([
        page.waitForNavigation(),
        page.goto('https://note.com/notes/new')
    ]);
    
    await page.focus('#note-name');
    await page.keyboard.type('Twitterでふぁぼったイラストを集めてみた(直近' + tweetCount + '件)');

    await page.focus('#note-body');
    await page.keyboard.type('自分がフォローしているクリエイターの作品をより多くの人に知ってもらうため、直近でふぁぼったツイートを一覧にしてみました。');
    await page.keyboard.press('Enter');

    for (var i = 0; i < tweetCount; i++) {
        console.log('[' + i + ']' + 'processing to write ' + urls[i]);
        await page.keyboard.type(urls[i]);
        await page.keyboard.press('Enter');
        await page.waitFor(3000);
    }
    
    await page.click('button[data-type="primary"]');
    await page.waitFor(5000);

    const nodeList = await page.$$('button[data-type="primary"]');
    await nodeList[1].click();
    await page.waitFor(5000);

    await browser.close();
})();
