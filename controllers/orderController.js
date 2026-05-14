const { StatusCodes } = require('http-status-codes');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { checkPermissions } = require('../utils');

const fakeStripeAPI = async ({ amount, currency, payment_method_types }) => {
  const clientSecret = 'some_random_client_secret';
  return { clientSecret, amount };
};

const createOrder = async (req, res) => {
  const { items: cartItems, tax, shippingFee } = req.body;

  // validate cart items
  if (!cartItems || cartItems.length < 1) {
    throw new Error('No cart items provided');
  }
  if (!tax || !shippingFee) {
    throw new Error('Please provide tax and shipping fee');
  }

  let orderItems = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const dbProduct = await Product.findOne({ _id: item.product });
    if (!dbProduct) {
      throw new Error(`No product with id: ${item.product}`);
    } else {
      const { name, price, image, _id } = dbProduct;
      const singleOrderItem = {
        amount: item.amount,
        name,
        price,
        image,
        product: _id,
      };
      orderItems = [...orderItems, singleOrderItem];
      subtotal += item.amount * price;
    }
  }
  // calculate total
  const total = Number(tax) + Number(shippingFee) + subtotal;

  // get client secret from stripe
  const paymentIntent = await fakeStripeAPI({
    amount: total,
    currency: 'usd',
    payment_method_types: ['card'],
  });

  const order = await Order.create({
    orderItems,
    total,
    subtotal,
    tax,
    shippingFee,
    clientSecret: paymentIntent.clientSecret,
    user: req.user.userId,
  });

  res
    .status(StatusCodes.CREATED)
    .json({ order, clientSecret: order.clientSecret });
};

const getAllOrders = async (req, res) => {
  const orders = await Order.find({});
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new Error(`No order with id: ${orderId}`);
  }

  // check permissions to view the order
  checkPermissions(req.user, order.user);

  res.status(StatusCodes.OK).json({ order });
};

const updateOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const { paymentIntentId } = req.body;
  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new Error(`No order with id: ${orderId}`);
  }
  // check permissions to update the order
  checkPermissions(req.user, order.user);
  order.paymentIntentId = paymentIntentId;
  order.status = 'paid';
  await order.save();
  res.status(StatusCodes.OK).json({ order });
};

const deleteOrder = async (req, res) => {
  const { id: orderId } = req.params;
  const order = await Order.findOne({ _id: orderId });
  if (!order) {
    throw new Error(`No order with id: ${orderId}`);
  }
  await order.remove();
  res.status(StatusCodes.OK).json({ msg: 'Order deleted successfully' });
};

const getCurrentUserOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.userId });
  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

module.exports = {
  createOrder,
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  updateOrder,
  deleteOrder,
};
