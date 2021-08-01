const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); 


const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || googleClientId;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || googleClientSecret;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || googleRedirectUri;

let REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN || googleRefreshToken;

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client,
});

// image폴더id
const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || googleDriveFolderId;
// image폴더안에 있는 폴더명들 격납
let folderNameArray = [];
// image폴더안에 있는 폴더명들중 가장 큰 수 격납
let folderMaxNum = 0;


async function googleDrive() {

    folderNameArray = await getFolderName();
    folderNameArray.sort();
    folderMaxNum = Number(folderNameArray[`${folderNameArray.length - 1}`].name);
    // 구글 드라이브 안에 폴더 생성
    await makeFolder(String(folderMaxNum+1));
    // folderNameArray.forEach(async (v) => {
    //     if (v.name == folderName) {
    //         fileNameArray = await getFileName(v.id);
    //             fileNameArray.forEach(async (v) => {
    //                 await downloadFile(v.id, v.name);
    //             })
    //     };
    // });
}

/**
 * 폴더명 가져오기
 * @return {response.data.files} folder array
 */
async function getFolderName() {
  try {
    const response = await drive.files.list({
        maxResults: 10,
        orderBy: 'createdTime',
        q: `'${folderId}' in parents`,
    });
    return response.data.files;
  } catch (error) {
    console.log('getFolderName 에러',error.message);
  }
}

/**
 * 파일명 가져오기
 * @param {response.data.files.id} folderId
 * @return {response.data.files} files array
 */
async function getFileName( folderId ) {
  try {
    const response = await drive.files.list({
        maxResults: 10,
        orderBy: 'createdTime',
        q: `'${folderId}' in parents`,
    });
    return response.data.files;
  } catch (error) {
    console.log('getFileName 에러',error.message);
  }
}

/**
 * 파일 다운로드
 * @param {response.data.files.id} folderId
 */
async function downloadFile( fileId , fileName) {
    let dest = fs.createWriteStream(path.join(__dirname, `../tempSave/${fileName}`));
    drive.files.get({
        fileId : `${fileId}`,
        alt: 'media',
    },{ 
        responseType: 'stream'
    },  
      function(err, response){
        if(err)return console.log("err",err); 
        response.data.on('error', err => {
             console.log('downloadFile 에러', err)
        }).on('end', ()=>{
            console.log('Done downloadFile');
        })
         .pipe(dest);
        });
}

/**
 * 드라이브에 폴더 생성
 * @param {response.data.name} folderName
 */
async function makeFolder(folderName) {
  try {
    const response = await drive.files.create({
      requestBody: {
        name: `${folderName}`,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [`${folderId}`],
      }
    });
    console.log(response.data);
  } catch (error) {
    console.log(error.message);
  }
}

/**
 * 파일 업로드
 * @return {response.data.files} files array
 */
// const filePath = path.join(__dirname, 'example.jpg');
// async function uploadFile() {
//   try {
//     const response = await drive.files.create({
//       requestBody: {
//         name: 'example.jpeg', //This can be name of your choice
//         mimeType: 'image/jpeg',
//       },
//       media: {
//         mimeType: 'image/jpeg',
//         body: fs.createReadStream(filePath),
//       },
//     });

//     console.log(response.data);
//   } catch (error) {
//     console.log(error.message);
//   }
// }

module.exports.googleDrive = googleDrive;


