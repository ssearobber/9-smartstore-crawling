const { GoogleSpreadsheet } = require('google-spreadsheet');
const { smartstore } = require('./smartstore');
const { googleDrive } = require('./googleDrive');
const path = require('path');
let fs = require('fs');
let rimraf = require("rimraf");

async function googleSheet() {

    // 시트 url중 값
    // Initialize the sheet - doc ID is the long id in the sheets URL
    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SPREAD_ID || googleSpreadId);

    // GOOGLE_API_KEY로 구글API다루는 방법. 읽는것만 가능.
    // doc.useApiKey(process.env.GOOGLE_API_KEY);

    // GOOGLE_SERVICE로 구글API다루는 방법. 편집 가능.
    // Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || googleServiceAccountEmail,
        private_key: process.env.GOOGLE_PRIVATE_KEY || googlePrivateKey,
    });

    // loads document properties and worksheets
    await doc.loadInfo();

    // the likeList 시트ID로 시트취득
    const sheet = doc.sheetsById[process.env.GOOGLE_SHEET_ID || googleSheetId];

    // rows 취득
    const rows = await sheet.getRows();

    // insert data in buyma
    for (i = 1 ; i < rows.length ; i ++) {
        // 승인된 값이 아닌경우 패스
        if(rows[i].status != "承認") continue;

        await rmdir();
        // tempSave폴더 생성
        await mkdir();

        // smartstore 이미지 크롤링
        await smartstore(rows[i]);

        //TODO 구글 드라이브에 저장 
        // await googleDrive(rows[i].productPicture);
        // await googleDrive();

        // tempSave폴더 삭제
        // await rmdir();
    }
}

// tempSave폴더 생성
async function mkdir() {
        await fs.mkdir(path.join(__dirname, '../tempSave'),function(err){
            if(err){
                throw err;
            }
                console.log("새로운 폴더 생성");
        });
}

// tempSave폴더 삭제
async function rmdir() {
        rimraf.sync(path.join(__dirname, '../tempSave'));
}

module.exports.googleSheet = googleSheet;