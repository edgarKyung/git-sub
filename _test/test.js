/**
 * Created by nhyun.kyung on 2017-01-12.
 */

try {
    var parseFile = require('../parseFile');
    var commandGit = require("../command_git")

    /** Function Test : DeepCopy in objectConverter */
    console.log(parseFile.gitmodule(".gitmodules"));
    commandGit.update();

    process.on("SIGINT", function () {
        console.log("Exit Sample, Please wait a moment.");

        setTimeout(function () {
            process.exit(0);
        }, 3000);
    });


} catch (ex) {
    console.error(ex.stack);
}
