


// Component Login Form
import {loginForm} from "/static/components/loginForm.js" 
import {popupBox} from "/static/components/popupBox.js" 

var app = new Vue({
  el: '#app',
  data: {
    username:"",
    boxes:{},
    messageList:[],
    sinceDaysAgo:2,
    currentMessage:null,
    enableLoginForm: false,
    enablePopupBox: false,
    message:"",
  },
  methods: {
    onclick_login: onclick_login,
    onclick_open: onclick_open,
    onclick_box: onclick_box,
    onclick_msg: onclick_msg,
    onclick_loginFormOK: onclick_loginFormOK,
  },
  components: {
      loginForm: loginForm,
      popupBox: popupBox,
  }
});



function onclick_login() {
    app.enableLoginForm = true;
};

async function onclick_loginFormOK(e) {
    console.log(e)
    app.message = "";
    fetch_json({
            command: "login", 
            username: e.username, 
            password: e.password
    })
    .then(response => {
        app.username = response.username;
    })
    .catch(err  => {
        app.message = err.stack || err.toString();
    });
    app.enableLoginForm = false
    app.loginFormPassword = ""
};


function onclick_open() {
    app.messageList = [];
    app.boxes = [];
    app.message = "";
    fetch_json({
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
    fetch_json({command:"list-messages", box:box, sinceDaysAgo:app.sinceDaysAgo})
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
    //alert(JSON.stringify(msg, null, 2));
    app.currentMessage = msg;
    app.enablePopupBox = true;
}


function fetch_json(message) {
    return fetch("/ymail", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(message)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText} for request ${message.command}`);
        }
        return response.json();
    })
    .then(data => {
        if( data.error ) {
            throw data.error;
        }    
        console.log(data)
        return data;
    });
}