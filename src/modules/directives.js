'use strict';

(function() {
  var app = angular.module('app.directives', [])

  .directive('fileModel', ['$parse','CONFIG', function ($parse, CONFIG) {
      return {
          restrict: 'A',
          link: function(scope, element, attrs) {
              // debugger;
              var model = $parse(attrs.fileModel);
              var modelSetter = model.assign;
              
              element.bind('change', function(){
                  scope.$apply(function(){
                      // console.log(scope)
                      // console.log(element[0].files[0])
                      modelSetter(scope, element[0].files[0]);
                  });
                  if(attrs.e != 'none') {
                    // 自动点击id为该名称的按钮
                    document.getElementById(attrs.e).click();
                  }
              });
          }
      };
  }])

})();