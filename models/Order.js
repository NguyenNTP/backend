const moongoose = require('mongoose');

const SingleCartItemSchema = new moongoose.Schema({
  name: {
    type: String,
    required: true,
  }, // name of the product
  price: {
    type: Number,
    required: true,
  }, // price of the product
  image: {
    type: String,
    required: true,
  }, // image URL of the product
  product: {
    type: moongoose.Types.ObjectId,
    ref: 'Product',
    required: true,
  }, // reference to the product
  amount: {
    type: Number,
    required: true,
  }, // quantity ordered
});

const OrderSchema = new moongoose.Schema(
  {
    tax: {
      type: Number,
      required: true,
    }, // tax amount for the order
    shippingFee: {
      type: Number,
      required: true,
    }, // shipping fee for the order
    subtotal: {
      type: Number,
      required: true,
    }, // subtotal before tax and shipping
    total: {
      type: Number,
      required: true,
    }, // total after tax and shipping
    orderItems: [SingleCartItemSchema], // array of cart items
    status: {
      type: String,
      enum: ['pending', 'failed', 'paid', 'delivered', 'canceled'],
      default: 'pending',
      required: true,
    }, // status of the order
    user: {
      type: moongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    }, // reference to the user who placed the order
    clientSecret: {
      type: String,
      required: true,
    }, // secret for payment processing
    paymentIntentId: {
      type: String,
      // required: true,
    }, // payment intent identifier
  },
  { timestamps: true }
);

module.exports = moongoose.model('Order', OrderSchema);
