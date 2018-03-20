/* globals
 require: false,
 process: false,
 module: false
 */

var fs = require("fs");
var path = require("path");
var spawn = require("child_process").spawn;

var oc = require("object-controller");

var parseFile = require("../parseFile.js");
var execCmd = require("../execCmd");


module.exports = (function() {
    var runPath = process.cwd();


    var __addSubmodule = function(moduleList, targetModule, successFunc) {
        targetModule.subList = [];
        var filePath = path.join(targetModule.path, ".gitmodules");
        fs.stat(filePath, function(err, stat) {
            if (err === null) {
                var subList = parseFile.gitmodule(filePath);
                for (var i = 0; i < subList.length; i++) {
                    subList[i].path = path.join(targetModule.path, subList[i].path);
                    moduleList.push(subList[i]);
                }
            }
            successFunc();
        });
    };

    var __install = function(moduleList) {
        if (moduleList.length > 0) {
            var targetModule = moduleList.shift();
            if (targetModule.path) {
                var cmd = "cd " + targetModule.path;
                if (fs.existsSync(path.join(targetModule.path, "package.json"))) {
                    cmd += " && npm install";
                }
                execCmd(true, cmd, function() {
                    __addSubmodule(moduleList, targetModule, function() {
                        __install(moduleList);
                    });
                });
            } else {
                __install(moduleList);
            }
        }
    };

    var install = function() {
        fs.stat(path.join(runPath, ".gitmodules"), function(err, stat) {
            if (err === null) {
                var moduleList = parseFile.gitmodule(path.join(runPath, ".gitmodules"));
                __install(moduleList);
            }
        });
    };

    var __printNpmList = function(npmList) {
        console.log("\n============= npm dependencies module list =============");
        var message = "{\n";
        var keys = Object.keys(npmList);
        keys.sort();
        for (var i = 0; i < keys.length; i++) {
            message += "  \"" + keys[i] + "\": [";
            npmList[keys[i]].sort();
            for (var j=0 ; j< npmList[keys[i]].length ; j++){
                message += "\"" + npmList[keys[i]][j] + "\", "
            }
            message = message.substring(0, message.length - 2);
            message += "],\n";
        }
        message = message.substring(0, message.length - 2);
        message += "\n}";
        console.log(message);
        console.log("========================= end ==========================\n");
    };

    var __list = function(moduleList, npmList) {
        if (moduleList.length > 0) {
            var targetModule = moduleList.shift();
            if (targetModule.path) {
                var targetPath = path.join(targetModule.path, "package.json");
                fs.stat(targetPath, function(err, stat) {
                    if (err === null) {
                        oc.appendValueInSameKey(npmList, parseFile.packagejson(targetPath));
                    }
                    var cmd = "cd " + targetModule.path;
                    execCmd(false, cmd, function() {
                        __addSubmodule(moduleList, targetModule, function() {
                            __list(moduleList, npmList);
                        });
                    });
                });
            } else {
                __list(moduleList, npmList);
            }
        } else {
            __printNpmList(npmList);
        }
    };

    var list = function() {
        var npmList = {};
        fs.stat(path.join(runPath, ".gitmodules"), function(err, stat) {
            if (err === null) {
                var moduleList = parseFile.gitmodule(path.join(runPath, ".gitmodules"));
                __list(moduleList, npmList);
            }
        });
    };


    return {
        "list": list,
        "install": install
    };
    
})();
