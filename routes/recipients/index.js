const express = require('express');
const { Sequelize } = require('sequelize');

module.exports = function init(sequelize, models) {
  const router = express.Router();

  router.post('/:schoolId', function (req, res) {
    models.Recipient.create(req.body).then(school => {
      res.status(201).json(school);
    }).catch(error => {
      if (error.name === 'SequelizeValidationError') {
        res.status(400).send({ error });
      } else {
        res.status(500).send({ error });
      }
    });
  });
  
  router.put('/:schoolId/:recipientId', function (req, res) {
    sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITED
    }, (t) => {
      const schoolId = req.params.schoolId;
      const recipientId = req.params.recipientId;

      return models.Recipient.findByPk(recipientId).then(recipient => {
        if (recipient === null) {
          res.status(404).send({ error: 'recipient not found' });
          throw new Error('recipient not found');
        }

        if (recipient.schoolId !== parseInt(schoolId)) {
          res.status(409).send({ error: 'school id does not match' });
          throw new Error('school id does not match');            
        }

        const newRecipient = Object.assign({}, req.body);
        delete newRecipient.schoolId;
        delete newRecipient.id;

        return recipient.update(newRecipient, { transaction: t }).then(order => {
          res.status(200).json(order);
        }).catch(error => {
          if (error.name === 'SequelizeValidationError') {
            res.status(400).send({ error });
          } else {
            res.status(500).send({ error });
          }

          throw new Error('Error updating recipient');
        });
      });
    }).catch(error => {
      console.log("Error has been handled and sent out to client ", error);
    });
  });
  
  router.delete('/:schoolId/:recipientId', function (req, res) {
    sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITED
    }, (t) => {
      const schoolId = req.params.schoolId;
      const recipientId = req.params.recipientId;

      return models.Recipient.findByPk(recipientId).then(recipient => {
        if (recipient === null) {
          res.status(404).send({ error: 'recipient not found' });
          throw new Error('recipient not found');
        }

        if (recipient.schoolId !== parseInt(schoolId)) {
          res.status(409).send({ error: 'school id does not match' });
          throw new Error('school id does not match');            
        }

        return recipient.destroy(newRecipient, { transaction: t }).then(order => {
          res.status(200).json(order);
        }).catch(error => {
          if (error.name === 'SequelizeValidationError') {
            res.status(400).send({ error });
          } else {
            res.status(500).send({ error });
          }

          throw new Error('Error updating recipient');
        });
      });
    }).catch(error => {
      console.log("Error has been handled and sent out to client ", error);
    });
  });
  
  router.get('/:schoolId', function (req, res) {
    res.send('About birds')
  });

  return router;
};