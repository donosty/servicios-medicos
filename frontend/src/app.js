angular.module('serviciosMedicosApp', [])
  .controller('AppController', function AppController($http) {
    const vm = this;
    vm.apiMessage = 'Conectando con la API...';

    $http.get('/api')
      .then((response) => {
        vm.apiMessage = response.data.message;
      })
      .catch(() => {
        vm.apiMessage = 'La API no está disponible.';
      });
  });
