/**
 * @ngdoc function
 * @name esLogging.esLogProvider
 * @description
 * # MainCtrl
 * Controller of the clientSideApp
 */

angular.module('cmanaha.angular-elasticsearch-logger',['elasticsearch'])
    .provider('CMRESLogger', [function ()
{
    var self = this;
    self.esClientDetails = {};
    self.logDetails = {
        'index': 'defaul_angularjs_index',
        'type': 'jslog',
        'bufferSize': 5000,
        'flushIntervalInMS': 2500,
    };
    
    self.appDetails = {};

    self.setElasticSearchConfig = function (elasticSearchConfig) {
        self.esClientDetails = elasticSearchConfig;
    };

    self.getElasticSearchConfig = function(){
        var res = angular.copy(self.esClientDetails);
        return res;
    };
    
    self.setLogConfig = function (applicationLogConfig) {
        self.logDetails = applicationLogConfig;
    };

    self.getLogConfig = function(){
        var res = angular.copy(self.logDetails);
        return res;
    };

    self.setApplicationLogContext = function (applicationLogConfig) {
        self.appDetails = applicationLogConfig;
    };

    self.getApplicationLogContext = function(){
        var res = angular.copy(self.appDetails);
        return res;
    };


    //self.$get = ['$interval', 'esFactory', function ($interval, esFactory) {
    self.$get = ['$injector', function ($injector) {

        var esFactory = $injector.get('esFactory');
        var interval = $injector.get('$interval');
        self.logBuffer = [];

        var esFact = esFactory;
        self.esClient = esFact(self.esClientDetails);

        self.level = {
            DEBUG: 'DEBUG',
            INFO: 'INFO',
            WARN: 'WARNING',
            ERROR: 'ERROR'
        };


        self.numPadding = function (num, size) {
            var ret = num + '';
            while (ret.length < size) {
                ret = '0' + ret;
            }
            return ret;
        };

        self.getIndexName = function (indexPrefx) {
            var d = new Date(Date.now());
            var ret = indexPrefx + '-' + d.getUTCFullYear() + '.' + self.numPadding(d.getUTCMonth() + 1, 2) + '.' + self.numPadding(d.getUTCDate(), 2);
            return ret;
        };

        self.decodeStackTraceLine = function (line) {
            var lineTrc = line.split('.js');
            var method = lineTrc[0] + '.js';
            var lineNum = lineTrc[1].split(':')[1];
            var charNum = lineTrc[1].split(':')[2];
            return [method, lineNum, charNum];
        };

        self.getVariableWithDefault = function (variable, defaultValue){
            var res = 'Unknown';
            if (typeof variable === 'undefined'){
                res = defaultValue;
            } else {
                res = variable;
            }
            return res;
        };

        self.internalLog = function (logMsg, level, exception) {

            //Add operation to the backlog
            self.logBuffer.push(
                {
                    index: {
                        _index: self.getIndexName(self.logDetails.index),
                        _type: self.logDetails.type,
                    }
                }
            );

            var data = {
                message: logMsg,
                level: level,
                timestamp: new Date(Date.now()).toISOString(),
                browserCodeName: self.getVariableWithDefault(navigator.appCodeName,'Unknown'),
                browserName: self.getVariableWithDefault(navigator.appName,'Unknown'),
                browserVersion: self.getVariableWithDefault(navigator.appVersion,'Unknown'),
                browserProduct: self.getVariableWithDefault(navigator.product,'Unknown'),
                browserPlatform: self.getVariableWithDefault(navigator.platform,'Unknown'),
                browserUserAgent: self.getVariableWithDefault(navigator.userAgent,'Unknown'),
                browserGeolocation: self.getVariableWithDefault(navigator.geolocation,'Unknown')
            };

            //add additional application data context
            angular.forEach(self.appDetails, function (value, key) {
                data[key] = value;
            }); 

            //add details about the method, line number, etc.
            //if the log was thrown from an exception, log the exception details and
            //exception stacktrace
            var trace = [];
            var traceInfo = [];
            if (typeof (exception) === 'undefined') {
                trace = printStackTrace();
            } else {
                trace = printStackTrace(exception);
                var relevantStacktrace = trace.slice(5);
                var fullTraceStr = 'Exception Msg [ ' + exception.message + '] \n';
                angular.forEach(relevantStacktrace, function (traceLine) {
                    traceInfo = self.decodeStackTraceLine(traceLine);
                    fullTraceStr = fullTraceStr + '\t' + traceInfo[0] + ' LineNum [' + traceInfo[1] + '] charNum [' + traceInfo[2] + ']\n';
                });
                data.stacktrace = fullTraceStr;
            }
            traceInfo = self.decodeStackTraceLine(trace[5]);
            data.method = traceInfo[0];
            data.lineNum = traceInfo[1];
            data.charNum = traceInfo[2];

            //Add document to the backlog
            self.logBuffer.push(data);

            if (self.logBuffer.length / 2 >= self.logDetails.bufferSize) {
                self.internalFlush();
            }
        };

        self.internalFlush = function () {
            if (self.logBuffer.length > 0) {
                self.esClient.bulk({
                    body: self.logBuffer
                }, function (err, rsp) {
                    if (err) {
                        if (self.logDetails.internalLogFunction !== undefined){
                            self.logDetails.internalLogFunction('Got an error [' + err + ']while storing log : ' + angular.toJson(rsp, true));
                        }
                    }
                });
                self.logBuffer = [];
            }
        };

        self.flushInterval = interval(self.internalFlush, self.logDetails.flushIntervalInMS);



        return {
            info: function (message) { self.internalLog(message, self.level.INFO, undefined); },
            warning: function (message) { self.internalLog(message, self.level.WARN, undefined); },
            error: function (message) { self.internalLog(message, self.level.ERROR, undefined); },
            debug: function (message) { self.internalLog(message, self.level.DEBUG, undefined); },
            warningWithException: function (message, exception) { self.internalLog(message, self.level.WARN, exception); },
            errorWithException: function (message, exception) { self.internalLog(message, self.level.ERROR, exception); },
            flush: function(){self.internalFlush();},
        };
    }];
}]);
