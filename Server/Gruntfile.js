// Gruntfile.js

module.exports = (grunt) => {
    grunt.initConfig({
      execute: {
        target: {
          src: ['server.js']
        }
      },
      watch: {
        scripts: {
          files: ['server.js'],
          tasks: ['execute'],
        },
      }
    });
  
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-execute');
  };