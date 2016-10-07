angular.module('citizenmap.services', [])

.factory('BlankFactory', [function(){

}])

.service('BlankService', [function(){

}])

.service('avaliacaoService', [function(){
    this.servicoSelecionado;
}])

.service('mapaService', [function(){
    this.tipoSelecionado;
}])

.service('obterLocalizacaoService', [function($cordovaGeolocation){
    this.myFunc = function () {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                console.log("SERVICE Geolocalização por HTML5: " + latLng.toString());
                //return latLng;
            }, function () {
                //handleLocationError(true, $scope.infoWindow, $scope.map.getCenter());
            });
        } else {
            $cordovaGeolocation.getCurrentPosition(options).then(function (position) {
                var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                console.log("SERVICE Geolocalização por Cordova Geolocation: " + latLng.toString());
                //return latLng;
            }, function (error) {
                console.log("Não foi possível obter a localização: " + error.message);
            });
        }
    }
}]);