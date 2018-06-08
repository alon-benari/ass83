'use strict';

cs142App.controller('SinglePhotoController', ['$scope', '$routeParams','$resource','$location',
  function ($scope, $routeParams,$resource,$location) {
    console.log('routeParams:',$routeParams)
    var sphoto_id = $routeParams.photo_id;
    console.log('photo_id is ', sphoto_id);
    //
    $scope.showSinglePhoto = function(){
      var singlePhoto = $resource('/singlephoto/:photo_id')
      singlePhoto.get({photo_id:sphoto_id},function(singlePhotoInstance){
        console.log('singlePhoto:',singlePhotoInstance.photoInfo)
        var oneImage = singlePhotoInstance
        $scope.main.singlePhotoInstance = oneImage//singlePhotoInstance
        console.log($scope.main.singlePhotoInstance)
        $scope.main.addToFavState = singlePhotoInstance.disable
        })
  
    }
    $scope.showSinglePhoto()
    // var singlePhoto = $resource('/singlephoto/:photo_id')
    // singlePhoto.get({photo_id:sphoto_id},function(singlePhotoInstance){
    //   $scope.main.singlePhotoInstance = singlePhotoInstance
    //   console.log($scope.main.singlePhotoInstance)
    //   })

    // $scope.getRecentCommentDateTime = function(){
    //   var commentDateTime = $resource('/getCommentDateTime')
    //   commentDateTime.save({},function(addDateTime){
    //     console.log('addDateTime',addDateTime)
    //   })
    // }
    $scope.showUserList = function(){
      var users = $resource('/user/list',{},{'method':'get', isArray:true});
  
     var data = users.query(function(d){
      $scope.main.userListModel = d;
      console.log('userList:',$scope.main.userListModel)
      
  });
}


      
      $scope.addComment = function(){
        var img_id = this.x._id;
        console.log($scope.addComment.img_id);
        console.log('loggedUser:',$scope.main.loggedUser);
        $scope.addComment.photoResource=this.x;
        //
        $scope.addComment.newLine = {
          date_time:Date(),
          comment:$scope.addComment.newComment
        };
        $scope.addComment.existingComment = this.x.comments;
        // figure out last name of logged in user
        var loggedInDetails = $resource('/user/list');
       
         loggedInDetails.query(function(result){
           result.forEach(function(el){
             if (el.first_name.toLowerCase() === $scope.main.loggedUser.toLowerCase()){
               console.log('we have a match');
               var user = {
                  user_id:el._id,
                  first_name:el.first_name,
                  last_name:el.last_name
               };
               console.log('user: ',user);
               console.log('exisitngComments before: ',$scope.addComment.existingComment);
               $scope.addComment.newLine.user = user;
               
               console.log('newComment: ',$scope.addComment.newLine);
               $scope.addComment.existingComment.push($scope.addComment.newLine);
               
               console.log('exisitngComments after: ',$scope.addComment.existingComment);
               //pack it in.
               console.log("photo_id: ",img_id);
               console.log('updated comment array: ',$scope.addComment.existingComment);
              // make the update
               var photoToCommentOn = $resource('/commentsOfPhoto/:photo_id');
               photoToCommentOn.save({photo_id:img_id},{comments:$scope.addComment.existingComment}, function (comment){
                //  console.log(comment);
                 $location.path($location.path());
                 $scope.addComment.newComment = '';
                 $scope.showSinglePhoto()
                 $location.path()
                 $scope.showUserList() 
               });
  
               return;
             } else {
               console.log('we have an error');
               $location.path($location.path());
               $scope.addComment.newComment = '';
               return;
             }
           });
         });
      
      };
      // determine state of add to favs
      // $scope.disable($routeParams.photo_id)
      // $scope.disable = function(photo_id){
      //   console.log('hello')
      //   var checkDisable = $resource('/alreadyFav')
      //   checkDisable.get(function(favlist){
      //     console.log('favList',favList)
      //   })
      // }
      
      $scope.buttonState = function(){
        console.log('inside buttonstate')
          var checkDisable = $resource('/alreadyFav')
          checkDisable.get({},{},function(favlist){
          console.log('favList',favList)
        })
      }

      $scope.buttonState()

      $scope.addToFavorties = function(){
     
        var img_id = this.x._id;
        console.log('img_id: ',img_id)
         // check fav list status
        // add looged user to fav list
        var addFavToPhoto = $resource('/addtofavs/:photo_id');
        addFavToPhoto.save({photo_id:img_id},{}, function (add2Fav){
        console.log('added3Favs:',add2Fav); 
        console.log('loggedInUser:',$scope.main.loggedInId)
        console.log('add2FAV.favrd_by:',add2Fav.favrd_by)
        $scope.main.favrdThisPhoto = []
        add2Fav.favrd_by.forEach(function(el){
          console.log(el.user)
          $scope.showSinglePhoto()
  
        })
        
        
          
        });
      } 
     

     
  }])