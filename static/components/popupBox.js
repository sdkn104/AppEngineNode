
export const popupBox = {
  props: ['popupDisplay'],
  data: function() {
      return {
        loginFormUsername:"sadakane",
        loginFormPassword:"gorosan3",
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
            width: "95%",
            height: "95%",
            margin: "auto",
        }
      };
  },
  template: `
    <div class="modal" v-bind:style="modalStyle" v-if="popupDisplay">
        <div class="modal-content" v-bind:style="modalContentStyle">
            <div style="width:100%; overflow-y:scroll; overflow-x:auto; padding:10px;"><slot></slot></div>
            <button class="btn btn-lg btn-primary btn-block" type="button" v-on:click="popupDisplay=false;">Dismiss</button>
        </div>
    </div>
  `,
};

