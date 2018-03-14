/* globals
    require: false,
    process: false,
    module: false
*/

var fs = require('fs');

module.exports = (function() {
    var __parseModule = function(moduleList, modules) {
        var inputData = {};

        if (modules.path && modules.url) {
            for (var key in modules)
                if (modules[key])
                    inputData[key] = modules[key];

            moduleList.push(inputData);
        }
    };

    var gitmodule = function(filePath) {
        var array = fs.readFileSync(filePath).toString().split("\n");
        var moduleList = [];
        var modules = {};

        for (var i in array) {
            var endCheck = array[i].indexOf('[submodule');
            if (endCheck !== -1) {
                __parseModule(moduleList, modules);
                modules = {};

            } else {
                var splitData = array[i].split(/(?:=|\t| |\r)+/).filter(Boolean);
                modules[splitData[0]] = splitData[1];
            }
        }

        __parseModule(moduleList, modules);

        return moduleList;
    };

    return {
        "gitmodule": gitmodule
    };

})();
