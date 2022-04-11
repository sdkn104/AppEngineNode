
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
    fetch_json(api_url, {
            command: "open", 
            userAccountName:app.userAccountName, 
    })
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
    fetch_json(api_url, {
        command:"list-messages", 
        userAccountName:app.userAccountName, 
        labelId:box.id, 
        messageCount:app.messageCount
    })
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
};

function onclick_msg(msg){
    app.currentMessage = msg;
    app.enablePopupBox = true;
}

function onclick_delete(msg){
    app.messageList = [];
    app.message = "processing..."
    console.log(msg)
    fetch_json(api_url, {
        command:"delete-message", 
        userAccountName:app.userAccountName, 
        msgid:msg.id, 
    })
    .then(res => {
        app.message = JSON.stringify(res)
    })
    .catch(err => {
        app.message = err.stack || err.toString();
    });
}

