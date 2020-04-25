'use strict';

// Development specific configuration
// ==================================
module.exports = {


  // the path where Mantra should store a project's files
  // NOTE: with boot2docker, mounting folders from the host will only work correctly for subfolders in the /Users/ directory
  // see also: http://stackoverflow.com/questions/26348353/mount-volume-to-docker-image-on-osx
  mantraPath: process.env.MANTRA_PATH || '/home/mantra/coboTmp',

  // the source path to the external libraries
  librariesHostSource: process.env.LIBRARIES_HOST_SOURCE || '/home/mantra/mantra/server/libraries',

  // the container destination of external libraries
  librariesContainerDest: process.env.LIBRARIES_CONTAINER_DEST || '/home/mantra/libraries',

  // configuration of the Docker Remote API
  docker: {
    // the Url of the Docker Remote API
    hostIP: process.env.DockerHostUrl || "192.168.59.103",
    // the port of the Docker Remote API
    hostPort: process.env.DockerHostPort || "2375"
  }

};
