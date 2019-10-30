/**
 * Created by Martin on 12/09/14.
 */
'use strict';

var util = require('./util.js'),
    config = require('./config/config.js');

var folderSrc = /Root\.src\./g,
    folderTests = /Root\.test\./g,
    folderGradingTests = /Root\.test_submission\./g;
/**
 * Generates the command line string to invoke the compiler
 * @path: a full directory path
 */
function generateJavaCompilerCommand(path, mainClass, buildPath, compilationOutputFolder) {
    // this original options path needs to be adapted for running it with docker
    // var options = config.vmCompilationConfig + 'javac -cp .:'+config.jUnitPath +' ' + mainClass;
    var makeDir = "";
    var dArg = "";
    if (compilationOutputFolder != "") {
        makeDir = " mkdir " + compilationOutputFolder + ";";
        dArg = " -d " + compilationOutputFolder
    }
    var options = config.getVMCompilationConfig('Java-JUnit', path) + 'sh -c "cd ' + path + '; ' + makeDir +
        ' javac -cp \\"' + buildPath + '\\" ' + dArg + ' ' + mainClass + ' && echo \\"Compilation successful\\" && echo\\"\\" "';

    //console.log('Vm config for Compiler '+ options);
    return options;
}

/**
 * Generates the command line string to invoke JUnit
 * @path: a full directory path
 */
function generateJavaJUnitCommand(path, mainClass, buildPath, compilationOutputFolder) {

    // this original options path needs to be adapted for running it with docker
    // var options = config.vmCompilationConfig + 'java -cp .:'+config.jUnitPath+' org.junit.runner.JUnitCore ' + mainClass;

    if (compilationOutputFolder != "") {
        compilationOutputFolder = ":" + compilationOutputFolder;
    }
    var options = config.getVMRunConfig('Java-JUnit', path) + 'sh -c "cd ' + path + '; java -cp \\"' + buildPath + compilationOutputFolder + '\\" org.junit.runner.JUnitCore ' + mainClass + ';echo"" "';

    //console.log('Vm config for JUnit '+ options);
    return options;
}


/**
 * Takes the Java output and generates a JSON object.
 */
function parseJavaCompilerOutput(output) {
    var result = {};
    result.compilationError = true;
    result.warningError = false;
    result.errors = [];
    result.warnings = [];


    // the the compilation was successful, we must find the "Compilation successful" message in the output
    // if not, there must have been a compilation error
    // Note: what we should do in parseJavaCompilerOutput is check the exit-code of the Java compiler
    // But since we run a script to control timeouts etc. for the container, we don't have
    // access to the exit-code of the compiler. Thus, we use this workaround for now
    if (output.indexOf("Compilation successful") !== -1) {
        result.compilationError = false;
    }

    result.dump = output;
    result.outputCompiler = output;

    return result;
}

/**
 * Takes the Java JUnit output and generates a JSON object extracting the number of test that pass and the ones that fail.
 */
function parseJavaJUnitOutput(output, result) {
    result.output = output;
    result.numTestsPassing = 0;
    result.numTestsFailing = 0;
    var match = /(Tests\srun:\s)([0-9]+),(\s\sFailures:\s)([0-9]+)/.exec(output);
    //console.log(output);
    if (match != null) {
        // There was a match.There are failed tests

        result.numTestsFailing = parseInt(match[4]);
        result.numTestsPassing = parseInt(match[2]) - result.numTestsFailing;

    } else {
        // No match. There are no failed tests; extract number of successful tests
        match = /(OK\s\()([0-9]+)(\stest(s*)\))/.exec(output);
        if (match != null) {
            result.numTestsPassing = parseInt(match[2]);
            result.numTestsFailing = 0;
        } else {
            // console.log('The is NO a match');
        }

    }
};


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
    var settings = util.getCompilerSettings(req.body.files);
    if (settings.error) {
        // console.log('Error when trying to read settings from codeboard.json file.');
        // there was an error parsing the JSON object
        var result = {};
        result = util.getCodeboardSettingError();
        res.send(result);
    }
    else {
        var buildPath = "";
        var compilationOutputFolder = "";
        if (settings.ClassPath != undefined) {
            buildPath = settings.ClassPath;
        }
        if (settings.DirectoryForClassFiles != undefined) {
            compilationOutputFolder = settings.DirectoryForClassFiles;
        }

        var testFiles = req.body.testFiles;
        var files = req.body.files;

        var dstPath = config.mantraPath + id + '/';
        // compiles all test files
        var testToCompile, testsToRun;
        if (req.body.testArgs != undefined) {
            testToCompile = req.body.testArgs.testsToCompile;
            testsToRun = req.body.testArgs.testsToRun;
        }


        if (testToCompile == undefined || testsToRun == undefined) {
            // generate the list of files to compile and rum if they are not provided
            testToCompile = util.generateFileNames(testFiles, ".java"); // get all test files
            // get the names of the classes to run the tests: replaces ./test/foo.java to test.foo
            testsToRun = testToCompile;
            testToCompile = testToCompile + " " + util.generateFileNames(files, ".java"); // get all test files


            testsToRun = testsToRun.replace(/\.\//g, '');
            testsToRun = testsToRun.replace(/.java/g, '');
            testsToRun = testsToRun.replace(/\//g, '.');
            testsToRun = testsToRun.replace(folderSrc, '');
            testsToRun = testsToRun.replace(folderTests, '');
            testsToRun = testsToRun.replace(folderGradingTests, '');
        }

        var command = generateJavaCompilerCommand(dstPath, testToCompile, buildPath, compilationOutputFolder); //testToCompile);
        //console.log('Options for existing project '+command);
        util.executeCommandWithPath(command, dstPath, config.compileTimeout, function (stdout, stderror) {
            // send the result here
            var result = {};

            result = parseJavaCompilerOutput(stdout + stderror); // adding the compilation output
            result.id = id;

            var command = generateJavaJUnitCommand(dstPath, testsToRun, buildPath, compilationOutputFolder);
            //console.log('Options for existing project '+command);
            if (result.compilationError == false) {
                util.executeCommandWithPath(command, dstPath, config.compileTimeout, function (stdout, stderror) {
                    parseJavaJUnitOutput(stdout + stderror, result);
                    removeFoldersAndSend(res, result, id);
                });
            }
            else {
                result.output = "Compilation error, JUnit was not run.";
                result.numTestsPassing = -1;
                result.numTestsFailing = -1;
                removeFoldersAndSend(res, result, id);
            }
        });
    }
};