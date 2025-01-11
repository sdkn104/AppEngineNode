
import {loginBar} from "/static/components/loginBar.js" 
import {popupBox} from "/static/components/popupBox.js" 
import {fetch_json} from "/static/common.js"

const api_url = "/gmail";

var app = new Vue({
  el: '#app',
  data: {
    userAccountName:"",
    boxes:{},
    messageList:[],
    messageCount:20,
    currentMessage:null,
    enablePopupBox: false,
    message:"",
  },
  methods: {
    onclick_open: onclick_open,
    onclick_box: onclick_box,
    onclick_msg: onclick_msg,
    onclick_delete: onclick_delete,
  },
  components: {
      loginBar: loginBar,
      popupBox: popupBox,
  }
});


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

