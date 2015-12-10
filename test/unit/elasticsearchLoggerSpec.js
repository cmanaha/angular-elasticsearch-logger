'use strict';

/* jasmine specs for services go here */

describe('AngularJS ElasticSearch Logger Module:', function() {
  var logProvider,
      moduleTest = this,
      levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];

  beforeEach(function () {
    // Initialize the service provider
    // by injecting it to a fake module's config block
    var fakeModule = angular.module('testing.harness', ['cmanaha.angular-elasticsearch-logger'], function () {});
    fakeModule.config( function(CMRESLoggerProvider) {
      logProvider = CMRESLoggerProvider;
    });

    // Initialize test.app injector
    module('cmanaha.angular-elasticsearch-logger', 'testing.harness');

    // Kickstart the injectors previously registered
    // with calls to angular.mock.module
    inject(function() {});
  });


  describe( 'CMRESLoggerProvider', function() {

    it('create copies of the configuration on the get methods',function(){
        var config = {'host': 'http://192.168.1.41:9200'};
        logProvider.setElasticSearchConfig(config);
        var res = logProvider.getElasticSearchConfig();
        res['host'] = 'http://localhost:9200';
        var secondRes = logProvider.getElasticSearchConfig();
        expect(res).not.toEqual(secondRes);
    });

    it( 'can set the elasticsearch configuration settings', function() {
        var config = {'host': 'http://192.168.1.41:9200'};
        logProvider.setElasticSearchConfig(config);
        var res = logProvider.getElasticSearchConfig();
        expect(res).toEqual(config);
    });

    it( 'can set the logging settings', function() {
        var config = {
            'index': 'sentiment_analysis',
            'type': 'jslog',
            'bufferSize': 5000,
            'flushIntervalInMS': 2500
        };
        logProvider.setLogConfig(config);
        var res = logProvider.getLogConfig();
        expect(config).toEqual(res);
    });

    it( 'can set the application context settings', function() {
        var config = {
            'application': 'MyWebApplication',
            'AppVersion': '0.1',
            'environment': 'Development'
        };
        logProvider.setApplicationLogContext(config);
        var res = logProvider.getApplicationLogContext();
        expect(config).toEqual(res);
    });

  });

  describe( 'CMRESLogger', function() {
    var loggerSvc, $log, $httpBackend;
    var esConfig = {
      'host': 'http://192.168.1.41:9200',
      'apiVersion': '1.7'
    };

    var logConfig = {
      'index': 'unit_test',
      'type': 'jslog',
      'bufferSize': 1,
      'flushIntervalInMS': 1000
    };

    var appLogContextConfig = {
      'application': 'unit_test',
      'AppVersion': '0.1',
      'environment': 'Development'
    };

    var TestException = function(message) {
      var self = this;
      self.message = message;
      self.exceptionType = 'TestException';
    }

    beforeEach(function () {
      inject(function ($injector) {
        loggerSvc = $injector.get('CMRESLogger');
        $log = $injector.get('$log');
        $httpBackend = $injector.get('$httpBackend');
      });
      
      /*
      spyOn(loggerSvc, 'info').and.callFake(function(message) {
        $log.info('Calling loggerSvc at Info level wth :' +  message);
      });
      */
    });

    it('should be registered', function () {
      expect(loggerSvc).not.toBe(null);
    });

    it('will send a simple message to elasticsearch at all levels when properly configured', function () {
      logProvider.setElasticSearchConfig(esConfig);
      logProvider.setLogConfig(logConfig);
      logProvider.setApplicationLogContext(appLogContextConfig);
      
      loggerSvc.info("Test message , at INFO");
      loggerSvc.debug("Test message, at DEBUG");
      loggerSvc.warning("Test message, at WARNING");
      loggerSvc.error("Test message, at ERROR");
    });


    it('will send a message with extended properties to elasticsearch at all levels when properly configured', function () {
      logProvider.setElasticSearchConfig(esConfig);
      logProvider.setLogConfig(logConfig);
      logProvider.setApplicationLogContext(appLogContextConfig);
      
      var properties = {};
      properties['string_id'] = 'StringIDValue';
      properties['metric_int'] = 4;
      properties['metric_float'] = 4.4;
      properties['nested_object'] = {};
      properties['nested_object']['name'] =  'name_example';


      loggerSvc.info("Test message , at INFO", properties);
      loggerSvc.debug("Test message, at DEBUG", properties);
      loggerSvc.warning("Test message, at WARNING", properties);
      loggerSvc.error("Test message, at ERROR", properties);
    });

    it('will send a errorWithException to elasticsearch when properly configured', function () {
      logProvider.setElasticSearchConfig(esConfig);
      logProvider.setLogConfig(logConfig);
      logProvider.setApplicationLogContext(appLogContextConfig);
      
      loggerSvc.errorWithException("Error Message", new TestException("The Exception"));
    });

    it('will send a warningWithException to elasticsearch when properly configured', function () {
      logProvider.setElasticSearchConfig(esConfig);
      logProvider.setLogConfig(logConfig);
      logProvider.setApplicationLogContext(appLogContextConfig);
      
      loggerSvc.warningWithException("Error Message", new TestException("The Exception"));
    });

    it('will flush the messages when properly configured', function () {
      logProvider.setElasticSearchConfig(esConfig);
      logProvider.setLogConfig(logConfig);
      logProvider.setApplicationLogContext(appLogContextConfig);
      
      loggerSvc.info("Test message , at INFO");

      loggerSvc.flush();
    });

    it('when flush fails the callback method defined in the logConfig.internalLogFunction gets called', function () {
      logProvider.setElasticSearchConfig(esConfig);
      logProvider.setLogConfig(logConfig);
      logProvider.setApplicationLogContext(appLogContextConfig);
      
      //FIXME: this part of the test is not going through the right branch
      //still requires attention
      $httpBackend.expectPOST('/_bulk').respond(400,'');
      loggerSvc.info("Test message , at INFO");
    });

  });


});
