const express = require('express');
const { Sequelize } = require('sequelize');

module.exports = function init(sequelize, models) {
  const router = express.Router();

  router.post('/', function (req, res) {
    models.School.create(req.body).then(school => {
      res.status(201).json(school);
    }).catch(error => {
      if (error.name === 'SequelizeValidationError') {
        res.status(400).send({ error });
      } else {
        res.status(500).send({ error });
      }
    });
  });

  router.put('/:schoolId', function (req, res) {
    sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    }, (t) => {
      const schoolId = req.params.schoolId;

      return models.School.findByPk(schoolId).then(school => {
        if (school === null) {
          res.status(404).send({ error: 'school not found' });
          throw new Error('school not found');
        }

        const newSchool = Object.assign({}, req.body);
        delete newSchool.schoolId;

        return school.update(newSchool, { transaction: t }).then(school => {
          res.status(200).json(school);
        }).catch(error => {
          if (error.name === 'SequelizeValidationError') {
            res.status(400).send({ error });
          } else {
            res.status(500).send({ error });
          }

          throw new Error('Error updating school');
        });
        
      });
    }).catch(error => {
      console.log("Error has been handled and sent out to client ", error);
    });
  });

  //deleting school will automatically delete associated orders, 
  //and subsequently the recipients (associated with each orders)
  router.delete('/:schoolId', function (req, res) {
    sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
    }, (t) => {
      const schoolId = req.params.schoolId;

      return models.School.findByPk(schoolId).then(school => {
        if (school === null) {
          res.status(404).send({ error: 'school not found' });
          throw new Error('school not found');
        }

        return school.destroy({ transaction: t }).then(() => {
          res.status(200).json({});
        }).catch(error => {
          if (error.name === 'SequelizeValidationError') {
            res.status(400).send({ error });
          } else {
            res.status(500).send({ error });
          }

          throw new Error('Error deleting school');
        });
        
      });
    }).catch(error => {
      console.log("Error has been handled and sent out to client ", error);
    });
  });

  return router;
};