/* globals
 require: false,
 process: false,
 module: false,
 console: false
 */

var child = require('child_process');

module.exports = function (logFlag, cmd, sCbFunc) {
    child.exec(cmd, function (error, stdout, stderr) {
        if (logFlag) {
            var path = cmd.split('&&')[0].split(' ')[1];
            if (path !== 'submodule') {
                console.log('  : ' + path);
            }
            console.log(`${stdout}`);
            console.log(`${stderr}`);
            console.log("================================================================================\n");
        }
        sCbFunc();
    });
};