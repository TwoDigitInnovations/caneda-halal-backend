const { default: Stripe } = require("stripe");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = {
  createCheckout: async (req, res) => {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Sample Product",
              },
              unit_amount: 5000, // $50.00 in cents
            },
            quantity: 1,
          },
        ],
        success_url: "http://localhost:3000/success",
        cancel_url: "http://localhost:3000/cancel",
      });

      res.json({ id: session.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Something went wrong." });
    }
  },
};
