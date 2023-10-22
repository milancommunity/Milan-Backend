const express = require("express");
const router = express.Router();

const shortid = require("shortid");
const Razorpay = require("razorpay");
const { STATUSCODE, STATUSMESSAGE } = require("../../utils/Status");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/razorpay", async (req, res) => {
  const payment_capture = 1;
  const amount = req.body.amount * 100;

  const currency = "INR";

  const options = {
    amount: amount,
    currency,
    receipt: shortid.generate(),
    payment_capture,
  };

  try {
    const response = await razorpay.orders.create(options);
    return res.status(STATUSCODE.OK).json({
      id: response.id,
      currency: response.currency,
      amount: response.amount,
    });
  } catch (error) {
    res
      .status(STATUSCODE.INTERNAL_SERVER_ERROR)
      .json({ message: STATUSMESSAGE.INTERNAL_SERVER_ERROR });
  }
});

module.exports = router;
