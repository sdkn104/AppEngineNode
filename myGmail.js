const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// ===== AUTHENTICATION ======================================================

// If modifying these scopes, delete CLIENT_TOKEN_FILE.
const SCOPES = ['https://www.googleapis.com/auth/gmail.send','https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const CLIENT_SECRET_FILE = 'credentials/client_secret.json'
const CLIENT_TOKEN_FILE = "credentials/gmail-token.json"

// Get Authorized Client and return Promise
function getAuthrizedClient() {
    return new Promise((resolve, reject) => {
        loadClientSecrets(resolve);
    });
}

// Load client secrets from a local file.
function loadClientSecrets(callback) {
    fs.readFile(CLIENT_SECRET_FILE, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Gmail API.
        authorize(JSON.parse(content), callback);
    });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(CLIENT_TOKEN_FILE, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(CLIENT_TOKEN_FILE, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', CLIENT_TOKEN_FILE);
      });
      callback(oAuth2Client);
    });
  });
}

// ===== BODY ======================================================


async function listMessages(messageCount = 10) {
    const oAuth2Client = await getAuthrizedClient();
    const gmail = google.gmail({version: 'v1', auth: oAuth2Client});

    const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults: messageCount,
    })
    .catch((err) => {
        console.log('The API returned an error: ' + err);
    });
    console.log(res.data.messages)    
  
    let results = [];
    for(let msg of res.data.messages){   
        const topid = msg.id;
        //console.log(`- ${topid}`);
        const message = await gmail.users.messages.get({userId:'me', id:topid});
        const headers = message.data.payload.headers;
        //console.log("-------------------------")
        let result = {};
        //console.log(headers)
        result.Subject = headers.find(e => e.name.toLowerCase() === "subject").value;
        result.From = headers.find(e => e.name.toLowerCase() === "from").value;
        result.To = headers.find(e => e.name.toLowerCase() === "to").value;
        result.Date = headers.find(e => e.name.toLowerCase() === "date").value;
        //console.log(message.data.payload)
        let base64mailBody;
        if( message.data.payload.parts ){
            base64mailBody = message.data.payload.parts[0].body.data; //parts[0]がテキスト、parts[1]がHTMLメールっぽい
        } else {
            base64mailBody = message.data.payload.body.data;
        }
        const mailBody = Buffer.from(base64mailBody, 'base64').toString(); //メール本文はBase64になってるので変換
        result.Body = mailBody;
        console.log("Subject: "+result.Subject)
        results.push(result)
    }
    //console.log(results);
    return results;
}

// --- MAIN
if (require.main === module) { 
    console.log('called directly'); 
    listMessages()
    .then(results => {
        results = results.map(e => {e.Body = e.Body.slice(0,500); return e;})
        console.log(results)
    });
} else { 
    console.log('required as a module'); 
}

// --- EXPORT
exports.listMessages = listMessages;
