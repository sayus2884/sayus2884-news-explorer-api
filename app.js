const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { errors, celebrate, Joi } = require('celebrate');
require('dotenv').config();

const { validateEmail } = require('./utils/validation');
const NotFoundError = require('./errors/not-found-err');

const userRoutes = require('./routes/users')
const articleRoutes = require('./routes/articles')

const auth = require('./middlewares/auth');
const { requestLogger, errorLogger } = require('./middlewares/logger');

const { createUser, login } = require('./controllers/users');

const { PORT = 8080 } = process.env;

const app = express();

mongoose.connect('mongodb://localhost:27017/newsdb');

app

  .use(requestLogger)

  .use(bodyParser.json())

  .post('/signin', celebrate({
    body: Joi.object().keys({
      email: Joi.string().required().custom(validateEmail),
      password: Joi.string().required(),
    })
  }), login)
  .post('/signup', celebrate({
    body: Joi.object().keys({
      name: Joi.string().required().min(2).max(30),
      email: Joi.string().required().custom(validateEmail),
      password: Joi.string().required(),
    })
  }), createUser)

  .use(auth)

  .use(userRoutes)
  .use(articleRoutes)

  .use('*', () => {
    throw new NotFoundError('Requested resource not found');
  })

  .use(errorLogger)
  .use(errors())
  .use((err, req, res, next) => {
    const { statusCode, message } = err;

    console.log(err);

    res.status(statusCode)
      .send({ message: statusCode === 500 ? 'An error occured on the server.' : message });
  })

  .listen(PORT, () => {
    console.log(`App listening at port ${PORT}`);
  });
