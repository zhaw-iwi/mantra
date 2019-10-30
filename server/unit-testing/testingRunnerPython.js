/**
 * Created by Martin on 12/09/14.
 */
'use strict';

var util = require('./util.js'),
    config = require('./config/config.js');

/**
 * Generates the command line string to invoke the compiler
 * @path: a full directory path
 */
function generatePythonCommand(path, mainClass) {
    var options = '';
    options = config.getVMRunConfig('Python-UnitTest', path) + 'sh -c "cd ' + path + '; python -m unittest -v -b ' + mainClass + ';echo"" "'; //discover
    // console.log(options);
    return options;
}

/**
 * Takes the Python output and generates a JSON object.
 */
function parsePythonOutput(output) {
    //console.log('Parsing Python output');
    var result = {};
    result.compilationError = false;
    result.warningError = false;
    result.errors = [];
    result.warnings = [];

    result.dump = output;
    result.output = output;

    result.numTestsPassing = -1;
    result.numTestsFailing = -1;
    result.numTestsErrors = 0;
    var match = /(Ran\s)([0-9]+)\stest(s*)\sin\s([0-9]+\.[0-9]+s\n\n(OK))/.exec(output);
    // console.log(output);
    if (match != null) {
        // There was a match.There are failed tests
        // console.log('THERE IS MATCH');
        //console.log('Test run');
        result.numTestsPassing = parseInt(match[2]);
        result.numTestsFailing = 0;
        result.time = match[4];
        // console.log(result.numTestsPassing);
        //result.numTestsFailing = parseInt(match[4]);
    } else {
        // No match. There are no failed tests; extract number of successful tests
        match = /(Ran\s)([0-9]+)\stest(s*)\sin\s([0-9]+\.[0-9]+s)\n\n(FAILED\s\()(((failures=)([0-9]+))?(,?\s?)((errors=)([0-9]+))?)(\))/.exec(output);
        if (match != null) {
            result.time = match[4];
            if (match[13] != undefined) {
                result.numTestsErrors = parseInt(match[13]);
            }
            else {
                result.numTestsErrors = 0;
            }
            if (match[9] != undefined) {
                result.numTestsFailing = parseInt(match[9]);
            }
            else {
                result.numTestsFailing = 0;
            }
            //result.numTestsFailing = parseInt(match[6]);
            result.numTestsPassing = parseInt(match[2]) - result.numTestsFailing - result.numTestsErrors;
        } else {
            // console.log('The is NO match');
        }

    }
    return result;
}


/**
 * Removes the folder with the given id and sends the given result.
 * Also sets the cookie header.
 * @param res
 * @param result {Object} the result to send back
 * @param id {string} the mantraId representing the folder to delete
 */
function removeFoldersAndSend(res, result, id) {
    // set a cookie with the id as the id of the session
    res.cookie(config.sessionCookieKey, id);

    if (config.removeFolders) {
        util.removeFolder(id)
            .then(function (reply) {
                res.send(result);
            });
    }
    else {
        res.send(result);
    }
};


exports.testProject = function (id, req, res) {
    var testFiles = req.body.testFiles;
    var dstPath = config.mantraPath + id + '/';

    // compiles all test files
    var testToCompile, testsToRun;
    if (req.body.testArgs != undefined) {
        testsToRun = req.body.testArgs.testsToRun;
    }

    if (testsToRun == undefined) {
        // generate the list of files to compile and rum if they are not provided
        testsToRun = util.generateFileNames(testFiles, ".py", "__init__.py"); // get all test files
        testsToRun = testsToRun.replace(/\.\//g, '');
        testsToRun = testsToRun.replace(/.py/g, '');
        testsToRun = testsToRun.replace(/\//g, '.');
        //testsToRun = testsToRun.replace(/Root.test.__init__/g, '');
        //testsToRun = testsToRun.replace(/test.__init__/g, '');
    }

    var command = generatePythonCommand(dstPath, testsToRun); //testToCompile);
    //console.log('Options for existing project '+command);
    util.executeCommandWithPath(command, dstPath, config.compileTimeout, function (stdout, stderror) {
        // send the result here
        var result = {};
        result = parsePythonOutput(stdout + stderror); // adding the compilation output
        result.id = id;

        removeFoldersAndSend(res, result, id);
    });

};