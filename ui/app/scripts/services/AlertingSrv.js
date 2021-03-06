(function() {
    'use strict';
    angular.module('theHiveServices')
        .factory('AlertingSrv', function($q, $http, $rootScope, StatSrv, StreamSrv, PSearchSrv, AlertStatus) {

            var baseUrl = './api/alert';

            var factory = {

                list: function(config, callback) {
                    return PSearchSrv(undefined, 'alert', {
                        scope: config.scope,
                        sort: config.sort || '-date',
                        loadAll: config.loadAll || false,
                        pageSize: config.pageSize || 10,
                        filter: config.filter || '',
                        onUpdate: callback || angular.noop
                    });
                },

                get: function(alertId) {
                    return $http.get(baseUrl + '/' + alertId, {
                        params: {
                            similarity: 1
                        }
                    });
                },

                create: function(alertId, data) {
                    return $http.post(baseUrl + '/' + alertId + '/createCase', data || {});
                },

                update: function(alertId, updates) {
                    return $http.patch(baseUrl + '/' + alertId, updates);
                },

                mergeInto: function(alertId, caseId) {
                    return $http.post(baseUrl + '/' + alertId + '/merge/' + caseId);
                },

                bulkMergeInto: function(alertIds, caseId) {
                    return $http.post(baseUrl + '/merge/_bulk', {
                        caseId: caseId,
                        alertIds: alertIds
                    });
                },

                canMarkAsRead: function(event) {
                    return event.status === 'New' || event.status === 'Updated';
                },

                canMarkAsUnread: function(event) {
                    return event.status === 'Imported' || event.status === 'Ignored';
                },

                markAsRead: function(alertId) {
                    return $http.post(baseUrl + '/' + alertId + '/markAsRead');
                },

                markAsUnread: function(alertId) {
                    return $http.post(baseUrl + '/' + alertId + '/markAsUnread');
                },

                follow: function(alertId) {
                    return $http.post(baseUrl + '/' + alertId + '/follow');
                },

                unfollow: function(alertId) {
                    return $http.post(baseUrl + '/' + alertId + '/unfollow');
                },

                forceRemove: function(alertId) {
                    return $http.delete(baseUrl + '/' + alertId, {
                        params: {
                            force: 1
                        }
                    });
                },

                bulkRemove: function(alertIds) {
                    return $http.post(baseUrl + '/delete/_bulk', {
                        ids: alertIds
                    }, {
                        params: {
                            force: 1
                        }
                    });
                },

                stats: function(scope) {
                    var field = 'status',
                        result = {},
                        statConfig = {
                            query: {},
                            objectType: 'alert',
                            field: field,
                            result: result
                        };

                    StreamSrv.addListener({
                        rootId: 'any',
                        objectType: 'alert',
                        scope: scope,
                        callback: function() {
                            StatSrv.get(statConfig);
                        }
                    });

                    return StatSrv.get(statConfig);
                },

                sources: function(query) {
                    var defer = $q.defer();

                    StatSrv.getPromise({
                        objectType: 'alert',
                        field: 'source',
                        limit: 1000
                    }).then(function(response) {
                        var sources = [];

                        sources = _.map(_.filter(_.keys(response.data), function(source) {
                            var regex = new RegExp(query, 'gi');
                            return regex.test(source);
                        }), function(source) {
                            return {text: source};
                        });

                        defer.resolve(sources);
                    });

                    return defer.promise;
                },

                statuses: function(query) {
                    var defer = $q.defer();

                    $q.resolve(_.map(AlertStatus.values, function(status) {
                        return { text: status};
                    })).then(function(response) {
                        var statuses = [];

                        statuses = _.filter(response, function(status) {
                            var regex = new RegExp(query, 'gi');
                            return regex.test(status.text);
                        });

                        defer.resolve(statuses);
                    });

                    return defer.promise;
                },

                types: function(query) {
                  var defer = $q.defer();

                  StatSrv.getPromise({
                      objectType: 'alert',
                      field: 'type',
                      limit: 1000
                  }).then(function(response) {
                      var alertTypes = [];

                      alertTypes = _.map(_.filter(_.keys(response.data), function(tpe) {
                          var regex = new RegExp(query, 'gi');
                          return regex.test(tpe);
                      }), function(tpe) {
                          return {text: tpe};
                      });

                      defer.resolve(alertTypes);
                  });

                  return defer.promise;
                }
            };

            return factory;
        });

})();
