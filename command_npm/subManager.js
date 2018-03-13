/* globals
 require: false,
 process: false,
 module: false
 */

var fs = require('fs');
var spawn = require('child_process').spawn;
var parseFile = require('./parseFile.js');
var execCmd = require('./execCmd');

var runPath = process.cwd();
var moduleList = null;
var wholeModuleList = [];

var addSubmoduleList = function (targetModule, successFunc) {
    var file = targetModule.path + '/.gitmodules';
    targetModule.subList = [];

    fs.stat(file, function (err, stat) {
        if (err === null) {
            var subList = parseFile(file);

            for (var i = 0; i < subList.length; i++) {
                targetModule.subList.push(subList[i].path);
                subList[i].path = targetModule.path + '/' + subList[i].path;
                moduleList.push(subList[i]);
            }
        }

        successFunc();
    });
};

var updateModule = function (targetModule) {
    if (targetModule.path) {
        var cmd = 'cd ' + targetModule.path + ' && git checkout ' + targetModule.branch + ' && git pull origin ' + targetModule.branch + ' && git submodule update --init --remote';

        execCmd(true, cmd, function () {
            addSubmoduleList(targetModule, function () {
                if (moduleList.length)
                    updateModule(moduleList.shift());
            });
        });
    }
};


var checkoutModule = function (targetModule) {
    if (targetModule.path) {
        var cmd = 'cd ' + targetModule.path + ' && git checkout ' + targetModule.branch;

        execCmd(true, cmd, function () {
            addSubmoduleList(targetModule, function () {
                if (moduleList.length)
                    checkoutModule(moduleList.shift());
            });
        });
    }
};

var pullModule = function (targetModule) {
    if (targetModule.path) {
        var cmd = 'cd ' + targetModule.path + ' && git pull origin ' + targetModule.branch;

        execCmd(true, cmd, function () {
            addSubmoduleList(targetModule, function () {
                if (moduleList.length)
                    pullModule(moduleList.shift());
            });
        });
    }
};

var statusModule = function (targetModule) {
    if (targetModule.path) {
        var cmd = 'cd ' + targetModule.path + ' && git status';

        execCmd(true, cmd, function () {
            addSubmoduleList(targetModule, function () {
                if (moduleList.length)
                    statusModule(moduleList.shift());
            });
        });
    }
};

var clearModule = function (targetModule) {
    if (targetModule.path) {
        var cmd = 'cd ' + targetModule.path + ' && git clean -f -d . && git reset --hard';

        execCmd(true, cmd, function () {
            addSubmoduleList(targetModule, function () {
                if (moduleList.length)
                    clearModule(moduleList.shift());
            });
        });
    }
};

var fixModuleLink = function (targetModule) {
    if (targetModule) {
        if (targetModule.subList.length > 0) {
            var cmd = 'cd ' + targetModule.path + ' && git pull origin ' + targetModule.branch + ' && git add ';
            for (var i = 0; i < targetModule.subList.length; i++) {
                cmd += targetModule.subList[i] + ' ';
            }
            cmd += ' && git commit -m "fix submodule link" && git push origin ' + targetModule.branch;
            // console.log(cmd);

            execCmd(true, cmd, function () {
                if (wholeModuleList.length)
                    fixModuleLink(wholeModuleList.pop());
            });

        } else {
            fixModuleLink(wholeModuleList.pop());
        }
    }
};

var linkModule = function (targetModule) {
    if (targetModule.path) {
        var cmd = 'cd ' + targetModule.path;

        execCmd(false, cmd, function () {
            addSubmoduleList(targetModule, function () {
                if (moduleList.length) {
                    var subModule = moduleList.shift();
                    wholeModuleList.push(subModule);
                    linkModule(subModule);

                } else {
                    if (wholeModuleList.length) {
                        fixModuleLink(wholeModuleList.pop());
                    }
                }
            });
        });
    }
};


var npmInstallModule = function (targetModule) {
    if (targetModule.path) {
        var cmd = 'cd ' + targetModule.path;

        if (fs.existsSync(targetModule.path + "\\package.json")) {
            cmd += ' && npm install';
        }

        execCmd(true, cmd, function () {
            addSubmoduleList(targetModule, function () {
                if (moduleList.length)
                    npmInstallModule(moduleList.shift());
            });
        });
    }
};

