/* globals
    require: false,
    process: false,
    module: false
*/

var fs = require('fs');

module.exports = (function() {
    var __gitmodule = function(moduleList, modules) {
        var inputData = {};
        if (modules.path && modules.url) {
            for (var key in modules)
                if (modules[key])
                    inputData[key] = modules[key];
            moduleList.push(inputData);
        }
    };

    var gitmodule = function(filePath) {
        var moduleList = [];
        var array = fs.readFileSync(filePath).toString().split("\n");

        var modules = {};
        for (var i in array) {
            var endCheck = array[i].indexOf('[submodule');
            if (endCheck !== -1) {
                __gitmodule(moduleList, modules);
                modules = {};
            } else {
                var splitData = array[i].split(/(?:=|\t| |\r)+/).filter(Boolean);
                modules[splitData[0]] = splitData[1];
            }
        }
        __gitmodule(moduleList, modules);

        return moduleList;
    };


    var packagejson = function(filePath) {
        var npmList = {};
        var package = {};

        try         { package = JSON.parse(fs.readFileSync(filePath)); }
        catch (ex)  { console.error(ex, path.join(targetModule.path, "package.json")); }

        if(package && package.dependencies) {
            var keys = Object.keys(package.dependencies);
            for (var i = 0; i < keys.length; i++) {
                npmList[keys[i]] = package.dependencies[keys[i]];
            }
        }

        return npmList;
    };


    return {
        "gitmodule": gitmodule,
        "packagejson": packagejson
    };

})();
