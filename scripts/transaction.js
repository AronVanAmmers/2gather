angular.module('2gather').factory('Transaction', function ($http, $q, API_BASE_URL, $rootScope) {
    var baseUrl = API_BASE_URL; //url to poll transactions
    var timeoutConfig = 5000; //in milliseconds

    function pollTransactionState(transactionHash) {
        var defer = $q.defer();
        $http.get(baseUrl + '/txs/' + transactionHash).error(defer.reject).success(function (res, status) {
            res = parseInt(res);
            switch (res) {
            case 1: //pending
            case 3: //pending (network verified)
                setTimeout(function () { //recursively poll the transaction stage until response changes
                    pollTransactionState(transactionHash).then(defer.resolve);
                }, timeoutConfig);
                break;
            case 2: //error
                defer.reject(res, status);
                break;
            case 4: //success
                defer.resolve(res, status);
                break;
            }
        });

        return defer.promise;

    };

    return function newTransaction(method, url, body) {
        $rootScope.$broadcast('tgLoadingStart');
        var defer = $q.defer();
        switch (method) {
        case 'GET':
            $http.get(baseUrl + '/' + url).success(success).error(error);
            break;
        case 'PATCH':
            $http({
                method: method,
                url: baseUrl + '/' + url,
                data: body
            }).success(function (hashArray) {
                $http({
                    method: 'POST',
                    url: baseUrl + '/mining',
                    data: 'on'
                }).success(function () { //turn on mining
                    hashArray.forEach(function (hash) {
                        pollTransactionState(hash).then(function (res, status) {
                            $http({
                                method: 'POST',
                                url: baseUrl + '/mining',
                                data: 'off'
                            }) //turn mining off after success
                            success(res, status);
                        }, error);
                    });
                }).error(error);
            }).error(error);
            break;
        default:
            $http({
                method: method,
                url: baseUrl + '/' + url,
                data: body
            }).success(function (hash) {
                $http({
                    method: 'POST',
                    url: baseUrl + '/mining',
                    data: 'on'
                }).success(function () { //turn on mining
                    hash = hash.substr(1, hash.length - 2); //hash surrounded in quotes by API
                    pollTransactionState(hash).then(function (res, status) {
                        $http({
                            method: 'POST',
                            url: baseUrl + '/mining',
                            data: 'off'
                        }) //turn mining off after success
                        success(res, status);
                    }, error);
                }).error(error);
            }).error(error);
            break;
        }

        function error(error, status) {
            $rootScope.$broadcast('tgLoadingEnd');
            defer.reject(error, status);
        }

        function success(res, status) {
            $rootScope.$broadcast('tgLoadingEnd');
            defer.resolve(res, status);
        }

        return defer.promise;
    };
});