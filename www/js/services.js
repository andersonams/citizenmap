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

.service('localizacaoService', [function(){
    return {
        setLocalizacao: function (LocalizacaoFactory, $localStorage) {
            return new Promise(function (resolve, reject) {
                LocalizacaoFactory.obterLocalizacao().then(function (latLng) {
                    $localStorage.latLng = latLng;

                    LocalizacaoFactory.obterRegiaoWikiMapia(latLng).then(function (localizacao) {
                        $localStorage.latLngBairro = localizacao.bairro.latLng;
                        $localStorage.latLngCidade = localizacao.cidade.latLng;
                        $localStorage.bairro = localizacao.bairro.nome;
                        $localStorage.cidade = localizacao.cidade.nome;
                        $localStorage.polygonsBairro = localizacao.bairro.polygons;
                        $localStorage.polygonsCidade = localizacao.cidade.polygons;

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