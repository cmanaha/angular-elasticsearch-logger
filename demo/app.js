'use strict';

angular
	.module('ElasticSearchLoggerDemoApp', [
    	'cmanaha.angular-elasticsearch-logger'
  	]);

angular
    .module('ElasticSearchLoggerDemoApp')
    .config(['CMRESLoggerProvider',function ( esLoggingProvider) {
        // Config parameters from 
        // http://www.elasticsearch.org/guide/en/elasticsearch/client/javascript-api/current/configuration.html

        esLoggingProvider.setElasticSearchConfig({
            //point the host:port to an elasticsearch instance or run
            //an elasticsearch service in your own
            'host': 'http://localhost:9200',
            'apiVersion': '1.7'
        });

        esLoggingProvider.setLogConfig({
            'index': 'demo_app_index',
            'type': 'jslog',
            'bufferSize': 1,
            'flushIntervalInMS': 1000
        });

        esLoggingProvider.setApplicationLogContext({
            'application': 'DemoApp',
            'version': '0.0.1',
            'environment': 'Development'
        });
    }]);


angular
    .module('ElasticSearchLoggerDemoApp')
    .controller( 'DemoCtrl', ['$log','CMRESLogger',function($log, CMRESLogger){
        var self = this;
        self.inputToken = null;
        self.message = '';

        self.TestException = function(message){
            this.message = message;
        };


        self.logIt = function() {
            $log.info( self.message );
            CMRESLogger.info( self.message );
        };

        self.logItWithProperties = function(message,number) {
            var properties = {};
            properties['test1'] = 'property';
            properties['number'] = number;
            CMRESLogger.info(message,properties);
        };


        self.logMultipleTimes = function(){
            var numberOfLogs = Math.floor((Math.random() * 200) + 1);
            
            for (var i=0 ; i<numberOfLogs; i++){
                var level = Math.floor((Math.random() * 6) + 1);
                switch(level){
                    case 1: 
                        CMRESLogger.info( 'message ['+i+']: ' + self.message );
                        break;
                    case 2: 
                        CMRESLogger.debug( 'message ['+i+']: ' + self.message );
                        break;
                    case 3: 
                        CMRESLogger.warning( 'message ['+i+']: ' + self.message );
                        break;
                    case 4: 
                        CMRESLogger.error( 'message ['+i+']: ' + self.message );
                        break;
                    case 5: 
                        CMRESLogger.errorWithException( 'message ['+i+']: ' + self.message , new self.TestException('message'));
                        break;
                    case 6:
                        self.logItWithProperties('message ['+i+']: ' + self.message,i);
                        break;
                }
            }
        };


    }]);

