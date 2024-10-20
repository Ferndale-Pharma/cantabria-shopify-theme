// Copy meny to mobile menu.
document.addEventListener('DOMContentLoaded', function () {
  const preHeaderLinks = document.querySelectorAll('.pre-header__links a'); // Select all <a> elements
  const mobileMenu = document.querySelector('.menu-drawer__utility-links');

  // Insert preHeaderLinks into the mobile menu .menu-drawer__utility-links
  preHeaderLinks.forEach((link) => {
    const clonedLink = link.cloneNode(true); // Clone the link
    clonedLink.className = ''; // Remove all classes from the cloned link
    const linkWrapper = document.createElement('div'); // Create a new div for the link
    linkWrapper.className = 'twcss-py-4'; // Add class to the wrapping div
    linkWrapper.appendChild(clonedLink); // Append the cloned link to the div
    mobileMenu.insertBefore(linkWrapper, mobileMenu.firstChild); // Insert the div at the start of the mobile menu
  });
});
