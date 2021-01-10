
var Private = require('./Private.js')

var imaps = require('imap-simple');
//const _ = require('lodash');
const simpleParser = require('mailparser').simpleParser;
const iconv = require('iconv');


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


async function listMessages(){
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');
    var delay = 24 * 3600 * 1000;
    var yesterday = new Date();
    yesterday.setTime(Date.now() - delay);
    yesterday = yesterday.toISOString();
    var searchCriteria = [["SINCE", yesterday]];
    var fetchOptions = {
        bodies: ['HEADER', 'TEXT'],
        markSeen: false
    };
    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log('search results: '+messages.length);
    const results = [];
    for(let message of messages){
        const result = {}
        //console.log(message)
        // read header
        const header = message.parts.find(part => part.which === 'HEADER');
        //console.log(header)
        result.subject = header.body.subject
        result.date = header.body.date
        result.from = header.body.from
        result.contentType = header.body["content-type"][0]
        console.log("-------------")
        console.log(result.subject)
        // read text
        const text = message.parts.find(part => part.which === 'TEXT');
        //console.log(text)
        //var html = Buffer.from(text.body, 'base64').toString('utf8');
        //console.log(html)
        // https://github.com/chadxz/imap-simple#usage-of-mailparser-in-combination-with-imap-simple
        const mail = await simpleParser(`Imap-Id: ${message.attributes.uid}\r\n${text.body}`);
        //console.log(mail)
        // simpleParserはiconv-liteを使っているのでiso-2022-jpを正しく変換できない
        // charsetを見てiconvで変換
        let m, f;
        let charset = null;
        if( result.contentType && (m = result.contentType.match(/charset="(.+)"/)) ) {
            charset = m[1];
            console.log("get charset from header part")
        } else if( f = mail.headerLines.find(o => o.key === "content-type") ) {
            const match2 = f.line.match(/charset="(.+)"/);
            charset = match2 ? match2[1] : null;
            console.log("get charset from parsed mail headerLines")
        }
        console.log("charset: "+charset)
        result.charset = charset
        if(charset){
            const conv = new iconv.Iconv(charset, "UTF-8");
            if(mail.subject) console.log('subject: ' + conv.convert(mail.subject).toString());
            if(mail.text) {
                result.text = conv.convert(mail.text).toString();
                result.text = result.text.slice(0,1000)
                //console.log(result.text);
            }
            // if(mail.html) console.log(conv.convert(mail.html).toString());
        }else{
            console.log('subject: ' + mail.subject);
            //console.log(mail.text);
            // console.log(mail.html);
            result.text = mail.text
            result.text = result.text.slice(0,1000)
        }
        // break;//テスト用に1件だけで止めたいときにコメントアウト外す
        results.push(result)
    }
    console.log(results)
    await connection.end();
    return results;
}
            
            //https://qiita.com/oharato/items/35add79f406c384af780
            //https://www.npmjs.com/package/imap-simple
            //https://www.npmtrends.com/imap-vs-imap-simple-vs-inbox-vs-node-mailer-vs-nodemailer
            
// --- MAIN
if (require.main === module) { 
    console.log('called directly'); 
    listMessages()
    .then(results => {
        console.log(results)
    });
} else { 
    console.log('required as a module'); 
}

// --- EXPORT
exports.listMessages = listMessages;
