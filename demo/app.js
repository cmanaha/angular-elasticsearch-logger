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
            //'host': 'http://localhost:9200',
            'host': 'http://192.168.1.41:9200',
            'selector': 'random',
            'connectionClass': 'angular',
            'suggestCompression': false,
            'minSockets': 10,
            'maxSockets': 15,
            'keepAlive': true,
            'requestTimeout': 30000,
            'maxRetries': 5,
            'sniffOnStart': true
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

        self.logIt = function() {
            $log.info( self.message );
            CMRESLogger.info( self.message );
        };

    }]);





