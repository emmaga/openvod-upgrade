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
            self.projectList;
            self.init = function() {
                
            }
            /**
             *为指定项目添加升级主体
             */
            self.add = function (id) {
                var name = self.getName(id);
                $scope.app.maskParams = {'projectName':name};
                $scope.app.showMask(true,'pages/addEntity.html');
            }

            self.addProject = function () {
                $scope.app.showMask(true,'pages/addProject.html');
            }

            self.addEntity = function () {
                $scope.app.showMask(true,'pages/addAllEntity.html');
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
                        group: "project_id"
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
                                self.setName = function (id) {
                                    var name;
                                    self.projectList.content.forEach(function (val) {
                                        if(val.project_id == id){
                                            name = val.project_name_zh;
                                        };
                                    });
                                    return name;
                                };
                                self.getName = function (id) {
                                    var name;
                                    self.projectList.content.forEach(function (val) {
                                        if(val.project_id == id){
                                            name = val.project_name;
                                        };
                                    });
                                    return name;
                                };
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
                $scope.app.showMaskClass = ifShowMask ? true : false;
                console&&console.log($scope.app.maskUrl);
            }

            self.logout = function(event) {
                util.setParams('token', '');
                $state.go('login');
            }

        }
    ])

    .controller('addEntityController',['$http','$state','$scope','util',function ($http,$state,$scope,util) {
        var self = this;
        self.init = function () {
            self.projectName = $scope.app.maskParams.projectName;
            self.nowEntityList = []; //当前项目已有的升级主体
            self.allEntityList = []; //全部升级主体
            self.loadAllEntityList();
            self.saving = false;
            self.selected = [];
        }

        self.cancel = function () {
            $scope.app.showMask(false);
        }
        self.loadEntityList = function (name) {
            var data = JSON.stringify({
                "token": util.getParams('token')
            });
            $http({
                method: 'POST',
                url: util.getApiUrl('projectlist', '', 'server'),
                data: data
            }).then(function successCallback(response) {
                var data = response.data.content;
                data.forEach(function (val,idx,arr) {
                    if(val.project_name == name){
                        self.nowEntityList.push(val.entity_type_id);
                        self.markEntity(val.entity_type_id);
                    }
                })
            }, function errorCallback(response) {
                alert('连接服务器出错');
            }).finally(function(value) {

            });
        }
        self.loadAllEntityList = function () {
            var data = JSON.stringify({
                "action":"getEntityTypeList",
                "token":util.getParams('token')
            });
            $http({
                method:'POST',
                url: util.getApiUrl('entitytype', '', 'server'),
                data: data
            }).then(function successCallback(response) {
                self.allEntityList = response.data.entity_list;
                self.loadEntityList(self.projectName);
            },function errorCallback(response) {
                alert('连接服务器出错');
            }).finally(function (value) {

            })
        }
        self.markEntity = function (id) {
            self.allEntityList.forEach(function (val,idx,arr) {
                if(val.entity_type_id == id){
                    val.hasAdded = true;
                }
            })
        }
        self.save = function () {
            var data = JSON.stringify({
                "action":"addProjectEntitytype",
                "token":util.getParams('token'),
                "project":self.projectName,
                "entity_type_list":self.selected
            });
            $http({
                method:'POST',
                url: util.getApiUrl('addprojectentitytype', '', 'server'),
                data: data
            }).then(function successCallback(response) {
                if(response.data.rescode == "200"){
                    alert("分配成功");
                    $state.reload();
                }else {
                    alert("分配失败")
                }
            },function errorCallback(response) {
                alert('连接服务器出错');
            }).finally(function (value) {
                self.saving = false;
            })

        }
        var updateSelected = function(action,id){
            if(action == 'add' && self.selected.indexOf(id) == -1){
                self.selected.push(id);
                }
            if(action == 'remove' && self.selected.indexOf(id)!=-1){
                var idx = self.selected.indexOf(id);
                self.selected.splice(idx,1);
                }
            }
        $scope.updateSelection = function($event, id){
            var checkbox = $event.target;
            var action = (checkbox.checked?'add':'remove');
            updateSelected(action,id,checkbox.name);
            }
        $scope.isSelected = function(id){
            return self.selected.indexOf(id)>=0;
            }
    }])

    .controller('addAllEntityController',['$http','$scope','$state','util',function ($http,$scope,$state,util) {
            var self = this;
            self.init = function () {
                self.name = '';
                self.nameZh = '';
            };
            self.cancel = function () {
                $scope.app.showMask(false);
            }
            self.save = function () {
                self.saving = true;
                var data = JSON.stringify({
                    "action":"addEntityType",
                    "token":util.getParams('token'),
                    "entity_type" :{
                        "entity_type_name": self.name,
                        "entity_type_desc": self.nameZh
                    }
                });
                $http({
                    method: 'POST',
                    url: util.getApiUrl('entitytype', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    console.log(response);
                    if(response.data.rescode == '200'){
                        alert('添加成功');
                        $state.reload();
                    }
                },function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function (value) {
                    self.saving = false;
                });
            }
    }])

    .controller('addProjectController',['$http','$scope','$state','util',function ($http,$scope,$state,util) {
        var self = this;
        self.init = function () {
            self.name = '';
            self.nameZh = '';
        };
        self.cancel = function () {
            $scope.app.showMask(false);
        }
        self.save = function () {
            self.saving = true;
            var data = JSON.stringify({
                "action":"addProject",
                "token":util.getParams('token'),
                "project" :{
                    "project_name": self.name,
                    "project_name_zh": self.nameZh
                }
            });
            $http({
                method: 'POST',
                url: util.getApiUrl('addproject', '', 'server'),
                data: data
            }).then(function successCallback(response) {
                console.log(response);
                if(response.data.rescode == '200'){
                    alert('添加成功');
                    $state.reload();
                }else {
                    alert('添加失败');
                }
            },function errorCallback(response) {
                alert('连接服务器出错');
            }).finally(function (value) {
                self.saving = false;
            });
        }
    }])

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
                $scope.app.maskParams.project = self.project;
                $scope.app.maskParams.entitytype = self.entityTypeName;
                $scope.app.maskParams.refreshPage = self.getInfo;
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
            self.versionInfo = {}; // 版本信息
            self.project = $scope.app.maskParams.project;
            self.entityType = $scope.app.maskParams.entitytype;

            self.init = function() {
                self.imgs1 = new Imgs([], true);
            }

            /**
             * 隐藏弹窗
             *
             * @method cancel
             */
            self.cancel = function() {
                $scope.app.showMask(false);
            }

            /**
             * 提交版本
             *
             * @method submit
             */
            self.submit = function() {

                // 文件必填
                if(!self.imgs1.data[0].md5) {
                    alert('请上传文件');
                    return;
                }
                console.log(self.imgs1)

                var data = JSON.stringify({
                    "token": util.getParams('token'),
                    "project": self.project,
                    "entitytype": self.entityType,
                    "version": self.versionInfo.version,
                    "upgradefileurl": self.imgs1.data[0].src,
                    "md5sum": self.imgs1.data[0].md5,
                    "description": self.versionInfo.description,
                    "upgradeACL":0
                });

                self.saving = true;

                return $http({
                    method: 'POST',
                    url: util.getApiUrl('submitversion', '', 'server'),
                    data: data
                }).then(function successCallback(response) {
                    alert('提交成功');
                    $scope.app.showMask(false);
                    $scope.app.maskParams.refreshPage();
                }, function errorCallback(response) {
                    alert('连接服务器出错');
                }).finally(function(value) {
                    self.saving = false;
                });
            }

            // 上传相关
            self.clickUpload = function(e) {
                setTimeout(function() {
                    document.getElementById(e).click();
                }, 0);
            }

            function Imgs(imgList, single) {
                this.initImgList = imgList;
                this.data = [];
                this.maxId = 0;
                this.single = single ? true : false;
            }

            Imgs.prototype = {
                initImgs: function() {
                    var l = this.initImgList;
                    for (var i = 0; i < l.length; i++) {
                        this.data[i] = {
                            "src": l[i].ImageURL,
                            "fileSize": l[i].ImageSize,
                            "id": this.maxId++,
                            "progress": 100
                        };
                    }
                },
                deleteById: function(id) {
                    var l = this.data;
                    for (var i = 0; i < l.length; i++) {
                        if (l[i].id == id) {
                            // 如果正在上传，取消上传
                            if (l[i].progress < 100 && l[i].progress != -1) {
                                l[i].xhr.abort();
                            }
                            l.splice(i, 1);
                            break;
                        }
                    }
                },

                add: function(xhr, fileName, fileSize) {
                    this.data.push({
                        "xhr": xhr,
                        "fileName": fileName,
                        "fileSize": fileSize,
                        "progress": 0,
                        "id": this.maxId
                    });
                    return this.maxId++;
                },

                update: function(id, progress, leftSize, fileSize) {
                    for (var i = 0; i < this.data.length; i++) {
                        var f = this.data[i];
                        if (f.id === id) {
                            f.progress = progress;
                            f.leftSize = leftSize;
                            f.fileSize = fileSize;
                            break;
                        }
                    }
                },

                setSrcSizeByXhr: function(xhr, src, size, md5) {
                    for (var i = 0; i < this.data.length; i++) {
                        if (this.data[i].xhr == xhr) {
                            this.data[i].src = src;
                            this.data[i].fileSize = size;
                            this.data[i].md5 = md5;
                            break;
                        }
                    }
                },

                uploadFile: function(e, o) {

                    // 如果这个对象只允许上传一张图片
                    if (this.single) {
                        // 删除第二张以后的图片
                        for (var i = 1; i < this.data.length; i++) {
                            this.deleteById(this.data[i].id);
                        }
                    }

                    var file = $scope[e];
                    var uploadUrl = CONFIG.uploadImgUrl;
                    var xhr = new XMLHttpRequest();
                    var fileId = this.add(xhr, file.name, file.size, xhr);
                    // self.search();

                    util.uploadFileToUrl(xhr, file, uploadUrl, 'normal',
                        function(evt) {
                            $scope.$apply(function() {
                                if (evt.lengthComputable) {
                                    var percentComplete = Math.round(evt.loaded * 100 / evt.total);
                                    o.update(fileId, percentComplete, evt.total - evt.loaded, evt.total);
                                    console.log(percentComplete);
                                }
                            });
                        },
                        function(xhr) {
                            var ret = JSON.parse(xhr.responseText);
                            console && console.log(ret);
                            $scope.$apply(function() {
                                o.setSrcSizeByXhr(xhr, ret.upload_path, ret.size, ret.md5);
                                // 如果这个对象只允许上传一张图片
                                if (o.single && o.data.length > 1) {
                                    // 删除第一站图片
                                    o.deleteById(o.data[0].id);
                                }
                            });
                        },
                        function(xhr) {
                            $scope.$apply(function() {
                                o.update(fileId, -1, '', '');
                            });
                            console.log('failure');
                            xhr.abort();
                        }
                    );
                }
            }
        }
    ])
    
})();
