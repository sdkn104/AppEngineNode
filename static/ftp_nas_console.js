

import {loginBar} from "/static/components/loginBar.js" 
import {fetch_json} from "/static/common.js"

const api_url = "/ftp_nas_api";

var app = new Vue({
  el: '#app',
  data: {
    cwd:"",
    message: "",
    files:[],
    input_cd:".",
    input_download:"",
  },
  methods: {
    onclick_open: onclick_open,
    onclick_cd: onclick_cd,
    onclick_download: onclick_download,
    onclick_bye: onclick_bye,
    onclick_name: onclick_name,
  },
  components: {
      loginBar: loginBar,
  }
});


function onclick_open() {
    app.message = "sent request open";
    fetch_json(api_url, { command: "open" })
    .then(data => {
        app.message = data.error || data.greeting;
    })
    .catch(err  => {
        app.message = err.stack || err.toString();
    });
};

function onclick_cd()  {
    ftp_cd(app.input_cd);
};

function onclick_download() {
    ftp_download(app.input_download);
};

function onclick_bye() {
    app.message = "sent request bye";
    fetch_json(api_url, { command: "bye" })
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
    fetch_json(api_url, {command:"cd", dirName:dirName})
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
    fetch(api_url,  {
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
