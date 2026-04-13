const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/** Load Razorpay checkout only when needed (avoids hundreds of preload warnings on other pages). */
export function loadRazorpayScript() {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('No window'));
    }
    if (window.Razorpay) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        const existing = document.querySelector(
            `script[src="${RAZORPAY_SCRIPT}"]`
        );
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', () =>
                reject(new Error('Razorpay script failed to load'))
            );
            return;
        }
        const script = document.createElement('script');
        script.src = RAZORPAY_SCRIPT;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () =>
            reject(new Error('Razorpay script failed to load'));
        document.body.appendChild(script);
    });
}
