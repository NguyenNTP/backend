const express = require('express');
const router = express.Router();

const {
  getAllProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} = require('../controllers/productController');
const {
  authenticateUser,
  authorizePermissions,
  optionalAuthenticateUser,
} = require('../middleware/authentication');

const getSingleProductReviews =
  require('../controllers/reviewController').getSingleProductReviews;

router
  .route('/')
  .get(getAllProducts)
  .post(authenticateUser, authorizePermissions('admin'), createProduct);

router
  .route('/:id')
  .get(getSingleProduct)
  .patch(authenticateUser, authorizePermissions('admin'), updateProduct)
  .delete(authenticateUser, authorizePermissions('admin'), deleteProduct);

router
  .route('/uploadImage')
  .post(authenticateUser, authorizePermissions('admin'), uploadImage);

router
  .route('/:id/reviews')
  .get(optionalAuthenticateUser, getSingleProductReviews);

module.exports = router;
