'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const Private = require('./Private.js')
const myGmail = require('./myGmail.js')
const myYahooMail = require('./myYahooMail.js')
//console.log(require)

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));


function loginCheck(req){
    const html = "<form method='POST'>User Name<input type='text' name=username><br>Password<input type='password' name='password'><br><input type='submit'></form>"
    console.log(req.method)
    console.log(req.body.username)
    if( req.method === "POST" && req.body.username === Private.app_username && req.body.password === Private.app_password) {
        console.log(req.method)
        return null;
    } else {
        return html;
    }
}


app.get('/', (req, res) => {
    res.status(200).send('Hello, world! I am App Engine by NodeJS').end();
});

app.all('/gmail_list', (req, res) => {
    let loginForm  = loginCheck(req);
    if(loginForm) {
        res.status(200).send(loginForm).end();
        return;
    }
    myGmail.listMessages()
    .then(msgList => {
        const html = JSON.stringify(msgList, null, 4).replace(/\n/g, "<br>\n");
        res.status(200).send(html).end();
    })
    .catch(err => {
        res.status(500).send(err.toString()).end();
    });
});

app.all('/ymail_list', (req, res) => {
    let loginForm  = loginCheck(req);
    if(loginForm) {
        res.status(200).send(loginForm).end();
        return;
    }
    myYahooMail.listMessages()
    .then(msgList => {
        const html = JSON.stringify(msgList, null, 4).replace(/\n/g, "<br>\n");
        res.status(200).send(html).end();
    })
    .catch(err => {
        res.status(500).send(err.toString()).end();
    });
});

app.get('/*', (req, resp) => {
    //let body = req.protocol + '://' + req.headers.host + req.url;
    let url = "http://35.203.132.149:80"  + req.url;

    let http = require('http');

    http.get(url, (res) => {
        let body = '';
        res.setEncoding('utf8');
        const { statusCode } = res;

        res.on('data', (chunk) => {
            body += chunk;
        });

        res.on('end', (res) => {
            console.log(body);
            console.log(statusCode);
            resp.status(statusCode).send(body).end();
        });

    }).on('error', (e) => {
        console.log(e.message); //エラー時
    });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});


module.exports = app;
