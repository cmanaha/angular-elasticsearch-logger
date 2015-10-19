module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        jshint: {
            options: {
                jshintrc: true
            },
            files: {
                src: ['angular-elasticsearch-logger.js']
            }
        },

        uglify: {
            options : {
                sourceMap: true
            },
            main: {
                files: { 'angular-elasticsearch-logger.min.js': ['angular-elasticsearch-logger.js'] }
            }
        },

        karma: {
          unit: {
            configFile: 'test/karma.conf.js',
            singleRun: true
          },
          //continuous integration mode: run tests once in PhantomJS browser.
          travis: {
            configFile: 'test/karma.conf.js',
            singleRun: true,
            browsers: ['Chrome_travis_ci']
          }
      },

      watch: {
          jshint: {
              files: ['angular-elasticsearch-logger.js'],
              tasks: ['jshint']
          },

          karma: {
              files: ['*.js', '!*.min.js'],
              tasks: ['karma:unit:run'] //NOTE the :run flag
          }
      },
	
      clean : {
	packages: ["bower_components","node_modules","build"]
      }

    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-contrib-clean');

    grunt.registerTask('default', ['jshint','uglify'] );
    grunt.registerTask('test', [ 'karma:travis' ] );
    grunt.registerTask('test-all', ['karma:unit'] );
};
