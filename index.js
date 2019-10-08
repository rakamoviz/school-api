const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const { Sequelize } = require('sequelize');
const jwt = require('jsonwebtoken');
const config = require('./config');
const middleware = require('./middleware');

const port = process.env.API_PORT;

app.use(cors());
app.use(bodyParser.json());
app.use(middleware.checkToken);

const sequelize = new Sequelize('sqlite::memory:');

require('./models')(sequelize).then(models => {
  app.use('/schools', require('./routes/schools')(sequelize, models));
  app.use('/recipients', require('./routes/recipients')(sequelize, models));
  app.use('/orders', require('./routes/orders')(sequelize, models));
  
  app.listen(port, () => console.log(`Example app listening on port ${port}!`))
});