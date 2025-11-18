if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        if (!this.form) return;

        if (this.variantIdInput) {
          this.variantIdInput.disabled = false;
        }

        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));

        this.cart =
          document.querySelector('cart-notification') ||
          document.querySelector('cart-drawer');

        this.submitButton = this.querySelector('[type="submit"]');
        if (this.submitButton) {
          this.submitButtonText = this.submitButton.querySelector('span');
        }

        if (document.querySelector('cart-drawer') && this.submitButton) {
          this.submitButton.setAttribute('aria-haspopup', 'dialog');
        }

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      onSubmitHandler(evt) {
        evt.preventDefault();

        if (!this.submitButton || !this.form) return;
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();

        this.submitButton.setAttribute('aria-disabled', true);
        this.submitButton.classList.add('loading');

        const spinner = this.querySelector('.loading__spinner');
        if (spinner) spinner.classList.remove('hidden');

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
            // --- Error from cart/add ---
            if (response.status) {
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
              if (this.submitButtonText)
                this.submitButtonText.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            } else if (!this.cart) {
              // No cart drawer/notification – fallback to full cart page
              window.location = window.routes.cart_url;
              return;
            }

            // Normal Dawn cart update pub/sub
            if (!this.error) {
              publish(PUB_SUB_EVENTS.cartUpdate, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                cartData: response,
              });
            }

            this.error = false;

            // === GA4 add_to_cart for ALL product-form submissions (PDP, quick-add, modal) ===
            if (typeof window.pushEcommerceEvent === 'function') {
              try {
                const variantId = formData.get('id');
                const qty = parseInt(formData.get('quantity') || '1', 10);

                // 1) Try array shapes (cart drawer / sections responses)
                let items =
                  (Array.isArray(response.items) && response.items) ||
                  (response.cart &&
                    Array.isArray(response.cart.items) &&
                    response.cart.items) ||
                  [];

                let lineItem = null;

                if (items.length) {
                  lineItem =
                    items.find(
                      (item) => String(item.id) === String(variantId),
                    ) || items[0];
                } else if (
                  response &&
                  // PDP / quick-add sometimes returns a single line-item object
                  typeof response === 'object' &&
                  response.id &&
                  (response.product_id || response.product_title)
                ) {
                  lineItem = response;
                }

                if (lineItem) {
                  let unitPrice = 0;
                  if (lineItem.final_line_price && lineItem.quantity) {
                    unitPrice =
                      lineItem.final_line_price / lineItem.quantity / 100;
                  } else if (lineItem.final_price) {
                    unitPrice = lineItem.final_price / 100;
                  } else if (lineItem.price) {
                    unitPrice = lineItem.price / 100;
                  }

                  const currency =
                    (response.currency &&
                      String(response.currency).toUpperCase()) ||
                    (window.Shopify &&
                      Shopify.currency &&
                      Shopify.currency.active) ||
                    'GBP';

                  console.log('GA4 add_to_cart firing from product-form.js', {
                    lineItem,
                    qty,
                    unitPrice,
                    currency,
                  });

                  window.pushEcommerceEvent('add_to_cart', {
                    currency: currency,
                    value: unitPrice * qty,
                    items: [
                      {
                        id: lineItem.product_id,
                        name: lineItem.product_title,
                        brand: lineItem.vendor,
                        category: lineItem.product_type,
                        variant_name:
                          lineItem.variant_title || lineItem.title,
                        price: unitPrice,
                        quantity: qty,
                      },
                    ],
                  });
                } else {
                  console.warn(
                    'GA4 add_to_cart: still no lineItem after fallback',
                    response,
                  );
                }
              } catch (e) {
                console.error('GA4 add_to_cart product-form error', e);
              }
            } else {
              console.warn(
                'GA4 add_to_cart: window.pushEcommerceEvent is not defined',
              );
            }
            // === END GA4 block ===

            const quickAddModal = this.closest('quick-add-modal');

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

            if (this.cart && this.cart.classList.contains('is-empty')) {
              this.cart.classList.remove('is-empty');
            }

            if (!this.error) {
              this.submitButton.removeAttribute('aria-disabled');
            }

            const spinner = this.querySelector('.loading__spinner');
            if (spinner) spinner.classList.add('hidden');
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

        if (errorMessage && this.errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        if (!this.submitButton || !this.submitButtonText) return;

        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text) this.submitButtonText.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          this.submitButtonText.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form ? this.form.querySelector('[name=id]') : null;
      }
    },
  );
}
