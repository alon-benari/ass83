cs142App.controller('FavoritesController', ['$scope','$resource','$location',
    function ($scope, $resource,$location) {

      console.log('from with favorties controller ')
      $scope.showFavs = function(){
          var getFavs = $resource('/getFavs/') // make a call to return a list of favorite photos
          getFavs.query(function(favs){
          $scope.main.favs  = favs
          console.log($scope.main.favs)

      })
      }
      $scope.showFavs()

      
      $scope.removeFav = function(){
        // remove from database
        console.log('this:',this.fav.photo_id)
        var img_id = this.fav.photo_id
        // var divToRemove = document.getElementById(this.fav.photo_id)
        // console.log(divToRemove)
        
        var removeFavImage = $resource('/removeFav/:photo_id')
        removeFavImage.save({photo_id:img_id},{},function(b){
          console.log({res:b})
          $scope.showFavs()

        })
      }

      

      // angular bootstrap ui
      $scope.open = function() {
        $scope.showModal = true;
      };
    
      $scope.ok = function() {
        $scope.showModal = false;
      };
    
      $scope.cancel = function() {
        $scope.showModal = false;
      };
    }]);