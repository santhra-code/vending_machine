const razorpay = require("../config/razorpay");

// Generate a new payment order
async function createPaymentOrder(amount, currency = "INR", receipt = "receipt#1") {
  const options = {
    amount: amount * 100, // amount in the smallest currency unit
    currency,
    receipt,
    payment_capture: 1
  };

  try {
    const response = await razorpay.orders.create(options);
    return response;
  } catch (error) {
    throw new Error("Failed to create payment order: " + error.message);
  }
}

module.exports = { createPaymentOrder };