const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// ===== AUTHENTICATION ======================================================

const USER_CREDENTIALS = {
    sdkn104home: {
        // If modifying these scopes, delete CLIENT_TOKEN_FILE.
        SCOPES : ['https://www.googleapis.com/auth/gmail.send','https://www.googleapis.com/auth/gmail.readonly'],
        // The file token.json stores the user's access and refresh tokens, and is
        // created automatically when the authorization flow completes for the first
        // time.
        CLIENT_SECRET_FILE : 'credentials/client_secret.json',
        CLIENT_TOKEN_FILE : "credentials/gmail-token.json",
    },
    sdkn104: {
        // If modifying these scopes, delete CLIENT_TOKEN_FILE.
        SCOPES : ['https://www.googleapis.com/auth/gmail.send','https://mail.google.com/'],
        // The file token.json stores the user's access and refresh tokens, and is
        // created automatically when the authorization flow completes for the first
        // time.
        CLIENT_SECRET_FILE : 'credentials/client_secret_sdkn104@gmail.com.json',
        CLIENT_TOKEN_FILE : "credentials/gmail-token_sdkn104@gmail.com.json",
    }
}

// Get Authorized Client and return Promise
function getAuthrizedClient(user = "sdkn104home") {
    return new Promise((resolve, reject) => {
        loadClientSecrets(user, resolve);
    });
}

// Load client secrets from a local file.
function loadClientSecrets(user, callback) {
    fs.readFile(USER_CREDENTIALS[user].CLIENT_SECRET_FILE, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);
        // Authorize a client with credentials, then call the Gmail API.
        authorize(user, JSON.parse(content), callback);
    });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(user, credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(USER_CREDENTIALS[user].CLIENT_TOKEN_FILE, (err, token) => {
    if (err) return getNewToken(user, oAuth2Client, callback);
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
function getNewToken(user, oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: USER_CREDENTIALS[user].SCOPES,
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
      fs.writeFile(USER_CREDENTIALS[user].CLIENT_TOKEN_FILE, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', USER_CREDENTIALS[user].CLIENT_TOKEN_FILE);
      });
      callback(oAuth2Client);
    });
  });
}

// ===== BODY ======================================================

// Create Mail
function createMail(params) {
    params.subject = new Buffer.from(params.subject).toString("base64"); //日本語対応
    const str = [
        `Content-Type: text/plain; charset=\"UTF-8\"\n`,
        `MIME-Version: 1.0\n`,
        `Content-Transfer-Encoding: 7bit\n`,
        `to: ${params.to} \n`,
        `from: ${params.from} \n`,
        `subject: =?UTF-8?B?${params.subject}?= \n\n`,
        params.message
    ].join('');
    return Buffer.from(str).toString("base64").replace(/\+/g, '-').replace(/\//g, '_');
}

// Send Mail
async function sendMail(user = "sdkn104home", to, subject, message) {
    try {
        const oAuth2Client = await getAuthrizedClient(user);
        const gmail = google.gmail({version: 'v1', auth: oAuth2Client});
        const userProfile = await gmail.users.getProfile({userId:"me"});
        const myEmailAddress = userProfile.data.emailAddress;
        const raw = createMail({to:to, from:myEmailAddress, subject:subject, message:message});
        const sentMsg = await gmail.users.messages.send({
            userId: "me",
            requestBody: {
                raw,
            },
        });
        return {message:sentMsg};
    } catch(err){
        console.log(err)
        return {error:err.stack || err.toString()}        
    }
}

// Send Alert Mail
function sendAlertMail(subject, message_text) {
    sendMail("sdkn104home", "sdkn104@yahoo.co.jp;sdkn104@gmail.com", subject, message_text)
}

// return label list or {error:xxx}
async function listLabels(user = "sdkn104home") {
    try {   
        const oAuth2Client = await getAuthrizedClient(user);
        const gmail = google.gmail({version: 'v1', auth: oAuth2Client});
        const userProfile = await gmail.users.getProfile({userId:"me"});
        const res = await gmail.users.labels.list({
                userId: 'me',
        });
        //console.log(res.data.labels)    
        return res.data.labels;
    } catch(err){
        console.log(err)
        return {error:err.stack || err.toString()}        
    }
}

// return message list or {error:xxx}
async function listMessages(user = "sdkn104home", labelIds = [], messageCount = 10) {
    //console.log(labelIds)
    try {
        const oAuth2Client = await getAuthrizedClient(user);
        const gmail = google.gmail({version: 'v1', auth: oAuth2Client});
        const res = await gmail.users.messages.list({
                userId: 'me',
                labelIds: labelIds,
                maxResults: messageCount,
        });
        if( !res.data.messages ) {
            return [];
        }

        let results = [];
        for(let msg of res.data.messages){   
            let result = {};
            try {
                const topid = msg.id;
                //console.log(`- ${topid}`);
                const message = await gmail.users.messages.get({userId:'me', id:topid});
                const headers = message.data.payload.headers;
                //console.log("-------------------------")
                //console.log(headers)
                result.id = msg.id;
                result.Subject = headers.find(e => e.name.toLowerCase() === "subject").value;
                result.From = headers.find(e => e.name.toLowerCase() === "from").value;
                result.To = headers.find(e => e.name.toLowerCase() === "to").value;
                result.Date = headers.find(e => e.name.toLowerCase() === "date").value;
                console.log("Subject: "+result.Subject)
                //console.log(message.data.payload)
                let base64mailBody;
                if( message.data.payload.parts ){
                    //console.log(message.data.payload.parts[0].body)
                    base64mailBody = message.data.payload.parts[0].body.data; //parts[0]がテキスト、parts[1]がHTMLメールっぽい
                } else {
                    base64mailBody = message.data.payload.body.data;
                }
                result.Body = Buffer.from(base64mailBody, 'base64').toString(); //メール本文はBase64になってるので変換
            } catch(err){
                console.log(err.stack || err.toString())   
                result.Body = result.Body + "\n\n---- Error Occur in reading this message -----\n" + (err.stack || err.toString())                             
            } finally {
                results.push(result)
            }
        }
        //console.log(results);
        return results;
    } catch(err){
        console.log(err)
        return {error:err.stack || err.toString()}        
    }
}


// delete message 
async function deleteMessage(user = "sdkn104home", msgid) {
    console.log(msgid)
    try {
        const oAuth2Client = await getAuthrizedClient(user);
        const gmail = google.gmail({version: 'v1', auth: oAuth2Client});
        let res = await gmail.users.messages.delete({
            userId: "me",
            id: msgid,
        });
        console.log(res);
        return {status:"OK"};
    } catch(err){
        console.log(err)
        return {error:err.stack || err.toString()}        
    }
}


// --- MAIN
if (require.main === module) { 
    console.log('called directly'); 
    sendMail("sdkn104home", "sdkn104@yahoo.co.jp", "test", "testbody")
    sendAlertMail("subj", "message...")
    //return;
    //listMessages("sdkn104home")
    listMessages("sdkn104")
    .then(results => {
        results = results.map(e => {e.Body = e.Body.slice(0,500); return e;})
        console.log(results)
    });
    listLabels().then(labels => {
        //console.log(labels)
    });
} else { 
    console.log('required as a module'); 
}

// --- EXPORT
exports.listMessages = listMessages;
exports.deleteMessage = deleteMessage
exports.listLabels = listLabels;
exports.sendMail = sendMail;
exports.sendAlertMail = sendAlertMail;
