const CustomError = require('../errors');
const { isTokenValid } = require('../utils/jwt');

const authenticateUser = (req, res, next) => {
  const token = req.signedCookies.token; // accessing signed cookie

  if (!token) {
    throw new CustomError.CustomAPIError('Authentication error');
  }

  try {
    const { name, userId, role } = isTokenValid({ token });

    req.user = {
      name,
      userId,
      role,
    };
  } catch (error) {
    throw new CustomError.UnauthenticatedError('Token is invalid');
  }
  next();
};

const authorizePermissions = (...routes) => {
  return (req, res, next) => {
    if (!routes.includes(req.user.role)) {
      throw new CustomError.UnauthorizedError(
        'Unauthorized to access this route'
      );
    }
    next();
  };
};

const optionalAuthenticateUser = (req, res, next) => {
  const token = req.signedCookies.token;

  if (!token) {
    return next();
  }

  try {
    const { name, userId, role } = isTokenValid({ token });
    req.user = { name, userId, role };
  } catch {
    // Public route — invalid token is treated as anonymous
  }

  next();
};

module.exports = {
  authenticateUser,
  authorizePermissions,
  optionalAuthenticateUser,
};
