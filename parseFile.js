/* globals
    require: false,
    process: false,
    module: false
*/

module.exports = function (filePath) {
    var fs = require('fs');
    var array = fs.readFileSync(filePath).toString().split("\n");

    var moduleList = [];
    var module = {};

    var inputModule = function () {
        var inputData = {};

        if (module.path && module.url) {
            for (var i in module)
                if (module[i])
                    inputData[i] = module[i];


            moduleList.push(inputData);
            module = {};
        }
    };

    for (var i in array) {
        var endCheck = array[i].indexOf('[submodule');

        if (endCheck !== -1) {
            inputModule();

        } else {
            var splitData = array[i].split(/(?:=|\t| |\r)+/).filter(Boolean);

            module[splitData[0]] = splitData[1];
        }
    }

    inputModule();

    return moduleList;
};