var npmListModule = function (targetModule, npmModuleList) {
    if (targetModule.path) {
        var cmd = 'cd ' + targetModule.path;

        if (fs.existsSync(targetModule.path + "\\package.json")) {
            try {
                var package = JSON.parse(fs.readFileSync("./" + targetModule.path + "/package.json"));

                package = (typeof package === "object") ? package : {};

                var keys = Object.keys(package.dependencies);

                for (var i = 0; i < keys.length; i++) {
                    npmModuleList[keys[i]] = package.dependencies[keys[i]];
                }

            } catch (ex) {
                console.error(ex, targetModule.path + "\\package.json");
            }
        }

        execCmd(false, cmd, function () {
            addSubmoduleList(targetModule, function () {
                if (moduleList.length)
                    npmListModule(moduleList.shift(), npmModuleList);
            });
        });
    }
};

module.exports = function () {
    var update = function () {
        var cmd = 'git submodule update --init --remote';
        execCmd(true, cmd, function () {
            fs.stat(runPath + '/.gitmodules', function (err, stat) {
                if (err === null) {
                    moduleList = parseFile(runPath + '/.gitmodules');
                    if (moduleList.length)
                        updateModule(moduleList.shift());
                }
            });
        });
        console.log("Update the entire sub-module from the remote repository. It takes a long time.");
    };

    var status = function () {
        fs.stat(runPath + '/.gitmodules', function (err, stat) {
            if (err === null) {
                moduleList = parseFile(runPath + '/.gitmodules');
                if (moduleList.length)
                    statusModule(moduleList.shift());
            }
        });
    };

    var checkout = function () {
        fs.stat(runPath + '/.gitmodules', function (err, stat) {
            if (err === null) {
                moduleList = parseFile(runPath + '/.gitmodules');
                if (moduleList.length)
                    checkoutModule(moduleList.shift());
            }
        });
    };

    var pull = function () {
        fs.stat(runPath + '/.gitmodules', function (err, stat) {
            if (err === null) {
                moduleList = parseFile(runPath + '/.gitmodules');
                if (moduleList.length)
                    pullModule(moduleList.shift());
            }
        });
    };

    var clear = function () {
        fs.stat(runPath + '/.gitmodules', function (err, stat) {
            if (err === null) {
                moduleList = parseFile(runPath + '/.gitmodules');
                if (moduleList.length)
                    clearModule(moduleList.shift());
            }
        });
    };

    var link = function () {
        fs.stat(runPath + '/.gitmodules', function (err, stat) {
            if (err === null) {
                moduleList = parseFile(runPath + '/.gitmodules');
                if (moduleList.length) {
                    var subModule = moduleList.shift();
                    wholeModuleList.push(subModule);
                    linkModule(subModule);
                }
            }
        });
    };

    var npm_install = function () {
        fs.stat(runPath + '/.gitmodules', function (err, stat) {
            if (err === null) {
                moduleList = parseFile(runPath + '/.gitmodules');
                if (moduleList.length)
                    npmInstallModule(moduleList.shift());
            }
        });
    };

    var npm_list = function () {
        fs.stat(runPath + '/.gitmodules', function (err, stat) {
            if (err === null) {
                var npmModuleList = {};
                moduleList = parseFile(runPath + '/.gitmodules');
                if (moduleList.length)
                    npmListModule(moduleList.shift(), npmModuleList);

                console.log("=========== npm dependencies module list ===========\n");
                setTimeout(function () {
                    var keys = Object.keys(npmModuleList);
                    keys.sort();
                    for (var i = 0; i < keys.length; i++) {
                        console.log('"' + keys[i] + '": "' + npmModuleList[keys[i]] + '",');
                    }
                    console.log("\n======================= end ========================");
                }, 1000);
            }
        });
    };

    return {
        status: status,
        checkout: checkout,
        pull: pull,
        update: update,
        clear: clear,
        link: link,

        npm_list: npm_list,
        npm_install: npm_install
    };
};
