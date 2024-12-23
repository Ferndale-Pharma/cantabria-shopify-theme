// Ensure the script only runs once
if (!window.pointsCalculatorInitialized) {
  window.pointsCalculatorInitialized = true;

  document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded');

    // Track processed forms to prevent duplicates
    const processedForms = new WeakSet();

    // Function to setup variant change observer
    function setupVariantObserver(form, pointsElement, productJsonId) {
      // Skip if we've already processed this form
      if (processedForms.has(form)) {
        return;
      }

      const variantInput = form.querySelector('input[name="id"]');

      if (variantInput) {
        // Initial points calculation
        updatePoints(variantInput.value, productJsonId, pointsElement);

        // Single mutation observer for both attribute changes and radio buttons
        const observer = new MutationObserver(() => {
          updatePoints(variantInput.value, productJsonId, pointsElement);
        });

        observer.observe(variantInput, {
          attributes: true,
          attributeFilter: ['value'],
        });

        // Mark this form as processed
        processedForms.add(form);
      }
    }

    // Function to update points
    function updatePoints(variantId, productJsonId, pointsElement) {
      const productJson = document.getElementById(
        `ProductJSON-${productJsonId}`,
      );

      if (productJson) {
        const productData = JSON.parse(productJson.textContent);
        const variant = productData.variants.find((v) => v.id == variantId);

        if (variant && pointsElement) {
          const points = Math.floor(variant.price / 10);
          pointsElement.textContent = `Earn ${points} points`;
        }
      }
    }

    // Handle main product form
    const mainForm = document.querySelector('form[action*="/cart/add"]');
    const mainPointsElement = document.getElementById('my-points-value');
    if (mainForm) {
      const productJsonId = mainForm.closest('[data-section]')?.dataset.section;
      setupVariantObserver(mainForm, mainPointsElement, productJsonId);
    }

    // Track if we've already set up the observer for a modal
    const processedModals = new WeakSet();

    // Handle quick-add modals
    document.addEventListener('click', function (event) {
      const modalOpener = event.target.closest(
        'modal-opener[data-modal^="#QuickAdd-"]',
      );
      if (!modalOpener) return;

      const modalId = modalOpener.getAttribute('data-modal');
      const modal = document.querySelector(modalId);

      if (!modal || processedModals.has(modal)) return;

      // Single observer for the modal
      const observer = new MutationObserver((mutations, obs) => {
        const quickAddForm = modal.querySelector('form[action*="/cart/add"]');
        if (quickAddForm) {
          const pointsElement = document.getElementById('my-points-value');
          const productJsonId =
            quickAddForm.closest('[data-section]')?.dataset.section;

          if (pointsElement) {
            setupVariantObserver(quickAddForm, pointsElement, productJsonId);
            processedModals.add(modal);
            obs.disconnect();
          }
        }
      });

      observer.observe(modal, {
        childList: true,
        subtree: true,
      });
    });
  });
}
