/**
 * Created by hce on 08/07/15.
 *
 * Language properties file projects of type Java.
 */

'use strict';

var util = require('../util.js'),
  CONST = require('../config/const.js');

module.exports = {

  // name of the language
  name: CONST.LANGUAGE_NAME.JAVA,

  // file extension of the source files
  filenameExtension: '.java',

  // external library extension of the source files
  externalLibraryExtension: '.jar',

  // is this a static or dynamic language? e.g. Python is dynamic
  isDynamicLanguage: false,

  // does the language come with supports for (unit) tests?
  isLanguageWithTestSupport: false,

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
    sessionNoStream: 30,
  },

  // path of the working directory relative to the folder with the mantraId (used when we need to move into "/Root")
  // e.g. value "Root" would allow us to construct /tmp/projects/mantraId/ + ./Root
  dockerWorkingDirRel: '',

  // is a codeboard configuration file (e.g. codeboard.json) required and (if yes) which properties must it provide
  codeboardConfig: {
    isRequired: true,

    expectedProperties: [
      "MainFileForCompilation", // TODO: this is obsolete, as we compile all files (weather referenced or not from Main)
      "MainClassForRunning"
    ]
  },


  /**
   * Function returns the command to run a project of this language.
   * @param {object} aCodeboardConfig the codeboardConfig object
   */
  getCommandForRunAction: function (aCodeboardConfig) {
    let cmd;
    if (undefined !== aCodeboardConfig.ExternalLibraries && aCodeboardConfig.ExternalLibraries.length > 0) {
      cmd = 'java -cp "./Root:' + util.getListOfExternalLibraries(aCodeboardConfig.ExternalLibraries, this.externalLibraryExtension) + '" ' + aCodeboardConfig.MainClassForRunning;
    } else {
      cmd = 'java -cp ./Root ' + aCodeboardConfig.MainClassForRunning;
    }
    return cmd;
  },


  /**
   * Function returns the command to compile a project of this language.
   * @param {file[]} aFiles array of source files
   * @param {object} aCodeboardConfig the codeboardConfig object
   */
  getCommandForCompileAction: function (aFiles, aCodeboardConfig) {
    let listOfFilenames = util.getListOfFilenames(aFiles, this.filenameExtension);
    let compileCmd;
    if (undefined !== aCodeboardConfig.ExternalLibraries && aCodeboardConfig.ExternalLibraries.length > 0) {
      compileCmd = 'javac -cp "' + util.getListOfExternalLibraries(aCodeboardConfig.ExternalLibraries, this.externalLibraryExtension) + '" ' + listOfFilenames + ' && echo "Compilation successful"';
    } else {
      compileCmd = 'javac ' + listOfFilenames + ' && echo "Compilation successful"';
    }
    return compileCmd;
  },

  /**
   * Function to compile and run code at the same time
   * @author Janick Michot
   * @param aFiles
   * @param aCodeboardConfig
   * @returns {string}
   */
  getCommandForCompileAndRunAction: function (aFiles, aCodeboardConfig) {
    return this.getCommandForCompileAction(aFiles, aCodeboardConfig) + " && " + this.getCommandForRunAction(aCodeboardConfig);
  },

  /**
   * Function to test a project.
   * todo wieso funktioniert/nutzen wir das nicht?
   * @param aFiles
   * @param aCodeboardConfig
   * @returns {string}
   */
  getCommandForTestAction: function (aFiles, aCodeboardConfig) {
    return 'java -cp ./Root ' + aCodeboardConfig.MainClassForRunning  + '< ./Root/Stdin.txt';
  },

  /**
   * Function takes a compiler output as argument and returns "true" if that output
   * implies that the compilation had one or more errors.
   * By default (e.g. for dynamic languages) this function should return false.
   * @param {string} aCompilerOutput  the output generated by the compiler
   * @returns {boolean} true is "aCompilerOutput" represents compilation errors (by default false)
   */
  hasCompilationErrors: function (aCompilerOutput) {
    let hasErrors = true;
    if (aCompilerOutput === '' || aCompilerOutput === '\n' || aCompilerOutput.indexOf("Compilation successful") !== -1 ) {
      hasErrors = false;
    }
    return hasErrors;
  },

  /**
   * Function that takes a compiler output as argument and returns an array of separated compilation errors.
   * The segmentation is done with a regex expression.
   * @param aCompilerOutput
   * @returns {{output: string, line: number, position: number}[]}
   */
  getCompilationOutputArray: function(aCompilerOutput) {
    // this regex matches until next occurrence of `./File/Name.java:x:` or end of compilation error by using positive lookahead
    let regexForSegmentation = new RegExp('.+?(?=(\\.[A-Za-z/]+.java:\\d+:)|(\\d+ errors?$))', 'g');
    // regex used to extract the line of occurrence
    let regexForLine = new RegExp('(?<=\\.\\/.+[A-Za-z]+\\.java:)\\d+');
    let regexForPosition = "";

    // escape output from any line breaks to make regex easier
    aCompilerOutput = aCompilerOutput.replace(/(\r\n|\n|\r)/gm, " ").trim(); // todo is this required?

    let compilerOutputArray = aCompilerOutput.match(regexForSegmentation) || [aCompilerOutput];

    return compilerOutputArray.map(function(exception) {

      let line = exception.match(regexForLine);

      return {
        line: line[0],
        position: 0,
        output: exception
      };
    });
  }
};
