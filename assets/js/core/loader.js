"use strict";

module.exports = new class {

    show (wait = 0) {
        this.wait = wait;
        $("[top-progress]").removeClass("hide");
    }
    hide () {
        if (this.wait <= 0) {
            $("[top-progress]").addClass("hide");
        } else {
            this.wait--;
        }
    }

}