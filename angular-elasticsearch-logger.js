/**
 * @ngdoc function
 * @name esLogging.esLogProvider
 * @description
 * # MainCtrl
 * Controller of the clientSideApp
 */

angular.module('cmanaha.angular-elasticsearch-logger',['elasticsearch']).provider('CMRESLogger', [function ()
{
    var self = this;
    self.esClientDetils = {};
    self.logDetails = {
        'index': 'defaul_js_index',
        'type': 'jslog',
        'bufferSize': 5000,
        'flushIntervalInMS': 2500,
        'logToConsole': true 
    };
    self.appDetails = {};

    self.setElasticSearchConfig = function (elasticSearchConfig) {
        self.esClientDetils = elasticSearchConfig;
    };
    
    self.setLogConfig = function (applicationLogConfig) {
        self.logDetails = applicationLogConfig;
    };

    self.setApplicationLogContext = function (applicationLogConfig) {
        self.appDetails = applicationLogConfig;
    };

    //self.$get = ['$interval', 'esFactory', function ($interval, esFactory) {
    self.$get = ['$injector', function ($injector) {

        var esFactory = $injector.get('esFactory');
        var interval = $injector.get('$interval');
        self.logBuffer = [];

        var esFact = esFactory;
        self.esClient = esFact(self.esClientDetils);

        self.level = {
            INFO: 'INFO',
            DEBUG: 'DEBUG',
            ERROR: 'ERROR',
            WARN: 'WARNING'
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
                browserName: navigator.appName,
                browserVersion: navigator.appVersion,
                browserMinVersion: navigator.appMinorVersion,
                browserProduct: navigator.product,
                browserVendor: navigator.vendor,
                browserUserAgent: navigator.userAgent,
                browserUserLang: navigator.userLanguage,
                browserConSpeed: navigator.connectionSpeed,
                browserLang: navigator.browserLanguage,
                browserGeolocation: navigator.geolocation,
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
                self.flush();
            }
        };

        self.flush = function () {
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

        self.flushInterval = interval(self.flush, self.logDetails.flushIntervalInMS);

        return {
            info: function (message) { self.internalLog(message, self.level.INFO, undefined); },
            warning: function (message) { self.internalLog(message, self.level.WARN, undefined); },
            error: function (message) { self.internalLog(message, self.level.ERROR, undefined); },
            debug: function (message) { self.internalLog(message, self.level.DEBUG, undefined); },
            warningWithException: function (message, exception) { self.internalLog(message, self.level.WARN, exception); },
            errorWithException: function (message, exception) { self.internalLog(message, self.level.ERROR, exception); },
        };
    }];
}]);