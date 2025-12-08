export const razorpayService = {
  loadScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Razorpay script'));
      document.body.appendChild(script);
    });
  },

  async openCheckout(options) {
    await this.loadScript();

    return new Promise((resolve, reject) => {
      const razorpay = new window.Razorpay({
        key: options.keyId,
        amount: options.amount,
        currency: options.currency,
        name: options.name || 'AG SaaS',
        description: options.description || 'Subscription Payment',
        order_id: options.razorpayOrderId,
        handler: function (response) {
          resolve(response);
        },
        prefill: {
          name: options.customerName || '',
          email: options.customerEmail || '',
          contact: options.customerContact || '',
        },
        theme: {
          color: '#22c55e',
        },
        modal: {
          ondismiss: function () {
            reject(new Error('Payment cancelled by user'));
          },
        },
      });

      razorpay.on('payment.failed', function (response) {
        reject(new Error(response.error.description || 'Payment failed'));
      });

      razorpay.open();
    });
  },
};

export default razorpayService;

