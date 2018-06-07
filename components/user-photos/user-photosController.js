'use strict';

cs142App.controller('UserPhotosController', ['$scope', '$routeParams','$resource','$location',
  function($scope, $routeParams, $resource,$location) {
    /*
     * Since the route is specified as '/photos/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
    var userId = $routeParams.userId;
    //
    // var number = $routeParams.photoId
    //
    console.log('UserPhoto of ', $routeParams.userId);
    
    $scope.main.context = 'Photos of: ';
    var userPhotos = $resource('/photosOfUser/:_id',{_id:'@id'},{method:'get'});
    userPhotos.get({_id:userId},function(userPhotoList){
        $scope.main.photoData = userPhotoList.photoData;
        $scope.main.loggedInId = userPhotoList.logged_id // store the _id of the logged in user
        $scope.main.disableIt = false;
        
        
        
        
         
   
    });
    $scope.updateButtonState = function(){

      var checkExist = $resource('/alreadyFav/:photo_id')
      checkExist.get({photo_id:img_id},function(check){
        console.log(check)
      })




        
        $scope.main.photoData.forEach(function(el){

        var inspectedPhotoId = el._id
        if (el.favrd_by.length != 0){
            el.favrd_by.forEach(function(f){
              console.log('from db %s from session %s',(f.user_id,$scope.main.loggedInId))
            if (f.user_id === $scope.main.loggedInId) {
            console.log('disbale button now!')
            // $scope.main.disableIt = true
            $scope.main.disableIt = true
            
          } else{
           return false
          }
         
        })
        }
      
    })
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
               console.log('comment',comment);
               $location.path($location.path());
               $scope.addComment.newComment = '';
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

      })
      
      
        
      });
    } 

    $scope.updateButtons = function(){
      
      return true
    }

 



  }]);
