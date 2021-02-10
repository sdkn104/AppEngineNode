
export const loginForm = {
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
            margin: "10% auto auto auto",
        }
      };
  },
  template: `
    <div class="modal" v-bind:style="modalStyle" v-if="formDisplay">
        <div class="modal-content" v-bind:style="modalContentStyle">
            <div style="color:red"><slot></slot></div>
            <input type="text" placeholder="Enter Username" class="form-control" v-model="loginFormUsername">
            <input type="password" placeholder="Enter Password" class="form-control" v-model="loginFormPassword">
            <button class="btn btn-lg btn-primary btn-block" type="button" v-on:click="formDisplay=false; $emit('click_login', {username:loginFormUsername, password:loginFormPassword})">Login</button>
        </div>
    </div>
  `,
};

