
import {loginForm} from "/static/components/loginForm.js" 
import {fetch_json} from "/static/common.js"

export const loginBar = {
  props: ['action'],
  data: function() {
      return {
        username:"",
        loginMessage: "",
        enableLoginForm: false,
      };
  },
  methods: {
    onclick_login: function() {
        this.enableLoginForm = true;
        this.loginMessage = "";
    },
    onclick_loginFormOK: function(e){
        console.log(e)
        this.loginMessage = "";
        fetch_json(this.action, {
                command: "login", 
                username: e.username, 
                password: e.password
        })
        .then(response => {
            this.username = response.username;
        })
        .catch(err  => {
            this.loginMessage = err.stack || err.toString();
            this.enableLoginForm = true
        });
        this.enableLoginForm = false
        this.loginFormPassword = ""
    },
    update_login: function() {
        console.log("check")
        fetch_json(this.action, {
                command: "check", 
        })
        .then(response => {
            this.username = response.username;
        })
        .catch(err  => {
            this.loginMessage = err.stack || err.toString();
        });
    }
  },
  mounted: function(){
    this.update_login();
    
/*  google auth  //https://developers.google.com/identity/gsi/web/guides/display-button?hl=ja#javascript_1
    const e = await loadScript("https://accounts.google.com/gsi/client");
    const e2 = await loadScript("https://cdn.jsdelivr.net/npm/jwt-decode/build/jwt-decode.min.js");
    google.accounts.id.initialize({
            client_id: "656639514271-d5kjb0i7nffu4le1a93lan08pqr45rq2.apps.googleusercontent.com",
            callback: (response) => {
                console.log("Encoded JWT ID token: ", response);
                const responsePayload = jwt_decode(response.credential);
                console.log(responsePayload);
                this.username = responsePayload.name;
                this.credential = {response: response, payload: responsePayload}
            }
    });
*/
  },
  components: {
      loginForm: loginForm,
  },
  template: `
        <div style="background-color:lightgray; padding:5px;">
            <a href="./top.htm">Home</a>　　　
            <input type="button" value="login" v-on:click="onclick_login">
            <span> {{username}}</span>
            <login-form v-on:click_login="onclick_loginFormOK" v-bind:form-display.sync="enableLoginForm">{{loginMessage}}</login-form>
        </div>
  `,
};

/*
function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = (e) => { return resolve(e) };
        // timeout procedure !!!!!!!!!!!!!!!!!!!!!!!!!
        document.body.appendChild(script);    
    })
}
*/