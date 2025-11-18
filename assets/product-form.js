if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart =
          document.querySelector('cart-notification') ||
          document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');
        this.submitButtonText = this.submitButton.querySelector('span');

        if (document.querySelector('cart-drawer'))
          this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');
        this.querySelector('.loading__spinner').classList.remove('hidden');

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);
        if (this.cart) {
          formData.append(
            'sections',
            this.cart.getSectionsToRender().map((section) => section.id),
          );
          formData.append('sections_url', window.location.pathname);
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              // Error from cart/add
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);

              const soldOutMessage =
                this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              // No cart drawer/notification – fall back to cart page
              window.location = window.routes.cart_url;
              return;
            }

            if (!this.error)
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });

            this.error = false;
            const quickAddModal = this.closest('quick-add-modal');

            // --- GA4 add_to_cart for quick-add modal only ---
            if (
              quickAddModal &&
              typeof window.pushEcommerceEvent === 'function'
            ) {
              try {
                const variantId = formData.get('id');
                const addedQuantity = parseInt(
                  formData.get('quantity') || '1',
                  10,
                );

                const items = response.items || response.cart?.items || [];
                const lineItem = items.find(
                  (item) => String(item.id) === String(variantId),
                );

                if (lineItem) {
                  // Try to derive a unit price in shop currency
                  let unitPrice;
                  if (lineItem.final_line_price && lineItem.quantity) {
                    unitPrice =
                      lineItem.final_line_price / lineItem.quantity / 100;
                  } else if (lineItem.final_price) {
                    unitPrice = lineItem.final_price / 100;
                  } else {
                    unitPrice = lineItem.price / 100;
                  }

                  const currency =
                    (response.currency &&
                      String(response.currency).toUpperCase()) ||
                    (window.Shopify &&
                      Shopify.currency &&
                      Shopify.currency.active) ||
                    'GBP'; // fallback; adjust if needed

                  window.pushEcommerceEvent('add_to_cart', {
                    currency: currency,
                    value: unitPrice * addedQuantity,
                    items: [
                      {
                        id: lineItem.product_id,
                        name: lineItem.product_title,
                        brand: lineItem.vendor,
                        category: lineItem.product_type,
                        variant_name: lineItem.variant_title || lineItem.title,
                        price: unitPrice,
                        quantity: addedQuantity,
                      },
                    ],
                  });
                }
              } catch (e) {
                console.error('GA4 add_to_cart quick-add modal error', e);
              }
            }
            // --- end GA4 block ---

            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true },
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
          })
          .finally(() => {
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty'))
              this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner').classList.add('hidden');
          });
      }

      handleErrorMessage(errorMessage = false) {
        this.errorMessageWrapper =
          this.errorMessageWrapper ||
          this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage =
          this.errorMessage ||
          this.errorMessageWrapper.querySelector(
            '.product-form__error-message',
          );

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    },
  );
}
