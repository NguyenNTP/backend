const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReviewSchema = new Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId, // This references the Product model
      ref: 'Product',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId, // This references the User model
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Please provide rating'],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: [true, 'Please provide title'],
      trim: true,
    },
    comment: {
      type: String,
      required: [true, 'Please provide comment'],
    },
  },
  { timestamps: true }
);
ReviewSchema.index({ product: 1, user: 1 }, { unique: true }); // Ensure one review per user per product

ReviewSchema.statics.calculateAverageRating = async function (productId) {
  const result = await this.aggregate([
    {
      $match: { product: productId },
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        numOfReviews: { $sum: 1 },
      },
    },
  ]);
  try {
    await this.model('Product').findOneAndUpdate(
      { _id: productId },
      {
        averageRating: Math.ceil(result[0] ? result[0].averageRating : 0),
        numOfReviews: result[0] ? result[0].numOfReviews : 0,
      }
    );
  } catch (error) {
    console.error(error);
  }
};

ReviewSchema.post('save', async function () {
  await this.constructor.calculateAverageRating(this.product);
}); // middleware will called after a review is saved to the database

ReviewSchema.post('remove', async function () {
  await this.constructor.calculateAverageRating(this.product);
}); // middleware will called after a review is removed to the database

module.exports = mongoose.model('Review', ReviewSchema);
