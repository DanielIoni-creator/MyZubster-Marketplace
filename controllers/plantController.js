const Plant = require('../models/Plant');
const Reward = require('../models/Reward');
const { mint } = require('../token_simulator');

exports.registerPlant = async (req, res) => {
  try {
    const { species, place, userId, description } = req.body;
    if (!species || !place || !userId) {
      return res.status(400).json({ error: 'Missing required fields: species, place, userId' });
    }

    const newPlant = new Plant({ species, place, description, registeredBy: userId });
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
      place,
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
