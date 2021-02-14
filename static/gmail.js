
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
    onclick_msg: onclick_msg,
  },
  components: {
      loginBar: loginBar,
      popupBox: popupBox,
  }
});



function onclick_open() {
    app.messageList = [];
    app.message = "processing..."
    fetch_json(api_url, {
        command:"list-messages", 
        userAccountName:app.userAccountName, 
        box:null, 
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

