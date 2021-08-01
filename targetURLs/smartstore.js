const puppeteer = require('puppeteer');
const path = require('path');
const dayjs = require("dayjs");
const fs = require('fs');
const axios = require('axios');

// smartstore 이미지 크롤링
async function smartstore(row) {
    
    let browser = {};
    let page = {};

    let today = dayjs().format('YYYY/MM/DD');

    try {
        browser = await puppeteer.launch({
        headless: false,
        args: [
            '--window-size=1920,1080',
            '--disable-notifications',
            "--no-sandbox",
            "--disable-setuid-sandbox",
        ],
        // slowMo : 1 ,
    });
    page = await browser.newPage();
    await page.setViewport({
        width: 1280,
        height: 1080,
    });
    await page.setDefaultNavigationTimeout(0);
    await page.goto(row.url);

    // 브라우져 스크롤 (Infinite Scrolling이미지를 다운받기 위해서)
    await page.evaluate(() => {
        playScroll = setInterval(function() {
            window.scrollBy(0, window.innerHeight);
        }, 500);
        // clearInterval(playScroll);
    });

    await page.waitForTimeout(20000); // 없으면 크롤링 안됨

    // 이미지 크롤링
    console.log('이미지 크롤링 시작.');
    let imgEls = await page.evaluate(() => {
        let imgEls = Array.from(document.querySelectorAll('#INTRODUCE img')).map((v) => {
                let imgSrc = v.src.match(/(https:\/\/).*/g)
                if (imgSrc) {
                    return imgSrc[0];
                }
            }, ""); 
        return imgEls;
    });
    
    // 이미지 저장하기
    if (imgEls) {
        imgEls.forEach(async (v, i) => {
            //imgResult에 이미지들의 버퍼형태 저장
            if (v) {
                let imgResult = await axios.get(String(v), {	//이미지 주소 result.img를 요청
                    responseType: 'arraybuffer',	//buffer가 연속적으로 들어있는 자료 구조를 받아온다
                });
                
                try{
                    fs.writeFileSync(`./tempSave/${i}.png`, new Buffer.from(imgResult.data), 'binary');
                }catch(e){
                    console.log(`fs.writeFileSync fail\n${e}\n-------------------------------\n`);
                };
            }
        });
    }
    await page.waitForTimeout(5000);

    //(状態) 변경
    row.status = '完了';
    await row.save(); // save changes

    await page.close();
    await browser.close();
    console.log('이미지 크롤링 종료.');
    }
    catch(e) {
        console.log(e);
        // 에러값 저장
        row.status = 'エラー';
        await row.save(); // save changes
        await page.close();
        await browser.close();
    } 
}

module.exports.smartstore = smartstore;