# E-Commerce API

REST API for an online shop: authentication, products, reviews and orders.

**Stack:** Node.js, Express 4, MongoDB (Mongoose 6), JWT in signed httpOnly cookies.

## Getting started

Requirements: Node.js 20+, a MongoDB connection string.

```bash
npm install
# create a .env file with the variables below
npm start              # nodemon app.js, http://localhost:5000
```

### Environment variables

| Variable       | Description                                      |
| -------------- | ------------------------------------------------ |
| `MONGO_URL`    | MongoDB connection string                        |
| `JWT_SECRET`   | Secret for signing JWTs and cookies              |
| `JWT_LIFETIME` | JWT lifetime, e.g. `1d`                          |
| `PORT`         | Optional, defaults to `5000`                     |
| `NODE_ENV`     | `production` makes cookies `secure` (HTTPS only) |

## API

Base path: `/api/v1`. Interactive docs (Swagger UI): `/api-docs` (source: `swagger.yaml`).

| Resource | Endpoint                             | Access                            |
| -------- | ------------------------------------ | --------------------------------- |
| Auth     | `POST /auth/register`                | Public                            |
|          | `POST /auth/login`                   | Public                            |
|          | `POST /auth/logout`                  | Public                            |
| Users    | `GET /users`                         | Admin                             |
|          | `GET /users/showMe`                  | Logged in                         |
|          | `PATCH /users/updateUser`            | Logged in                         |
|          | `PATCH /users/updateUserPassword`    | Logged in                         |
|          | `GET /users/:id`                     | Owner or admin                    |
|          | `DELETE /users/deleteUser/:id`       | Admin                             |
| Products | `GET /products`, `GET /products/:id` | Public                            |
|          | `POST /products`                     | Admin (single or array body)      |
|          | `PATCH/DELETE /products/:id`         | Admin                             |
|          | `POST /products/uploadImage`         | Admin (jpg/png/gif/webp, max 1MB) |
|          | `GET /products/:id/reviews`          | Public                            |
| Reviews  | `GET /reviews`, `GET /reviews/:id`   | Public                            |
|          | `POST /reviews`                      | Logged in                         |
|          | `PATCH/DELETE /reviews/:id`          | Owner or admin                    |
| Orders   | `POST /orders`                       | Logged in                         |
|          | `GET /orders`                        | Admin                             |
|          | `GET /orders/showAllMyOrders`        | Logged in                         |
|          | `GET/PATCH /orders/:id`              | Owner or admin                    |
|          | `DELETE /orders/:id`                 | Admin                             |

## Behavior notes

- Auth uses a signed `token` cookie, so clients must send credentials (CORS `credentials: true`). Allowed origins are set in `app.js`.
- Order totals are computed server-side from product prices in the database.
- Payment is **not integrated yet**: `createOrder` uses a fake Stripe client and `updateOrder` marks the order paid without verifying `paymentIntentId`.
- Security middleware: `helmet`, rate limit (300 requests / 15 min per IP, `trust proxy` enabled), `express-mongo-sanitize`.
- Uploaded images are saved to `public/uploads` with server-generated names and served from `/uploads/...`.
- Deleting a product also deletes its reviews (`pre('remove')` hook on the Product model).

## Project structure

```
app.js          Server setup and middleware
controllers/    Request handlers
routes/         Route definitions
models/         Mongoose schemas
middleware/     Auth, error handling, 404
errors/         Custom error classes
utils/          JWT, permission checks
db/             Mongo connection
mockData/       Sample products and orders
swagger.yaml    OpenAPI docs
```

## Scripts

| Command                             | Purpose          |
| ----------------------------------- | ---------------- |
| `npm start`                         | Run with nodemon |
| `npm run lint` / `npm run lint:fix` | ESLint           |
| `npm run format`                    | Prettier         |

Commits follow Conventional Commits (enforced by commitlint via husky).

## Deployment

- **Docker:** `docker build -t e-commerce-api .` then run with the env vars above, exposing port `5000`.
- **Heroku-style platforms:** the `Procfile` runs `node app.js`.

> `ec2-user-data.sh` is only an AWS EC2 user-data template and does not start this app.
