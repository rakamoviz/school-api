const express = require('express');
const moment = require('moment');
const { Sequelize } = require('sequelize');
const constants = require('../../constants');

module.exports = function init(sequelize, models) {
  const router = express.Router();

  router.post('/:schoolId', function (req, res) {
    if (req.body.recipients === undefined || req.body.recipients.length < 1) {
      res.status(400).send({ error: 'at least one recipient is required' });
    } else if (req.body.recipients.length > 20) {
      res.status(400).send({ error: 'maximum can only take 20 recipients' });
    } else {
      const Op = Sequelize.Op;
      sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
      }, (t) => {
        const schoolId = req.params.schoolId;        
        return models.Order.findAll({ where: { schoolId, createdAt: {
          [Op.between]: [
            moment().startOf('day').toDate(), 
            moment().endOf('day').toDate()
          ]
        }, workflowStatus: {
          [Op.ne]: constants.WORKFLOW_STATUS.ORDER_CANCELLED
        }}, include: [models.Recipient] }, { transaction: t }).then(orders => {
          console.log("ORDERS ", JSON.stringify(orders));
          
          const totalGifts = orders.reduce((totalGifts, order) => {
            totalGifts += order.recipients.reduce((subtotalNewGifts, recipient) => {
              subtotalNewGifts += recipient.quantity;
              return subtotalNewGifts;
            }, 0);
            return totalGifts;
          }, 0);

          console.log("TOTAL GIFTS ", totalGifts);

          if (totalGifts >= constants.MAX_DAILY_GIFTS) {
            res.status(400).send({ error: 'max daily gifts exceeded' });
            throw new Error('max daily gifts exceeded');
          }

          const totalNewGifts = req.body.recipients.reduce((totalNewGifts, recipient) => {
            totalNewGifts += recipient.quantity;
            return totalNewGifts;
          }, 0);

          console.log("TOTAL NEW GIFTS ", totalNewGifts);

          if (totalGifts + totalNewGifts > constants.MAX_DAILY_GIFTS) {
            res.status(400).send({ error: 'max daily gifts exceeded' });
            throw new Error('max daily gifts exceeded');
          }

          return models.Order.create(Object.assign({ schoolId }, req.body), {
            include: [models.Recipient],
            transaction: t
          }).then(order => {
            res.status(201).json(order);
          }).catch(error => {
            if (error.name === 'SequelizeValidationError') {
              res.status(400).send({ error });
            } else if (error.name === 'SequelizeForeignKeyConstraintError') {
              res.status(400).send({ error });
            } else {
              res.status(500).send({ error });
            }

            throw new Error('Error creating order');
          });
        });
      }).catch(error => {
        console.log("Error has been handled and sent out to client ", error);
      });
    }
  });
  
  router.put('/:schoolId/:orderId', function (req, res) {
    if (req.body.recipients === undefined || req.body.recipients.length < 1) {
      res.status(400).send({ error: 'at least one recipient is required' });
    } else if (req.body.recipients.length > 20) {
      res.status(400).send({ error: 'maximum can only take 20 recipients' });
    } else {
      const Op = Sequelize.Op;
      sequelize.transaction({
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITED
      }, (t) => {
        const schoolId = req.params.schoolId;
        const orderId = req.params.orderId;

        return models.Order.findByPk(orderId).then(order => {
          if (order === null) {
            res.status(404).send({ error: 'order not found' });
            throw new Error('order not found');
          }

          if (order.schoolId !== parseInt(schoolId)) {
            res.status(409).send({ error: 'school id does not match' });
            throw new Error('school id does not match');            
          }

          if (order.workflowStatus === constants.WORKFLOW_STATUS.ORDER_SHIPPED) {
            res.status(409).send({ error: 'order is already shipped' });
            throw new Error('order is already shipped');
          }

          return models.Order.findAll({ where: { schoolId, createdAt: {
            [Op.between]: [
              moment().startOf('day').toDate(), 
              moment().endOf('day').toDate()
            ]
          }, workflowStatus: {
            [Op.ne]: constants.WORKFLOW_STATUS.ORDER_CANCELLED
          }}, include: [models.Recipient] }, { transaction: t }).then(orders => {
  
            const totalGifts = orders.reduce((totalGifts, order) => {
              totalGifts += order.recipients.reduce((subtotalNewGifts, recipient) => {
                subtotalNewGifts += recipient.quantity;
                return subtotalNewGifts;
              }, 0);
              return totalGifts;
            }, 0);
  
            if (totalGifts >= constants.MAX_DAILY_GIFTS) {
              res.status(400).send({ error: 'max daily gifts exceeded' });
              throw new Error('max daily gifts exceeded');
            }
  
            const totalNewGifts = req.body.recipients.reduce((totalNewGifts, recipient) => {
              totalNewGifts += recipient.quantity;
              return totalNewGifts;
            }, 0);
  
            if (totalGifts + totalNewGifts > constants.MAX_DAILY_GIFTS) {
              res.status(400).send({ error: 'max daily gifts exceeded' });
              throw new Error('max daily gifts exceeded');
            }

            const newOrder = Object.assign({}, req.body);
            delete newOrder.schoolId;
            delete newOrder.id;

            return order.update(newOrder, { include: [models.Recipient], transaction: t }).then(order => {
              res.status(200).json(order);
            }).catch(error => {
              if (error.name === 'SequelizeValidationError') {
                res.status(400).send({ error });
              } else {
                res.status(500).send({ error });
              }
  
              throw new Error('Error updating order');
            });
          });
        });
      }).catch(error => {
        console.log("Error has been handled and sent out to client ", error);
      });      
    }
  });
  
  router.post('/:schoolId/:orderId/cancelation', function (req, res) {
    sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITED
    }, (t) => {
      const schoolId = req.params.schoolId;
      const orderId = req.params.orderId;

      return models.Order.findByPk(orderId).then(order => {
        if (order === null) {
          res.status(404).send({ error: 'order not found' });
          throw new Error('order not found');
        }

        if (order.schoolId !== parseInt(schoolId)) {
          res.status(409).send({ error: 'school id does not match' });
          throw new Error('school id does not match');            
        }

        if (order.workflowStatus === constants.WORKFLOW_STATUS.ORDER_SHIPPED) {
          res.status(409).send({ error: 'order is already shipped' });
          throw new Error('order is already shipped');
        }

        order.workflowStatus = constants.WORKFLOW_STATUS.ORDER_CANCELLED;
  
        return order.save({ transaction: t }).then(order => {
          res.status(200).json(order);
        }).catch(error => {
          if (error.name === 'SequelizeValidationError') {
            res.status(400).send({ error });
          } else {
            res.status(500).send({ error });
          }

          throw new Error('Error updating order');
        });
      });


    }).catch(error => {
      console.log("Error has been handled and sent out to client ", error);
    });
  });
  
  router.post('/:schoolId/:orderId/shipment', function (req, res) {
    sequelize.transaction({
      isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITED
    }, (t) => {
      const schoolId = req.params.schoolId;
      const orderId = req.params.orderId;

      return models.Order.findByPk(orderId).then(order => {
        if (order === null) {
          res.status(404).send({ error: 'order not found' });
          throw new Error('order not found');
        }

        if (order.schoolId !== parseInt(schoolId)) {
          res.status(409).send({ error: 'school id does not match' });
          throw new Error('school id does not match');            
        }

        if (order.workflowStatus === constants.WORKFLOW_STATUS.ORDER_SHIPPED) {
          res.status(409).send({ error: 'order is already shipped' });
          throw new Error('order is already shipped');
        }

        order.workflowStatus = constants.WORKFLOW_STATUS.ORDER_SHIPPED;
  
        return order.save({ transaction: t }).then(order => {
          res.status(200).json(order);
        }).catch(error => {
          if (error.name === 'SequelizeValidationError') {
            res.status(400).send({ error });
          } else {
            res.status(500).send({ error });
          }

          throw new Error('Error updating order');
        });
      });


    }).catch(error => {
      console.log("Error has been handled and sent out to client ", error);
    });
  });
  
  router.get('/:schoolId', function (req, res) {
    models.Order.findAll({ where: { schoolId: req.params.schoolId } }).then(orders => {
      res.status(200).json(orders);
    }).catch(error => {
      res.status(500).send({ error });
    });
  });

  return router;
};