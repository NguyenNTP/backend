const mongoose = require('mongoose');

const ProductSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Please provide product name'],
      maxlength: [100, 'Name can not be more than 100 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide product price'],
      default: 0,
    },
    description: {
      type: String,
      required: [true, 'Please provide product description'],
      maxlength: [1000, 'Description can not be more than 1000 characters'],
    },

    image: {
      type: String,
      default: '/uploads/example.jpg',
    },

    category: {
      type: String,
      required: [true, 'Please provide product category'],
      enum: ['office', 'kitchen', 'bedroom', 'living room', 'dining', 'kids'],
    },
    company: {
      type: String,
      required: [true, 'Please provide product company'],
      enum: {
        values: ['ikea', 'liddy', 'marcos'],
        message: '{VALUE} is not supported',
      },
    },
    colors: {
      type: [String],
      required: true,
      default: ['#000000'],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    freeShipping: {
      type: Boolean,
      default: false,
    },
    inventory: {
      type: Number,
      required: true,
      default: 15,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    numOfReviews: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Types.ObjectId, // this is to establish a relationship between product and user
      ref: 'User', // reference to User model
      required: true,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } } // to automatically add createdAt and updatedAt fields
);

ProductSchema.virtual('review', {
  ref: 'Review', // reference to Review model
  localField: '_id', // field in Product model
  foreignField: 'product', // field in Review model
  justOne: false, // set to false to get array of reviews
});

ProductSchema.pre('remove', async function (next) {
  await this.model('Review').deleteMany({ product: this._id });
  next();
}); // middleware to delete reviews when a product is deleted

ProductSchema.index({ name: 'text', description: 'text', company: 'text' }); // text index for search functionality

module.exports = mongoose.model('Product', ProductSchema);
