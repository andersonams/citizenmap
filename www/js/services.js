angular.module('citizenmap.services', [])

.service('AvaliacaoService', [function(){
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

.service('MapaService', [function () {
    var servico;
    var tipoLocal;
    var tipoMapa;
    
    return {
        getServico: function () {
            return servico;
        },
        setServico: function (value) {
            servico = value;
        },
        getTipoLocal: function () {
            return tipoLocal;
        },
        setTipoLocal: function (value) {
            tipoLocal = value;
        },
        getTipoMapa: function () {
            return tipoMapa;
        },
        setTipoMapa: function (value) {
            tipoMapa = value;
        }
    };
}])

.service('ServicoService', [function () {
    var servico;

    return {
        getServico: function () {
            return servico;
        },
        setServico: function (value) {
            servico = value;
        }
    };
}]);