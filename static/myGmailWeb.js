// https://developers.google.com/gmail/api/quickstart/js?hl=ja

const myGmailWeb = {};

{
  // TODO(developer): Set to client ID and API key from the Developer Console
  const CLIENT_ID = '656639514271-d5kjb0i7nffu4le1a93lan08pqr45rq2.apps.googleusercontent.com';
  const API_KEY = 'AIzaSyAXBdTJP_R4vgF9mBtFTvFKCgDpApPR2X0';

  // Discovery doc URL for APIs used by the quickstart
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

  // Authorization scopes required by the API; multiple scopes can be
  // included, separated by spaces.
  const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

  let tokenClient;
  let gapiInited = false;
  let gisInited = false;


  /**
   * Callback after api.js is loaded.
   */
  myGmailWeb.gapiLoaded = function() {
    gapi.load('client', initializeGapiClient);
  };

  /**
   * Callback after the API client is loaded. Loads the
   * discovery doc to initialize the API.
   */
  async function initializeGapiClient() {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
  }

  /**
   * Callback after Google Identity Services are loaded.
   */
  myGmailWeb.gisLoaded = function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later
    });
  };

  /**
   *  Sign in the user upon button click.
   */
  myGmailWeb.auth = function() {
    tokenClient.callback = async (resp) => {
      if (resp.error !== undefined) {
        throw (resp);
      }
      console.log(resp)
    };

    if (gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({
        prompt: 'consent'
      });
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({
        prompt: ''
      });
    }
  }

  /**
   *  Sign out the user upon button click.
   */
  myGmailWeb.signout = function() {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token);
      gapi.client.setToken('');
    }
  }

  /**
   * Print all Labels in the authorized user's inbox. If no labels
   * are found an appropriate message is printed.
   */
  myGmailWeb.listLabels = async function() {
    const response = await gapi.client.gmail.users.labels.list({
      'userId': 'me',
    });
    const labels = response.result.labels;
    return labels
  };

  // Create Mail
  myGmailWeb.createMail = function(params) {
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
  myGmailWeb.sendMail = async function(to, subject, message) {
    const userProfile = await gapi.client.gmail.users.getProfile({
      userId: "me"
    });
    const myEmailAddress = userProfile.data.emailAddress;
    const raw = createMail({
      to: to,
      from: myEmailAddress,
      subject: subject,
      message: message
    });
    const sentMsg = await gapi.client.gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw,
      },
    });
    return sentMsg
  }

  // Send Alert Mail
  myGmailWeb.sendAlertMail = function(subject, message_text) {
    sendMail("sdkn104home", "sdkn104@yahoo.co.jp;sdkn104@gmail.com", subject, message_text)
  };

  // return message list or {error:xxx}
  myGmailWeb.listMessages = async function(labelIds = [], messageCount = 100) {
    //console.log(labelIds)
    const res = await gapi.client.gmail.users.messages.list({
      userId: 'me',
      labelIds: labelIds,
      maxResults: messageCount,
    });
    console.log(res)
    if (!res.result.messages) {
      return [];
    }

    let results = [];
    for (let msg of res.result.messages) {
      let result = {};
      const topid = msg.id;
      //console.log(`- ${topid}`);
      const message = await gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: topid
      });
      console.log(message)
      try {
        
      const headers = message.result.payload.headers;
      //console.log("-------------------------")
      //console.log(headers)
      result.id = msg.id;
      result.Subject = headers.find(e => e.name.toLowerCase() === "subject").value;
      result.From = headers.find(e => e.name.toLowerCase() === "from").value;
      result.To = headers.find(e => e.name.toLowerCase() === "to").value;
      result.Date = headers.find(e => e.name.toLowerCase() === "date").value;
      console.log("Subject: " + result.Subject)
      //console.log(message.data.payload)
      let base64urlMailBody;
      if (message.result.payload.parts) {
        //console.log(message.data.payload.parts[0].body)
        base64urlMailBody = message.result.payload.parts[0].body.data; //parts[0]がテキスト、parts[1]がHTMLメールっぽい
      } else {
        base64urlMailBody = message.result.payload.body.data;
      }
      // devode base64url  https://pote-chil.com/posts/javascript-base64-encode-decode
      const base64mailBody = base64urlMailBody?.replace(/-/g, "+")?.replace(/_/g, "/")
      //console.log(base64mailBody)
      //result.Body = Buffer.from(base64mailBody, 'base64').toString(); //メール本文はBase64になってるので変
      const utf8Array = Uint8Array.from(
        Array.from(atob(base64mailBody)).map((s) => s.charCodeAt(0))
      );
      result.Body = new TextDecoder().decode(utf8Array);
      
      } catch(err) {
        console.log(err)
        result.Subject = "error."
      }
      
      
      results.push(result)
    }
    //console.log(results);
    return results;
  }
}


// delete message 
myGmailWeb.deleteMessage = async function(msgid) {
  console.log(msgid)
  const res = await gapi.client.gmail.users.messages.delete({
    userId: "me",
    id: msgid,
  });
  console.log(res);
  return res;
}

//<script async defer src="https://apis.google.com/js/api.js" onload="gapiLoaded()"></script>
//<script async defer src="https://accounts.google.com/gsi/client" onload="gisLoaded()"></script>
