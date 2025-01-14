//https://developers.google.com/identity/gsi/web/guides/display-button?hl=ja#javascript_1
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

