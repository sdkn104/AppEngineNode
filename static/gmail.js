import {loginBar} from "/static/components/loginBar.js" 
import {popupBox} from "/static/components/popupBox.js" 
//import {fetch_json} from "/static/common.js"

const api_url = "/gmail";

var app = new Vue({
  el: '#app',
  data: {
    boxes:{},
    messageList:[],
    messageCount:20,
    currentMessage:null,
    enablePopupBox: false,
    enablePopupBoxSend: false,
    message: "",
    send_subject: "",
    send_to: "",
    send_body: "",
  },
  methods: {
    onclick_auth: onclick_auth,
    onclick_signout: onclick_signout,
    onclick_open: onclick_open,
    onclick_box: onclick_box,
    onclick_msg: onclick_msg,
    onclick_draft: onclick_draft,
    onclick_send: onclick_send,
    onclick_delete: onclick_delete,
  },
  components: {
      loginBar: loginBar,
      popupBox: popupBox,
  }
});

function onclick_auth(){
  myGmailWeb.auth()
  .then(r => {
    app.message = "sign in";
  })
  .catch(r => {
    app.message = "failed sign in";
  });
}

function onclick_signout(){
  myGmailWeb.signout()
  .then(r => {
    app.message = "sign out";
  })
  .catch(r => {
    app.message = "failed sign out";
  });
}

function onclick_open(){
    app.messageList = [];
    app.boxes = [];
    app.message = "";
    myGmailWeb.listLabels()
    .then(boxes => {
        console.log(boxes)
        app.boxes = boxes;
    })
    .catch(err  => {
        app.message = err.stack || err.toString();
    });
}

function onclick_box(box) {
    app.messageList = [];
    app.message = "processing..."
    //console.log(box)
    myGmailWeb.listMessages(box.id, app.messageCount)
    .then(messageList => {
        app.messageList = messageList;
        if( messageList.length === 0 ) {
            app.message = "no message"
        } else {
            app.message = "got messages"
        }
    })
    .catch(err => {
        app.message = err.stack || err.toString();
    });
}

function onclick_msg(msg){
    app.currentMessage = msg;
    app.enablePopupBox = true;
}

function onclick_draft(){
  app.enablePopupBoxSend = true;
}

function onclick_send(){
  console.log("send")
  console.log(this.send_to, this.send_subject, this.send_body);
  myGmailWeb.sendMail(this.send_to, this.send_subject, this.send_body)
  .then(sentMsg => {
    console.log(sentMsg);
  })
  .catch(err => {
    app.message = err.stack || err.toString();
  })
}


function onclick_delete(msg){
    app.messageList = [];
    app.message = "processing..."
    console.log(msg)
    myGmailWeb.deleteMesage(msg.id)
    .then(result => {
        console.log(result)
        if(result.status === "OK" ) {
            app.message = "message deleted."
            app.messageList = app.messageList.filter((e) => (e.id !== msg.id));
        }
    })
    .catch(err => {
        app.message = err.stack || err.toString();
    });
}

