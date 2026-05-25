// express

const express = require('express');
const app = express();

const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

require('dotenv').config();
require('express-async-errors');
//rest of the packages
const morgan = require('morgan'); // HTTP request logger middleware for node.js
const cookieParser = require('cookie-parser'); // Parse Cookie header and populate req.cookies with an object keyed by the cookie n
const fileUpload = require('express-fileupload');

app.use(express.static('public'));

const cors = require('cors');

// connectDB
const connectDB = require('./db/connect');

//routers
const authRouter = require('./routes/authRoute');
const userRouter = require('./routes/userRoute');
const productRouter = require('./routes/productRoute');
const reviewRouter = require('./routes/reviewRoute');
const orderRouter = require('./routes/orderRoute');

// middleware
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// routes
app.use(morgan('tiny')); // logging middleware
app.use(express.json()); // middleware to parse JSON bodies. it helps to access req.body
app.use(cookieParser(process.env.JWT_SECRET)); // middleware to parse cookies. it helps to access req.cookies

app.use(fileUpload()); // middleware to handle file uploads

app.use(express.urlencoded({ extended: false })); // middleware to parse URL-encoded bodies. it helps to access req.body
app.use(express.static('./public'));
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
); // middleware to handle CORS requests. it helps to access req.cookies. it is used to allow requests from the client.

app.get('/api/v1', (req, res) => {
  // console.log(req.cookies);
  console.log(req.signedCookies); // to access signed cookies
  res.send('E-commerce App....');
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/products', productRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/orders', orderRouter);

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// errors middleware should be after all routes
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URL);
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Error starting the server:', error);
  }
};

start();
