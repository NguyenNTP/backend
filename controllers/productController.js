const { StatusCodes } = require('http-status-codes');
const Product = require('../models/Product');
const CustomError = require('../errors');
const path = require('path');

const createProduct = async (req, res) => {
  req.body.user = req.user.userId; // assuming req.user is set by authentication middleware
  const product = await Product.create(req.body); // Create new product instance
  try {
    product.save(); // Save to database (or any storage)
    res.status(StatusCodes.CREATED).json({ product }); // Respond with created product
  } catch (error) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: error.message }); // Handle errors appropriately
  }
};

const getSingleProduct = async (req, res) => {
  const { id: productId } = req.params;

  const product = await Product.findOne({ _id: productId }).populate('review');

  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ product });
};

const getAllProducts = async (req, res) => {
  const products = await Product.find({});

  res.status(StatusCodes.OK).json({ products, count: products.length });
};
const updateProduct = async (req, res) => {
  const { id: productId } = req.params;

  const product = await Product.findOneAndUpdate({ _id: productId }, req.body, {
    new: true, // to return the updated document
    runValidators: true, // to run schema validators on update
  });

  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ product });
};
const deleteProduct = async (req, res) => {
  const { id: productId } = req.params;

  const product = await Product.findOneAndDelete({ _id: productId });

  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  res.status(StatusCodes.OK).json({ msg: 'Product removed' });
};

const uploadImage = async (req, res) => {
  if (!req.files) {
    throw new CustomError.BadRequestError('No file uploaded'); // Check if file is uploaded
  }
  const productImage = req.files.image; // Access the uploaded file

  if (!productImage.mimetype.startsWith('image')) {
    throw new CustomError.BadRequestError('Please upload image file'); // Validate file type
  }
  const maxSize = 1024 * 1024; // 1MB

  if (productImage.size > maxSize) {
    throw new CustomError.BadRequestError(
      'Please upload image smaller than 1MB'
    ); // Validate file size
  }

  const imagePath = path.join(
    __dirname,
    '../public/uploads/' + `${productImage.name}`
  ); // Define path to save the image

  await productImage.mv(imagePath); // Move file to desired location

  res.status(StatusCodes.OK).json({
    image: `/uploads/${productImage.name}`, // Respond with image path
  });
};

module.exports = {
  createProduct,
  getSingleProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  uploadImage,
};
