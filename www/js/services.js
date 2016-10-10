angular.module('citizenmap.services', [])

.factory('BlankFactory', [function(){

}])

.service('BlankService', [function(){

}])

.service('avaliacaoService', [function(){
    var servico;
        
    return {
        getServico: function () {
            return servico;
        },
        setServico: function (value) {
            servico = value;
        } 
    };
}])

.service('mapaService', function () {
    var servico;
    var tipo;
    
    return {
        getServico: function () {
            return servico;
        },
        setServico: function (value) {
            servico = value;
        },
        getTipo: function () {
            return tipo;
        },
        setTipo: function (value) {
            tipo = value;
        }   
    };
});