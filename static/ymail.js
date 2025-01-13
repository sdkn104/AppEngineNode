
import {loginBar} from "/static/components/loginBar.js" 
import {popupBox} from "/static/components/popupBox.js" 
import {fetch_json} from "/static/common.js"

const api_url = "/ymail";

var app = new Vue({
  el: '#app',
  data: {
    userAccountName:"",
    boxes:{},
    messageList:[],
    sinceDaysAgo:2,
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
  },
  //watch: {
  //    enablePopupBox: function(val){ console.log("watch enablePopupBox:"+val)}
  //}
});




function onclick_open() {
    app.messageList = [];
    app.boxes = [];
    app.message = "";
    console.log(app.userAccountName)
    fetch_json(api_url, {
            command: "open", 
            userAccountName:app.userAccountName, 
    })
    .then(boxes => {
        app.boxes = boxes;
    })
    .catch(err  => {
        app.message = err.stack || err.toString();
    });
};


function onclick_box(box){
    console.log(box);
    app.messageList = [];
    app.message = "processing..."
    fetch_json(api_url, {
        command:"list-messages", 
        box:box, 
        sinceDaysAgo:app.sinceDaysAgo,
        userAccountName:app.userAccountName,
    })
    .then(messageList => {
        console.log(messageList)
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
    //alert(JSON.stringify(msg, null, 2));
    app.currentMessage = msg;
    app.enablePopupBox = true;
}

function onclick_delete(msg){
    console.log(msg);
    fetch_json(api_url, {
        command:"delete-message", 
        userAccountName:app.userAccountName, 
        box:msg.box, 
        uid:msg.uid, 
    })
    .then(result => {
        console.log(result)
        if(result.status === "OK" ) {
            app.message = "message deleted."
            app.messageList = app.messageList.filter((e) => (e.uid !== msg.uid));
        }
    })
    .catch(err => {
        app.message = err.stack || err.toString();
    });
}
