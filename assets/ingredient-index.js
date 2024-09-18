document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('ingredientIndex')) {
    new AlphaListNav('ingredientIndex', {
      // Additional configuration options here
      filterSelector: '.card-ingredient__name',
      includeNums: false,
      showCounts: false,
      initLetter: '*',
      //   navContainer: 'alphaNavContainer',
    });
  }
});
