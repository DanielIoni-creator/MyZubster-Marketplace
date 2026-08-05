const express = require('express');
const router = express.Router();
const plantController = require('../controllers/plantController');

router.post('/register', plantController.registerPlant);
router.get('/', plantController.getPlants);
router.get('/:id', plantController.getPlantById);
router.put('/:id', plantController.updatePlant);
router.delete('/:id', plantController.deletePlant);

module.exports = router;
