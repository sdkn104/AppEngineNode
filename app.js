'use strict';

const {Storage} = require('@google-cloud/storage');

const express = require('express');
const bodyParser = require('body-parser');
const iconv = require('iconv-lite');
const session = require("express-session")
const request = require('request');
const axios = require('axios');

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

// Top page
app.get('/', (req, res) => {
    res.redirect('/static/top.htm');
});

// login API
app.post('/login', (req, res) => {
    try {
        //console.log(req.body)
        const command = req.body.command;
        if( command === "login" ){
            if( req.body.username !== Private.app_username || req.body.password !== Private.app_password) {
                throw "wrong user name or password";
            }
            req.session.login = true;
            req.session.username = req.body.username;
            res.status(200).send({username:req.body.username}).end();
        } else if( command == "check") {
            res.status(200).send({username:req.session.username}).end();
        }
    } catch(err) {
        console.log("catch: "+err)
        res.status(200).send({error: err.stack || err.toString()}).end();
    }
});

// Gmail API
app.post('/gmail', async (req, res) => {
    try {
        console.log(req.body)
        // login check
        if( ! req.session.login ) {
            res.status(200).send({error:"not login"}).end();
            return;
        }
        // command handling
        const command = req.body.command;
        if( command === "open" ){
            const boxList = await myGmail.listLabels(req.body.userAccountName);
            res.status(200).send(boxList).end();
        } else if( command === "list-messages"){
            const messageList = await myGmail.listMessages(req.body.userAccountName, [req.body.labelId], req.body.messageCount);
            res.status(200).send(messageList).end();
        } else if( command === "delete-message"){
            const res = await myGmail.deleteMessage(req.body.userAccountName, req.body.msgid);
            console.log(res);
            res.status(200).send(res).end();
        }
    } catch(err) {
        console.log("catch: "+err)
        res.status(200).send({error: err.stack || err.toString()}).end();
    }
});

// Yahoo Mail API
app.post('/ymail', async (req, res) => {
    try {
        console.log(req.body)
        // login check
        if( ! req.session.login ) {
            res.status(200).send({error:"not login"}).end();
            return;
        }
        // command handling
        const command = req.body.command;
        if( command === "open" ){
            const folders = await myYahooMail.listBoxes();
            res.status(200).send(folders).end();
        } else if( command === "list-messages"){
            const messageList = await myYahooMail.listMessages(req.body.box, req.body.sinceDaysAgo);
            res.status(200).send(messageList).end();
        }
    } catch(err) {
        console.log("catch: "+err)
        res.status(200).send({error: err.stack || err.toString()}).end();
    }
});

// FTP MAS API
app.post('/ftp_nas_api', (req, res) => {
    try {
        console.log(req.body)
        // login check
        if( ! req.session.login ) {
            res.status(200).send({error:"not login"}).end();
            return;
        }
        const command = req.body.command;
        if( command === "open" ){
            let greeting;
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

// clean Yahoo Mail (triggered by GAE cron)
app.get('/cleanYahooMail', async (req, res) => {
    const r = await myYahooMail.moveAllMessages("Trash", "00ごみ箱");
    res.status(200).send(r).end();        
});

// Check alive of Web server on GCE
app.get('/checkAliveOfWebOnGCE', async (req, res) => {
    try {
        const url = "http://35.203.132.149:80/"+Private.project_app;
        request.get(url, {timeout:5000}, (err, resp, body) => {
            if(err) {
                myGmail.sendAlertMail("Alert Mail: server on GCE maybe down",
                                    "Web server on GCE not respond. I am on AppEngine.")
                res.status(200).send({error: err.stack || err.toString()}).end();
                return;
            }
            if( resp.statusCode > 299 ) {
                myGmail.sendAlertMail("Alert Mail: server on GCE down",
                                    "Web server on GCE not respond. I am on AppEngine.")
                res.status(200).send("Checking alive of GCE Web server... NG.").end();        
            } else {
                res.status(200).send("Checking alive of GCE Web server... OK.").end();   
            }
        });
    } catch(err) {
        myGmail.sendAlertMail("Alert Mail: error", "Error in checkAliveOfWebOnGCE() on AppEngine:\n"+err.stack)
        res.status(200).send({error: err.stack || err.toString()}).end();
    }
});

// indirect downloader
app.get('/dl_top', async (req, res) => {
    res.status(200).send("<form action='/dl_download'>URL:<input type='text' name=url><br>File Name:<input type='text' name=fn title='optional'><br><input type=submit value='download'></form><br>");
});
app.get('/dl_download', async (req, res) => {
    // get file
    const url = req.query.url;
    const f = new URL(url).pathname.split('/').pop();
    const fn = req.query.fn ? req.query.fn : f;
    console.log({url, fn});
    const resp = await axios.get(url, {
        responseType: 'arraybuffer',
        headers: {
        }
    });
    //console.log(typeof resp.data)

    // download
    //console.log(typeof resp.data)
    //res.attachment(fn);
    const fileName = encodeURIComponent(fn)
    res.set({'Content-Disposition': `attachment; filename=${fileName}`})
    res.status(200).send(resp.data).end();


    /*
    // save to Cloud Storage
    const storage = new Storage();
    const bucket = storage.bucket("dl_temp");
    const blob = bucket.file(fn);
    const blobStream = blob.createWriteStream({
        //resumable: false,
    });
    //console.log(resp.data)
    blobStream.on('error', err => {
        console.error(err)
    });
    blobStream.on('finish', () => {
        console.log('finish')
        //var pathReference = storage.ref('dl_temp/'+fn);
        //const link = pathReference.getDownloadURL()
        //console.log(link)
        //res.status(200).send(`<a href='${link}'>download</a>`).end();    
    });
    blobStream.end(resp.data);
    //const link = "https://storage.googleapis.com/dl_temp/"+fn
    //res.status(200).send(`<a href='${link}'>download</a>`).end();    
    */

});

// TRANSFER
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
