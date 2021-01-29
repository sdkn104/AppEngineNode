

console.log("loading ftp_nas_console.js");


// Component Login Form

Vue.component('loginForm', {
  props: ['formDisplay'],
  data: function() {
      return {
        loginFormUsername:"sadakane",
        loginFormPassword:"",
        modalStyle: {
            display: "block",
            position: "fixed",
            zIndex: 1,
            left: 0,
            top: 0,
            height: "100%",
            width: "100%",
            overflow: "auto",
            backgroundColor:"gray",
        },
        modalContentStyle: {
            backgroundColor: "white",
            width: "500px",
            margin: "20% auto",
        }
      };
  },
  template: `
    <div class="modal" v-bind:style="modalStyle" v-if="formDisplay">
        <div class="modal-content" v-bind:style="modalContentStyle">
            <input type="text" placeholder="Enter Username" class="form-control" v-model="loginFormUsername">
            <input type="password" placeholder="Enter Password" class="form-control" v-model="loginFormPassword">
            <button class="btn btn-lg btn-primary btn-block" type="button" v-on:click="$emit('click_login', {username:loginFormUsername, password:loginFormPassword})">Login</button>
        </div>
    </div>
  `,
});


var app = new Vue({
  el: '#app',
  data: {
    cwd:"",
    message: "",
    files:[],
    input_cd:".",
    input_download:"",
    enableLoginForm: false,
  },
  methods: {
    onclick_open: onclick_open,
    onclick_cd: onclick_cd,
    onclick_download: onclick_download,
    onclick_bye: onclick_bye,
    onclick_name: onclick_name,
    onclick_loginFormOK: onclick_loginFormOK,
  }
});



function onclick_open() {
    app.enableLoginForm = true;
};

function onclick_loginFormOK(e) {
    console.log(e)
    fetch_json({
            command: "open", 
            username: e.username, 
            password: e.password
    })
    .then(data => {
        if( data.greeting ) {
            app.message = data.greeting;
        }
        ftp_cd(".");
    })
    .catch(err  => {
        app.message = err.stack || err.toString();
    });
    app.enableLoginForm = false
    app.loginFormPassword = ""
};

function onclick_cd()  {
    ftp_cd(app.input_cd);
};

function onclick_download() {
    ftp_download(app.input_download);
};

function onclick_bye() {
    app.message = "sent request bye";
    fetch_json({ command: "bye" })
    .then(data => {
        app.message = "conection closed."
    })
    .catch(err  => {
        app.message = err.stack || err.toString();
    });
};

function onclick_name(file){
    if( file.type === "d" ){
        ftp_cd(file.name);
    } else {
        ftp_download(file.name);
    }
}

function ftp_cd(dirName){
    app.message = "sending cd command...";
    fetch_json({command:"cd", dirName:dirName})
    .then(data => {
        app.files = data.list;
        app.cwd = data.cwd;
        app.message = ""
    })
    .catch(err  => {
        app.message = err.stack || err.toString();
    });
}

function ftp_download(fileName){
    app.message = "sent download request...";
    fetch("/ftp_nas_api", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({command:"download", fileName:fileName})
    })
    .then(response => {
        console.log("got response") // ここまでに時間がかかる
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        console.log(response.headers.get('content-length'));
        app.message = "get response "+response.status;
        return response.blob();
    })
    .then(blob => {
        app.message = "get blob: "+blob.size+" in "+blob.type;
        console.log(blob);
        //const newBlob = new Blob([blob], { type: 'application/octet-stream' });
        //const url = URL.createObjectURL(newBlob);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.download = fileName.replace(/^.*[/]/, "");
        a.href = url;
        a.innerHTML = "a"
        a.click();
        console.log("a download clicked")
        a.remove();
        app.message = "";
        // For Firefox it is necessary to delay revoking the ObjectURL.
        //setTimeout(() => { window.URL.revokeObjectURL(url); console.log("revokeURL")}, 1000);
    })
    .catch(err  => {
        app.message = err.stack || err.toString();
    });
}    

function fetch_json(message) {
    return fetch("/ftp_nas_api", {
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
            throw data.error.stack || data.error.toString();
        }    
        return data;
    });
}