/**
 * Created by hce on 08/07/15.
 *
 * Language properties file projects of type Java-JUnit.
 */

'use strict';

var util = require('../util.js'),
  CONST = require('../config/const.js');

module.exports = {

  // name of the language
  name: CONST.LANGUAGE_NAME.JAVA_JUNIT,

  // file extension of the source files
  filenameExtension: '.java',

  // is this a static or dynamic language? e.g. Python is dynamic
  isDynamicLanguage: false,

  // does the language come with supports for (unit) tests?
  // TODO: once we move from Kali to Mantra, make this true :: true
  isLanguageWithTestSupport: true,

  // name of the docker image that is used to execute "compile" or "run" for this language
  dockerImage: 'cobo/java',

  // timeout settings that will apply to all containers of this language
  timeoutSettings: {
    // time (sec) that's the maximum allowed CPU usage time
    cpu: 12,
    // time (sec) that's the maximum allowed session time, i.e. the time before a running container is terminated
    session: 900, // 15 minutes
    // time (sec) that's the maximum allowed session time in case a session is NOT a WS streaming session (i.e. no user input)
    // Note that the timeoutCPU still applies
    sessionNoStream: 20,
  },

  // path of the working directory relative to the folder with the mantraId (used when we need to move into "/Root")
  // e.g. value "Root" would allow us to construct /tmp/projects/mantraId/ + ./Root
  dockerWorkingDirRel: '',

  // is a codeboard configuration file (e.g. codeboard.json) required and (if yes) which properties must it provide
  codeboardConfig: {
    isRequired: true,

    expectedProperties: [
      "MainClassForRunning",
      "ClassPath",
      "DirectoryForClassFiles",
      "DirectoryForSourceFiles",
      "DirectoryForTestFiles",
      "DirectoryForTestSubmissionFiles"
    ]
  },


  /**
   * Function returns the command to run a project of this language.
   * @param {object} aCodeboardConfig the codeboardConfig object
   */
  getCommandForRunAction: function (aCodeboardConfig) {
    var cmd = 'java -cp ' + aCodeboardConfig.DirectoryForClassFiles + ' ' + aCodeboardConfig.MainClassForRunning;
    return cmd;
  },


  /**
   * Function returns the command to compile a project of this language.
   * @param {file[]} aFiles array of source files
   * @param {object} aCodeboardConfig the codeboardConfig object
   */
  getCommandForCompileAction: function (aFiles, aCodeboardConfig) {

    // Note: we need to create the folder for the class files because the -d option of javac doesn't create it
    // automatically. Using the mkdir -p, the folder will only be created if it doesn't already exist.
    var createFolderCmd = 'mkdir -p ' + aCodeboardConfig.DirectoryForClassFiles;

    var listOfFilenames = util.getListOfFilenames(aFiles, this.filenameExtension);
    var compileCmd = 'javac -cp "' + aCodeboardConfig.ClassPath + '" -d "' + aCodeboardConfig.DirectoryForClassFiles + '" ' + listOfFilenames + ' && echo "Compilation successful"';

    return createFolderCmd + ';' + compileCmd;
  },


  /**
   * Function takes a compiler output as argument and returns "true" if that output
   * implies that the compilation had one or more errors.
   * By default (e.g. for dynamic languages) this function should return false.
   * @param {string} aCompilerOutput  the output generated by the compiler
   * @returns {boolean} true is "aCompilerOutput" represents compilation errors (by default false)
   */
  hasCompilationErrors: function (aCompilerOutput) {
    var hasErrors = true;

    if (aCompilerOutput === '' || aCompilerOutput === '\n' || aCompilerOutput.indexOf("Compilation successful") !== -1) {
      hasErrors = false;
    }

    return hasErrors;
  },


  /**
   * Function takes a test output as argument and returns an object of structure
   * {compilationError:, numTestsPassing:, numTestsFailing:}
   * By default this function should return {compilationError: false, numTestsPassing: -1, numTestsFailing: -1}.
   * @param {string} aTestOutput  the output generated by running the test command
   * @returns {Object} object representing the findings of parsing the aTestOutput
   */
  parseTestOutput: function (aTestOutput) {

    // TODO: implement real parsing here

    return {
      compilationError: false,
      numTestsPassing: -1,
      numTestsFailing: -1
    }
  }
};
