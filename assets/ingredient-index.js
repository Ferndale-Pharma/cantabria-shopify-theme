document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('ingredientIndex')) {
    new AlphaListNav('ingredientIndex', {
      // Additional configuration options here
      filterSelector: '.card-ingredient__name',
      includeNums: false,
      showCounts: false,
      initLetter: '*',
    });
  }
});

document.addEventListener('DOMContentLoaded', function () {
  // Select all elements with the class 'toggleLink' and set up click listeners
  document.querySelectorAll('.toggleLink').forEach(function (toggle) {
    toggle.addEventListener('click', function (event) {
      event.preventDefault();
      // Find the closest parent with class 'ingredient-card' and then find the '.content' within it
      const card = this.closest('.ingredient-card');
      const content = card.querySelector(
        '.ingredients-card__used-in--products',
      );
      if (content) {
        content.classList.toggle('twcss-hidden');
      } else {
        console.log('No content element found within card:', card);
      }
    });
  });
});
