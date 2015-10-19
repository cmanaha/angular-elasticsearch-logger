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


//Using decorator to override the angular $log functionality
angular.module('ElasticSearchLoggerDemoApp')
	.config(['$provide',function($provide){
	    $provide.decorator('$log',['$delegate','$injector',function($delegate, $injector){
        
        var eslogger = $injector.get('CMRESLogger');

        var wrapMethod = function( originalMethod, esLoggerMethod ){
            var retMethod = function(){
                var args = [].slice.call(arguments);
                originalMethod.apply(null,args);
                esLoggerMethod(args);
            };

            return retMethod;
        };


        //wrap the existing API
        $delegate.log =    wrapMethod($delegate.log, eslogger.info);
        $delegate.debug =  wrapMethod($delegate.debug, eslogger.debug);
        $delegate.info =   wrapMethod($delegate.info, eslogger.info);
        $delegate.warn =   wrapMethod($delegate.warn, eslogger.warn);
        $delegate.error =  wrapMethod($delegate.error, eslogger.error);

        return $delegate;

    }]);
}]);

//capture unhandled exceptions and log them to ElasticSearch
angular.module('ElasticSearchLoggerDemoApp')
  	.factory('$exceptionHandler', function() {
  		return function(exception, cause) {
    		exception.message += ' (caused by "' + cause + '")';
    		console.error(exception.message);
  		};
	});


angular
    .module('ElasticSearchLoggerDemoApp')
    .controller( 'DemoCtrl', ['$log',function($log){
    	var self = this;
        self.inputToken = null;
        self.message = '';

        self.TestException = function(message){
        	this.message = message;
        };


        self.logIt = function() {
            $log.info( self.message );
        };

    }]);

