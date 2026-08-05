const Plant = require('../models/Plant');
const Reward = require('../models/Reward');
const { mint } = require('../token_simulator');

exports.registerPlant = async (req, res) => {
  try {
    const { species, location, userId, description } = req.body;
    if (!species || !location || !userId) {
      return res.status(400).json({ error: 'Missing required fields: species, location, userId' });
    }

    const newPlant = new Plant({ species, location, description, registeredBy: userId });
    await newPlant.save();

    const rewardAmount = parseInt(process.env.REWARD_PLANT_REGISTRATION) || 10;
    const txId = await mint(userId, rewardAmount);

    const reward = new Reward({
      userId,
      amount: rewardAmount,
      reason: `Registrazione nuova specie vegetale: ${species}`,
      source: 'plant_registry',
      txId,
      status: 'completed'
    });
    await reward.save();

    res.json({
      success: true,
      plantId: newPlant._id,
      species,
      location,
      reward: {
        amount: rewardAmount,
        currency: 'MYZ',
        txId
      }
    });
  } catch (err) {
    console.error('❌ Errore registrazione pianta:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getPlants = async (req, res) => {
  try {
    const plants = await Plant.find();
    res.json({ success: true, data: plants });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPlantById = async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) return res.status(404).json({ error: 'Pianta non trovata' });
    res.json({ success: true, data: plant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePlant = async (req, res) => {
  try {
    const { species, location, description } = req.body;
    const plant = await Plant.findByIdAndUpdate(
      req.params.id,
      { species, location, description, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!plant) return res.status(404).json({ error: 'Pianta non trovata' });
    res.json({ success: true, data: plant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePlant = async (req, res) => {
  try {
    const plant = await Plant.findByIdAndDelete(req.params.id);
    if (!plant) return res.status(404).json({ error: 'Pianta non trovata' });
    res.json({ success: true, message: 'Pianta eliminata' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
