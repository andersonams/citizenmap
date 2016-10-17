angular.module('citizenmap.services', [])

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

.service('mapaService', [function () {
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
}])

.service('LocalizacaoService', [function(){
    return {
        setLocalizacao: function (Localizacao, $localStorage) {
            return new Promise(function (resolve, reject) {
                Localizacao.obterLocalizacao().then(function (promise) {
                    $localStorage.latLng = promise;

                    Localizacao.obterRegiaoWikiMapia(promise).then(function (promise) {
                        $localStorage.latLngBairro = promise.bairro.latLng;
                        $localStorage.latLngCidade = promise.cidade.latLng;
                        $localStorage.bairro = promise.bairro.nome;
                        $localStorage.cidade = promise.cidade.nome;
                        $localStorage.polygonsBairro = promise.bairro.polygons;
                        $localStorage.polygonsCidade = promise.cidade.polygons;

                        resolve();
                    }, function (error) {
                        reject(error);
                    });
                }, function (error) {
                    reject(error);
                });
            });
        },
    };
}]);