      /* exported gapiLoaded */
      /* exported gisLoaded */
      /* exported handleAuthClick */
      /* exported handleSignoutClick */
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
      myGmailWeb.gapiLoaded = function () {
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
      myGmailWeb.auth = function () {
        tokenClient.callback = async (resp) => {
          if (resp.error !== undefined) {
            throw (resp);
          }
          console.log(resp)
        };

        if (gapi.client.getToken() === null) {
          // Prompt the user to select a Google Account and ask for consent to share their data
          // when establishing a new session.
          tokenClient.requestAccessToken({prompt: 'consent'});
        } else {
          // Skip display of account chooser and consent dialog for an existing session.
          tokenClient.requestAccessToken({prompt: ''});
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
      myGmailWeb.listLabels = async function () {
        let response;
        try {
          response = await gapi.client.gmail.users.labels.list({
            'userId': 'me',
          });
        } catch (err) {
          throw err.message;
          return;
        }
        const labels = response.result.labels;
        if (!labels || labels.length == 0) {
          document.getElementById('content').innerText = 'No labels found.';
          return;
        }
        // Flatten to string to display
        const output = labels.reduce(
            (str, label) => `${str}${label.name}\n`,
            'Labels:\n');
        document.getElementById('content').innerText = output;
      }
}

    //<script async defer src="https://apis.google.com/js/api.js" onload="gapiLoaded()"></script>
    //<script async defer src="https://accounts.google.com/gsi/client" onload="gisLoaded()"></script>

