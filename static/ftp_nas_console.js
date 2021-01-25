
console.log("loading ftp_nas_console.js");

var app = new Vue({
  el: '#app',
  data: {
    cwd:"",
    message: "",
    files:[],
    input_cd:".",
    input_download:"",
    loginFormStyle:{display:"none"},
    loginFormUsername:"sadakane",
    loginFormPassword:""
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
    app.loginFormStyle.display = "block";
};

function onclick_loginFormOK() {
    fetch_json({
            command: "open", 
            username: app.loginFormUsername, 
            password: app.loginFormPassword
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
    app.loginFormStyle.display = "none"
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
        console.log(data);
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
        if (!response.ok) {
            throw new Error(`${response.status} ${response.statusText}`);
        }
        console.log("got response")
        app.message = "get response "+response.status;
        return response.blob(); // ##### want STREAMING
    })
    .then(blob => {
        app.message = "get blob: "+blob.size+" in "+blob.type;
        console.log(blob);
        const newBlob = new Blob([blob], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(newBlob);
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