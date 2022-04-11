
var Private = require('./Private.js')

var imaps = require('imap-simple');
const simpleParser = require('mailparser').simpleParser;
const Iconv = require('iconv').Iconv;

// 転送元メールアカウント情報
const src_mail_server = "imap.mail.yahoo.co.jp"
const src_mail_user = "sdkn104@yahoo.co.jp"
const src_mail_pass = Private.yahoo_mail_password
const src_mailbox = "INBOX"
//const src_mailbox = "Trash"
//const dst_mailbox = '"00&MFQwf3ux-"'  # 00ごみ箱
//const dst_mailbox = '"00 &Tg2JgQ-"'  # 00 不要

var config = {
    imap: {
        user: src_mail_user,
        password: src_mail_pass,
        host: src_mail_server,
        port: 993,
        tls: true,
        authTimeout: 3000
    }
};

async function listBoxes(){
    try {
        const connection = await imaps.connect(config);
        const boxes = await connection.getBoxes();
        console.log(boxes);
        connection.end();
        return boxes;
    } catch(err) {
        connection.end();
        console.log(err)
        return {error:err.ToString()}
    }
}
 
async function listMessages(box = "INBOX", sinceDaysAgo = 2) {
    try {
        const connection = await imaps.connect(config);
        await connection.openBox(box);
        var delay = 24 * 3600 * 1000;
        var yesterday = new Date();
        yesterday.setTime(Date.now() - delay*sinceDaysAgo);
        yesterday = yesterday.toISOString();
        var searchCriteria = [["SINCE", yesterday]];
        var searchCriteria = [["SINCE", yesterday]];
        var fetchOptions = {
            struct: true,
            bodies: ['HEADER', 'TEXT', ''], // mail header, mail body, mail header and body
            markSeen: false
        };
        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log('search results: '+messages.length);
        const results = [];
        for(let message of messages){
            console.log("------ start -------")
            const result = {}
            //console.log(message.attributes.struct)
            //console.log(message)
            result.uid = message.attributes.uid;
            // read header
            const header = message.parts.find(part => part.which === 'HEADER');
            //console.log(header)
            result.Subject = header.body.subject
            result.Date = header.body.date
            result.From = header.body.from
            result.ContentType = header.body["content-type"][0]
            console.log(result.Subject)
            // read text
            const text = message.parts.find(part => part.which === 'TEXT');
            //console.log(text)
            const all = message.parts.find(part => part.which === '' )
            // parse mail
            // https://github.com/chadxz/imap-simple#usage-of-mailparser-in-combination-with-imap-simple
            //const mail = await simpleParser(`Imap-Id: ${message.attributes.uid}\r\n${all.body}`, { Iconv });
            const mail = await simpleParser(`Imap-Id: ${message.attributes.uid}\r\n${all.body}`);
            //console.log(Object.keys(mail));
            //console.log(mail)
            //if(mail.text) { console.log(mail.text.slice(0,50)) }
            result.Body = mail.text
            result.Html = mail.html
            results.push(result)
        }
        //console.log(results)
        connection.end();
        return results;
    } catch(err) {
        connection.end();
        console.log(err)
        return {error:err.ToString()}
    }
}

async function deleteMessage(uid) {
    try {
        const connection = await imaps.connect(config);
        const result = await connection.deleteMessage(uid);
        console.log(result)
        connection.end();
        return result;
    } catch(err) {
        connection.end();
        console.log(err)
        return {error:err.ToString()}
    }
}


async function moveAllMessages(fromBoxName, toBoxName){
    try {
        const connection = await imaps.connect(config);
        await connection.openBox(fromBoxName);
        var searchCriteria = ["ALL"];
        var fetchOptions = {
            bodies: ['HEADER'], // mail header
            markSeen: false
        };
        const messages = await connection.search(searchCriteria, fetchOptions);
        console.log('search results: '+messages.length);
        const results = [];
        for(let message of messages) {
            const uid = message.attributes.uid;
            //console.log("------ start ------- " + uid)
            //const header = message.parts.find(part => part.which === 'HEADER');
            //console.log(header.body.subject);
            const r = await connection.moveMessage(uid, toBoxName);
        }
        connection.end();
        return {success:true};
    } catch(err) {
        connection.end();
        console.log(err)
        return {error:err.ToString()}
    }
}



//https://qiita.com/oharato/items/35add79f406c384af780
//https://www.npmjs.com/package/imap-simple
//https://www.npmtrends.com/imap-vs-imap-simple-vs-inbox-vs-node-mailer-vs-nodemailer
            
// --- MAIN
if (require.main === module) { 
    console.log('called directly'); 
    moveAllMessages();
    //listBoxes();
    /*
    listMessages()
    .then(results => {
        results = results.map(e => { e.Body = e.Body.slice(0,1000); return e;});
        console.log(results)
    })
    */
} else { 
    console.log('required as a module'); 
}

// --- EXPORT
exports.listMessages = listMessages;
exports.listBoxes = listBoxes;
exports.moveAllMessages = moveAllMessages;
