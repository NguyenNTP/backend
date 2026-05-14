const { StatusCodes } = require('http-status-codes');
const User = require('../models/User');

const CustomError = require('../errors');
const {
  createTokenUser,
  attachCookiesToResponse,
  checkPermissions,
} = require('../utils');

const getAllUsers = async (req, res) => {
  console.log(req.user); // from authenticateUser middleware
  const users = await User.find({ role: 'user' }).select('-password'); // exclude password field
  res.status(StatusCodes.OK).json({ users });
};

const getSingleUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id }).select('-password');
  if (!user) {
    throw new CustomError.NotFoundError(`No user with id:${req.params.id}`);
  }
  checkPermissions(req.user, user._id);
  res.status(StatusCodes.OK).json({ user });
};

// update user with user.save() to trigger pre save hooks
const updateUser = async (req, res) => {
  const { email, name } = req.body;

  if (!name || !email) {
    throw new CustomError.BadRequestError('Please provide both values');
  }

  const user = await User.findOne({ _id: req.user.userId });

  user.email = email;
  user.name = name;

  await user.save();

  const tokenUser = createTokenUser(user);

  attachCookiesToResponse({ res, user: tokenUser });

  res.status(StatusCodes.OK).json({ user: tokenUser });
};

const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError('Please provide both values');
  }

  const user = await User.findOne({ _id: req.user.userId }).select('+password');

  const isCorrectPassword = await user.comparePassword(oldPassword);

  if (!isCorrectPassword) {
    throw new CustomError.UnauthenticatedError('Old password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.status(StatusCodes.OK).json({ msg: 'Success! The password is updated' });
};

const deleteUser = (req, res) => {
  const userId = req.params.id;
  // Logic to delete a user by ID
  res.send(`Delete user with ID: ${userId}`);
};

const showCurrentUser = (req, res) => {
  // Logic to show the currently authenticated user
  res.status(StatusCodes.OK).json({ user: req.user });
};

module.exports = {
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  showCurrentUser,
  updateUserPassword,
};

// const updateUser = async (req, res) => {
//   const { email, name } = req.body;

//   if (!name || !email) {
//     throw new CustomError.BadRequestError('Please provide both values');
//   }

//   const user = await User.findOneAndUpdate(
//     {
//       _id: req.user.id,
//     },
//     {
//       name,
//       email,
//     },
//     {
//       new: true,
//       runValidators: true,

//     }
//   );

//   const tokenUser = createTokenUser(user);

//   attachCookiesToResponse({ res, user: tokenUser });
