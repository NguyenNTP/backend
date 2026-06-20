const Review = require('../models/Review');
const CustomError = require('../errors');
const Product = require('../models/Product');
const { StatusCodes } = require('http-status-codes');
const { checkPermissions } = require('../utils');

const createReview = async (req, res) => {
  const { product: productId } = req.body;

  const isValidProduct = await Product.findOne({ _id: productId });

  if (!isValidProduct) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  const alreadySubmitted = await Review.findOne({
    product: productId,
    user: req.user.userId,
  });

  if (alreadySubmitted) {
    throw new CustomError.BadRequestError(
      'Review already submitted for this product'
    );
  }

  req.body.user = req.user.userId;

  const review = await Review.create(req.body);
  res.status(StatusCodes.CREATED).json({ review });
};

const getAllReviews = async (req, res) => {
  const reviews = await Review.find({})
    .populate({
      path: 'product', // Populate product details
      select: 'name company price', // Select specific fields to return
    })
    .populate({
      path: 'user',
      select: 'name', // Select specific fields to return
    });

  res.status(StatusCodes.OK).json({ reviews, count: reviews.length });
};

const getSingleReview = async (req, res) => {
  const reviewId = req.params.id;

  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new CustomError.NotFoundError(`No review with id : ${reviewId}`);
  }

  res.status(StatusCodes.OK).json({ review });
};

const updateReview = async (req, res) => {
  const reviewId = req.params.id;

  const { rating, title, comment } = req.body;

  const review = await Review.findByIdAndUpdate(reviewId, req.body, {
    new: true,
    runValidators: true,
  });

  if (!review) {
    throw new CustomError.NotFoundError(`No review with id : ${reviewId}`);
  }

  checkPermissions(req.user, review.user);

  if (rating) review.rating = rating;
  if (title) review.title = title;
  if (comment) review.comment = comment;

  await review.save();
  res.status(StatusCodes.OK).json({ review });
};

const deleteReview = async (req, res) => {
  const reviewId = req.params.id;
  const review = await Review.findOne({ _id: reviewId });

  if (!review) {
    throw new CustomError.NotFoundError(`No review with id : ${reviewId}`);
  }

  checkPermissions(req.user, review.user);

  await review.remove();

  res.status(StatusCodes.OK).json({ msg: 'Review removed' });
};

const getSingleProductReviews = async (req, res) => {
  const { id: productId } = req.params;

  const product = await Product.findOne({ _id: productId });
  if (!product) {
    throw new CustomError.NotFoundError(`No product with id : ${productId}`);
  }

  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.limit, 10) || 10;
  const hasRatingFilter = Boolean(req.query.rating);
  const rating = hasRatingFilter
    ? Number.parseInt(req.query.rating, 10)
    : undefined;

  if (!Number.isInteger(page) || page < 1) {
    throw new CustomError.BadRequestError('Page must be a positive integer');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    throw new CustomError.BadRequestError('Limit must be between 1 and 50');
  }
  if (
    hasRatingFilter &&
    (!Number.isInteger(rating) || rating < 1 || rating > 5)
  ) {
    throw new CustomError.BadRequestError('Rating must be between 1 and 5');
  }

  const filter = { product: productId };
  if (rating !== undefined) {
    filter.rating = rating;
  }

  const ratingAgg = await Review.aggregate([
    { $match: { product: product._id } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ]);

  const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingAgg.forEach((row) => {
    if (row._id >= 1 && row._id <= 5) {
      ratingCounts[row._id] = row.count;
    }
  });

  let userReview = null;
  if (req.user?.userId) {
    userReview = await Review.findOne({
      product: productId,
      user: req.user.userId,
    }).populate('user', 'name _id');
  }

  const count = await Review.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const shouldPin =
    page === 1 &&
    userReview &&
    (rating === undefined || userReview.rating === rating);

  const listFilter = { ...filter };
  if (shouldPin) {
    listFilter._id = { $ne: userReview._id };
  }

  const skip = (page - 1) * limit;
  const reviews = await Review.find(listFilter)
    .populate('user', 'name _id')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const resultReviews = shouldPin ? [userReview, ...reviews] : reviews;

  res.status(StatusCodes.OK).json({
    reviews: resultReviews,
    count,
    page,
    totalPages,
    ratingCounts,
    userReview,
  });
};

module.exports = {
  createReview,
  getAllReviews,
  getSingleReview,
  updateReview,
  deleteReview,
  getSingleProductReviews,
};
