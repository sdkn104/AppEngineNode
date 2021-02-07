'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const iconv = require('iconv-lite');
const session = require("express-session")

const Private = require('./Private.js')
const myGmail = require('./myGmail.js')
const myYahooMail = require('./myYahooMail.js')
//console.log(require)

const ftpClient = require('ftp');
var ftpClientNAS;

// Patch for ftpClient
/*
ftpClient.prototype._send = function(cmd, cb, promote) {
  clearTimeout(this._keepalive);
  if (cmd !== undefined) {
    if (promote)
      this._queue.unshift({ cmd: cmd, cb: cb });
    else
      this._queue.push({ cmd: cmd, cb: cb });
  }
  var queueLen = this._queue.length;
  if (!this._curReq && queueLen && this._socket && this._socket.readable) {
    this._curReq = this._queue.shift();
    if (this._curReq.cmd === 'ABOR' && this._pasvSocket)
      this._pasvSocket.aborting = true;
    this._debug&&this._debug('[connection] > ' + inspect(this._curReq.cmd));
    this._socket.write(this._curReq.cmd + '\r\n');
    //this._socket.write(this._curReq.cmd + '\r\n', 'binary');
    //this._socket.write(iconv.encode(this._curReq.cmd + '\r\n', 'Shift_JIS')); // for Shift_JIS ftp server
  } else if (!this._curReq && !queueLen && this._ending)
    this._reset();
};
*/

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/static', express.static('static'));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie:{
        httpOnly: true,
        secure: false,
        maxage: 1000 * 60 * 30 // in msec.
    }
})); 

function loginCheck(req){
    const html = "<form method='POST'>User Name<input type='text' name=username><br>Password<input type='password' name='password'><br><input type='submit'></form>"
    console.log(req.method)
    if( req.method === "POST" && req.body.username === Private.app_username && req.body.password === Private.app_password) {
        return null; // login ok
    } else {
        return html; // login form
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
        msgList = msgList.map(e => {e.Body = e.Body.slice(0,1000); return e;});
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
        msgList = msgList.map(e => {e.Body = e.Body.slice(0,1000); return e;});
        const html = JSON.stringify(msgList, null, 4).replace(/\n/g, "<br>\n");
        res.status(200).send(html).end();
    })
    .catch(err => {
        res.status(500).send(err.toString()).end();
    });
});

app.all('/ymail', (req, res) => {
    try {
        console.log(req.body)
        const command = req.body.command;
        if( command != "login" && ! req.session.login ) {
            res.status(200).send({error:"not login"}).end();
            return;
        }
        if( command === "login" ){
            if( req.body.username !== Private.app_username || req.body.password !== Private.app_password) {
                throw "wrong user name or password";
            }
            req.session.login = true;
            req.session.username = req.body.username;
            res.status(200).send({username:req.body.username}).end();
        } else if( command === "open" ){
            myYahooMail.listBoxes()
            .then(folders =>{
                res.status(200).send(folders).end();
            })
        } else if( command === "list-messages"){
            myYahooMail.listMessages(req.body.box, req.body.sinceDaysAgo)
            .then(messageList => {
                res.status(200).send(messageList).end();
            })
        }
    } catch(err) {
        console.log("catch: "+err)
        res.status(200).send({error: err.stack || err.toString()}).end();
    }
});

app.all('/ftp_nas_api', (req, res) => {
    try {
        console.log(req.body)
        const command = req.body.command;
        if( command === "open" ){
            let greeting;
            if( req.body.username !== Private.app_username || req.body.password !== Private.app_password) {
                throw "wrong user name or password";
            }
            ftpClientNAS = new ftpClient();
            ftpClientNAS.on('greeting', function(msg) {
                greeting = msg;
            });
            ftpClientNAS.on('ready', function() {
                // Patch to Node FTP for Shift_JIS ftp server
                //  - ftpClinetNAS._socket is created in .open() method for TCP connection to FTP control port
                ftpClientNAS._socket.writeOrig = ftpClientNAS._socket.write;
                ftpClientNAS._socket.write = function(data, encoding, callback){ ftpClientNAS._socket.writeOrig(iconv.encode(data, 'Shift_JIS'), encoding, callback);}
                res.status(200).send({greeting:greeting}).end();
            });
            ftpClientNAS.on('error', function(err) {
                res.status(200).send({error:err.code}).end();
            });
            ftpClientNAS.connect({
                host:Private.ftp_nas_host,
                port:Private.ftp_nas_port,
                user:Private.ftp_nas_username,
                password:Private.ftp_nas_password
            });
        } else if( command === "cd"){
            const dirName = req.body.dirName;
            ftpClientNAS.cwd(dirName, function(err, currentDir) {
                if (err) {
                    res.status(200).send({error:err.stack || err.toString()}).end();
                    return;
                }
                console.log("cwd "+dirName);
                //console.log(currentDir);
                ftpClientNAS.pwd(function(err,cwd){
                    if (err) {
                        res.status(200).send({error:err.stack || err.toString()}).end();
                        return;
                    }
                    const cwd2 = iconv.decode(Buffer.from(cwd, 'binary'), 'Shift_JIS');
                    console.log("pwd "+cwd2);
                    ftpClientNAS.list(function(err,list){
                        if (err) {
                            res.status(200).send({error:err.stack || err.toString()}).end();
                            return;
                        }
                        //console.dir(list);
                        list.forEach((e)=>{
                            e.name = iconv.decode(Buffer.from(e.name, 'binary'), 'Shift_JIS');
                        });
                        list.unshift({type:"d", name:".."});
                        res.status(200).send({list:list, cwd:cwd2}).end();
                    })
                })
            });
        } else if( command === "download"){
            console.log("getting...")
            const fileName = req.body.fileName;
            ftpClientNAS.get(fileName, function(err, stream) {
                if (err) {
                    res.status(200).send({error:err.stack || err.toString()}).end();
                    return;
                }
                stream.pipe(res);
                console.log("piped stream to response");
            });            
        } else if( command === "bye"){
            ftpClientNAS.end();
            console.log("connection closed.")
            res.status(200).send({}).end();
        }
    } catch(err){
        console.log("catch: "+err)
        res.status(200).send({error: err.stack || err.toString()}).end();
    }
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
