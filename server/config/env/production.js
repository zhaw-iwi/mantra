'use strict';

// Production specific configuration
// =================================
module.exports = {

  // Server port
  serverPort:     process.env.PORT || 9090,

  // the path where Mantra should store a project's files
  mantraPath: process.env.MANTRA_PATH || '/tmp/projects',

  // the path where language specific libraries are stored
  // this folder is mounted into the docker containers
  libraryPath: process.env.MANTRA_LIBRARY_PATH || '/mantra/server/libraries',

  // configuration of the Docker Remote API
  docker: {
    // the Url of the Docker Remote API
    hostIP: process.env.DockerHostUrl || "127.0.0.1",
    // the port of the Docker Remote API
    hostPort: process.env.DockerHostPort || "4243"
  }
};
