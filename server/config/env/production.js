'use strict';

// Production specific configuration
// =================================
module.exports = {

  // Server port
  serverPort:     process.env.PORT || 9090,

  // the path where Mantra should store a project's files
  mantraPath: process.env.MANTRA_PATH || '/tmp/projects',

  // the source path to the external libraries
  librariesHostSource: process.env.LIBRARIES_HOST_SOURCE || '/home/mantra/mantra/server/libraries',

  // the container destination of external libraries
  librariesContainerDest: process.env.LIBRARIES_CONTAINER_DEST || '/home/mantra/libraries',

  // configuration of the Docker Remote API
  docker: {
    // the Url of the Docker Remote API
    hostIP: process.env.DockerHostUrl || "127.0.0.1",
    // the port of the Docker Remote API
    hostPort: process.env.DockerHostPort || "4243"
  }
};
