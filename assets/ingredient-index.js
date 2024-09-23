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

document.addEventListener('DOMContentLoaded', function () {
  // ... existing code ...

  // Setup search filter for ingredients
  const searchInput = document.getElementById('ingredientsSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      const searchText = this.value.toLowerCase();
      const listItems = document.querySelectorAll(
        '.alpha-list-wrapper.active .alpha-list-group li.ingredient__item',
      );

      listItems.forEach(function (item) {
        console.log(item);
        const name = item
          .querySelector('.card-ingredient__name')
          .textContent.toLowerCase();
        if (name.includes(searchText)) {
          item.style.display = '';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }
});
