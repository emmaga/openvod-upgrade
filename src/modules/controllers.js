'use strict';

(function() {
    var app = angular.module('app.controllers', [])

    .controller('loginController', ['$scope', '$http', '$state', '$filter', 'md5', 'util',
        function($scope, $http, $state, $filter, md5, util) {
            console.log('loginController')
            var self = this;
            self.init = function() {

            }
            
            self.login = function () {
                self.loading = true;
                
                var data = JSON.stringify({
                    username: self.userName,
                    password: md5.createHash(self.password)
                })
                $http({
                    method: 'POST',
                    url: util.getApiUrl('logon', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var msg = response.data;
                    if (msg.rescode == '200') {
                        util.setParams('token', msg.token);
                        self.getEditLangs();
                    } 
                    else {
                        alert(msg.rescode + ' ' + msg.errInfo);
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.loading = false;
                });
            }
            // 
            self.getEditLangs = function() {
                $http({
                    method: 'GET',
                    url: util.getApiUrl('', 'editLangs.json', 'local')
                }).then(function successCallback(response) {
                    util.setParams('editLangs', response.data.editLangs);
                    $state.go('app');
                }, function errorCallback(response) {

                });
            }

        }
    ])


    .controller('appController', ['$http', '$scope', '$state', '$stateParams', 'NgTableParams', 'util', 'CONFIG',
        function($http, $scope, $state, $stateParams, NgTableParams, util, CONFIG) {
            var self = this;

            self.maskUrl = ''; // 弹窗层加载页面url
            self.maskParams = {}; // 弹窗层参数

            self.init = function() {
                
            }

            /**
             * 获取项目列表及项目主体列表
             *
             * @method getProjectList
             */
            self.getProjectList = function() {
                self.tableParams = new NgTableParams(
                    {
                        page: 1, 
                        count: 100000000,
                        url: '',
                        group: "project_name"
                    }, 
                    {
                        counts: [],
                        getData: function(params) {
                            var paramsUrl = params.url();

                            var data = JSON.stringify({
                            "token": util.getParams('token')
                            });

                            self.loadingProject = true;

                            return $http({
                                method: 'POST',
                                url: util.getApiUrl('projectlist', '', 'server'),
                                data: data
                            }).then(function successCallback(response) {
                                var data = response.data;
                                    self.projectList = data;
                                    params.total(self.projectList.count);
                                    return data.content;
                            }, function errorCallback(response) {
                                alert('连接服务器出错');
                            }).finally(function(value) {
                                self.loadingProject = false;
                            });
                        }
                    }
                );




                
                






            }

            /**
             * 显示／隐藏 弹窗
             *
             * @method showMask
             * @param ifShowMask {Boolean} 是否显示弹窗
             * @param maskUrl {String} 弹窗url地址
             */
            self.showMask = function(ifShowMask, maskUrl){
                $scope.app.maskUrl = ifShowMask ? maskUrl : '';  
                console&&console.log($scope.app.maskUrl);
            }

            self.logout = function(event) {
                util.setParams('token', '');
                $state.go('login');
            }

        }
    ])

    .controller('entityDetailController', ['$http', '$scope', '$state', '$q', '$stateParams', 'util', 'CONFIG',
        function($http, $scope, $state, $q, $stateParams, util, CONFIG) {
            console.log('entityDetailController')
            
            var self = this;
            self.entityTypeName = $stateParams.entityTypeName;
            self.project = $stateParams.project;
            self.version = {};
            self.loadingVersion = false;
            self.loadingVersionPercent = false;
            self.loadingVersionHistory = false;

            self.init = function() {
                // self.editLangs = util.getParams('editLangs')
                // self.defaultLang = util.getDefaultLangCode();

                self.getInfo();
            }

            /**
             * 打开提交版本弹窗
             *
             * @method addNewVersion
             */
            self.addNewVersion = function() {
                $scope.app.showMask(true, 'pages/submitVersion.html');
            }

            /**
             * 获取升级主体当前版本信息、获取升级主体的版本分布情况、获取升级主体的版本升级历史
             *
             * @method getInfo
             */
            self.getInfo = function() {
                self.getVersion().then(function(){
                    return self.getVersionPercent();
                }).then(function(){
                    return self.getVersionHistory();
                });
            }

            /**
             * 获取升级主体当前版本信息
             *
             * @method getVersion
             * @return {$q.defer()} 获取信息成功/失败
             */
            self.getVersion = function() {
                var deferred = $q.defer();
                var data = JSON.stringify({
                    "token": util.getParams('token'),
                    "project": self.project,
                    "entitytype": self.entityTypeName
                });
                self.loadingVersion = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('versiondetail', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    if (data.rescode == '200') {
                        self.version = data;
                         deferred.resolve();
                    } 
                    else {
                        alert('连接服务器出错' + data.errInfo);
                        deferred.reject();
                    }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingVersion = false;
                });
                return deferred.promise;
            }

            /**
             * 获取升级主体的版本分布情况
             *
             * @method getVersionPercent
             * @return {$q.defer()} 获取信息成功/失败
             */
            self.getVersionPercent = function() {
                var deferred = $q.defer();
                var data = JSON.stringify({
                    "token": util.getParams('token'),
                    "project": self.project,
                    "entitytype": self.entityTypeName
                });
                self.loadingVersionPercent = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('versionpercent', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    // if (data.rescode == '200') {
                        self.versionPercent = data;
                         deferred.resolve();
                    // } 
                    // else {
                    //     alert('连接服务器出错' + data.errInfo);
                    //     deferred.reject();
                    // }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingVersionPercent = false;
                });
                return deferred.promise;
            }

            /**
             * 获取升级主体的版本升级历史
             *
             * @method getVersionHistory
             * @return {$q.defer()} 获取信息成功/失败
             */
            self.getVersionHistory = function() {
                var deferred = $q.defer();
                var data = JSON.stringify({
                    "token": util.getParams('token'),
                    "project": self.project,
                    "entitytype": self.entityTypeName
                });
                self.loadingVersionHistory = true;
                $http({
                    method: 'POST',
                    url: util.getApiUrl('versionshistory', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    var data = response.data;
                    // if (data.rescode == '200') {
                        self.versionHistory = data;
                         deferred.resolve();
                    // } 
                    // else {
                    //     alert('连接服务器出错' + data.errInfo);
                    //     deferred.reject();
                    // }
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                    deferred.reject();
                }).finally(function(value) {
                    self.loadingVersionHistory = false;
                });
                return deferred.promise;
            }
        }
    ])
    
    .controller('submitVersionController', ['$http', '$scope', '$state', '$stateParams', 'util', 'CONFIG',
        function($http, $scope, $state, $stateParams, util, CONFIG) {
            console.log('submitVersionController');
            var self = this;
            self.init = function() {

            }

            /**
             * 隐藏弹窗
             *
             * @method cancel
             */
            self.cancel = function() {
                $scope.app.showMask(false);
            }
        }
    ])
    
})();
