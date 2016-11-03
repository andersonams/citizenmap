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
}])

.service('LocalizacaoService', [function () {
    return {
        setLocalizacao: function (LocalizacaoFactory, $localStorage) {
            return new Promise(function (resolve, reject) {
                LocalizacaoFactory.obterCoordenadas().then(function (latLng) {
                    $localStorage.latLng = latLng;

                    LocalizacaoFactory.obterLocalizacaoWikiMapia(latLng).then(function (localizacao) {
                        $localStorage.bairro = localizacao.bairro;
                        $localStorage.cidade = localizacao.cidade;

                        LocalizacaoFactory.salvarCidade(localizacao.cidade).then(function (cidade) {
                            $localStorage.cidade.id = cidade.key();

                            LocalizacaoFactory.salvarBairro(localizacao.bairro).then(function (bairro) {
                                $localStorage.bairro.id = bairro.key();

                                resolve();
                            }, function (error) {
                                reject(error);
                            });
                        }, function (error) {
                            reject(error);
                        });
                    }, function (error) {
                        reject(error);
                    });
                }, function (error) {
                    reject(error);
                });
            });
        }
    };
}]);