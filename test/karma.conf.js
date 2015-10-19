// to debug tests run: 
//	node_modules/karma/bin/karma start ./test/karma.conf.js --browsers=Chrome --single-run=false --debug
// from the repo root directory, then use chrome for a javascript 
// debugging session

module.exports = function(config){
    var sourcePreprocessors = 'coverage';
    
    function isDebug(argument) {
      return argument === '--debug';
    };
    
    if (process.argv.some(isDebug)) {
      sourcePreprocessors = [];
    }

    config.set({

        basePath : '../',

        files : [
            'bower_components/angular/angular.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'bower_components/elasticsearch/elasticsearch.js',
            'bower_components/elasticsearch/elasticsearch.angular.js',
            'bower_components/stacktrace-js/stacktrace.js',
            'angular-elasticsearch-logger.js',
            'test/unit/**/*.js'
        ],

        customLaunchers: {
          Chrome_travis_ci: {
            base: 'Chrome',
            flags: ['--no-sandbox']
          }
        },

        autoWatch : true,

        frameworks: ['jasmine'],

        browsers : ['Chrome'],

        reporters: ['spec','coverage', 'coveralls'],

        preprocessors: {
            // source files, that you wanna generate coverage for
            // do not include tests or libraries
            // (these files will be instrumented by Istanbul)
            //'*.js': ['coverage']
            '*.js': sourcePreprocessors
        },

        plugins : [
            'karma-chrome-launcher',
            'karma-phantomjs-launcher',
            'karma-spec-reporter',
            'karma-jasmine',
            'karma-coverage',
            'karma-coveralls'
        ],

        junitReporter : {
            outputFile: 'build/reports/test-results/unit.xml',
            suite: 'unit'
        },

        coverageReporter: {
            dir : 'build/reports/coverage/',
            reporters: [
              // reporters not supporting the `file` property
              { type: 'html', subdir: 'report-html' },
              { type: 'lcov', subdir: 'report-lcov' },
              // reporters supporting the `file` property, use `subdir` to directly
              // output them in the `dir` directory
              { type: 'cobertura', subdir: '.', file: 'cobertura.txt' },
              { type: 'lcovonly', subdir: '.', file: 'report-lcovonly.txt' },
              { type: 'teamcity', subdir: '.', file: 'teamcity.txt' },
              { type: 'text', subdir: '.', file: 'text.txt' },
              { type: 'text-summary', subdir: '.', file: 'text-summary.txt' },
            ]
        }
    });
};
