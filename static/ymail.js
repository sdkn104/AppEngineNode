
import {loginBar} from "/static/components/loginBar.js" 
import {popupBox} from "/static/components/popupBox.js" 
import {fetch_json} from "/static/common.js"

const api_url = "/ymail";

var app = new Vue({
  el: '#app',
  data: {
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
  },
  components: {
      loginBar: loginBar,
      popupBox: popupBox,
  }
});




function onclick_open() {
    app.messageList = [];
    app.boxes = [];
    app.message = "";
    fetch_json(api_url, {
            command: "open", 
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
    fetch_json(api_url, {command:"list-messages", box:box, sinceDaysAgo:app.sinceDaysAgo})
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

