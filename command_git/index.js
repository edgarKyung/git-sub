/* globals
 require: false,
 process: false,
 module: false
 */

var fs = require("fs");
var path = require("path");
var spawn = require("child_process").spawn;

var parseFile = require("../parseFile");
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
                    targetModule.subList.push(subList[i].path);
                    subList[i].path = path.join(targetModule.path, subList[i].path);
                    moduleList.push(subList[i]);
                }
            }
            successFunc();
        });
    };

    var __createCommand = function(cmdType, targetModule) {
        var cmd = "cd " + targetModule.path + " && git " + cmdType + " ";
        switch (cmdType) {
            case "update":
                cmd += targetModule.branch + " && git pull origin " + targetModule.branch + " && git submodule update --init --remote";
                break;
            case "checkout":
                cmd += targetModule.branch;
                break;
            case "pull":
                cmd += "pull origin " + targetModule.branch;
                break;
            case "clean":
                cmd += "clean -f -d . && git reset --hard";
                break;
            default:
                break;
        }
        return cmd;
    };

    var __recursiveCmdCall = function(cmdType, moduleList) {
        if (moduleList.length > 0) {
            var targetModule = moduleList.shift();
            if (targetModule.path) {
                var cmd = __createCommand(cmdType, targetModule);
                execCmd(true, cmd, function() {
                    __addSubmodule(moduleList, targetModule, function() {
                        __recursiveCmdCall(cmdType, moduleList);
                    });
                });
            } else {
                __recursiveCmdCall(cmdType, moduleList);
            }
        }
    };


    var update = function() {
        var cmd = "git submodule update --init --remote";
        execCmd(true, cmd, function() {
            fs.stat(path.join(runPath, ".gitmodules"), function(err, stat) {
                if (err === null) {
                    var moduleList = parseFile.gitmodule(path.join(runPath, ".gitmodules"));
                    __recursiveCmdCall("update", moduleList);
                }
            });
        });
        console.log("Update the entire sub-module from the remote repository. It takes a long time.");
    };

    var status = function() {
        fs.stat(path.join(runPath, ".gitmodules"), function(err, stat) {
            if (err === null) {
                var moduleList = parseFile.gitmodule(path.join(runPath, ".gitmodules"));
                __recursiveCmdCall("status", moduleList);
            }
        });
    };

    var checkout = function() {
        fs.stat(path.join(runPath, ".gitmodules"), function(err, stat) {
            if (err === null) {
                var moduleList = parseFile.gitmodule(path.join(runPath, ".gitmodules"));
                __recursiveCmdCall("checkout", moduleList);
            }
        });
    };

    var pull = function() {
        fs.stat(path.join(runPath, ".gitmodules"), function(err, stat) {
            if (err === null) {
                var moduleList = parseFile.gitmodule(path.join(runPath, ".gitmodules"));
                __recursiveCmdCall("pull", moduleList);
            }
        });
    };

    var clean = function() {
        fs.stat(path.join(runPath, ".gitmodules"), function(err, stat) {
            if (err === null) {
                var moduleList = parseFile.gitmodule(path.join(runPath, ".gitmodules"));
                __recursiveCmdCall("clean", moduleList);
            }
        });
    };


    var __link = function(wholeList, message) {
        if (wholeList.length > 0) {
            var targetModule = wholeList.pop();
            if (targetModule.subList && targetModule.subList.length > 0) {
                var cmd = "cd " + targetModule.path + " && git pull origin " + targetModule.branch + " && git add ";
                for (var i = 0; i < targetModule.subList.length; i++) {
                    cmd += targetModule.subList[i] + " ";
                }
                cmd += " && git commit -m \"" + (message || "fix submodule link") + "\" && git push origin " + targetModule.branch;
                execCmd(true, cmd, function() {
                    __link(wholeList, message);
                });
            } else {
                __link(wholeList, message);
            }
        }
    };

    var __getWholeModule = function(wholeList, moduleList, message, successFunc) {
        if (moduleList.length > 0) {
            var targetModule = moduleList.shift();
            if (targetModule.path) {
                wholeList.push(targetModule);
                var cmd = "cd " + targetModule.path;
                execCmd(false, cmd, function() {
                    __addSubmodule(moduleList, targetModule, function() {
                        __getWholeModule(wholeList, moduleList, message, successFunc);
                    });
                });
            }
        } else {
            successFunc(wholeList, message);
        }
    };

    var link = function(message) {
        var wholeList = [];
        var moduleList = [];

        fs.stat(path.join(runPath, ".gitmodules"), function(err, stat) {
            if (err === null) {
                var moduleList = parseFile.gitmodule(path.join(runPath, ".gitmodules"));
                __getWholeModule(wholeList, moduleList, message, __link);
            }
        });
    };


    return {
        "status": status,
        "checkout": checkout,
        "pull": pull,
        "update": update,
        "clean": clean,
        "link": link
    };
    
})();
