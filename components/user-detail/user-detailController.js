'use strict';

cs142App.controller('UserDetailController', ['$scope', '$routeParams','$resource',
  function ($scope, $routeParams,$resource) {
    /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    $scope.main.show = false;
    var userId = $routeParams.userId;
    console.log('UserDetail of ', userId);
    
    

    $scope.main.uId = userId;
    
    $scope.main.context = 'now scoping: ';
    //
    var userById = $resource('/user/:_id',{_id:'@id'},{action:{method:'get'}});
    userById.get({_id:userId},function(usersDetails){
      console.log(usersDetails)
      
        $scope.main.usersModel = usersDetails;

        $scope.showUserList()   
    });

    $scope.showUserList = function(){
      var users = $resource('/user/list',{},{'method':'get', isArray:true});
  
  var data = users.query(function(d){
      $scope.main.userListModel = d;
      console.log('userList:',$scope.main.userListModel)
      
  });
}

    
  }]);
