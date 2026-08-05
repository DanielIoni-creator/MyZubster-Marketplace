const Animal = require('../models/Animal');
const Reward = require('../models/Reward');
const { mint } = require('../token_simulator');

exports.registerAnimal = async (req, res) => {
  try {
    const { species, location, userId, description } = req.body;
    if (!species || !location || !userId) {
      return res.status(400).json({ error: 'Missing required fields: species, location, userId' });
    }

    const newAnimal = new Animal({ species, location, description, registeredBy: userId });
    await newAnimal.save();

    const rewardAmount = parseInt(process.env.REWARD_ANIMAL_REGISTRATION) || 10;
    const txId = await mint(userId, rewardAmount);

    const reward = new Reward({
      userId,
      amount: rewardAmount,
      reason: `Registrazione nuova specie animale: ${species}`,
      source: 'animal_registry',
      txId,
      status: 'completed'
    });
    await reward.save();

    res.json({
      success: true,
      animalId: newAnimal._id,
      species,
      location,
      reward: {
        amount: rewardAmount,
        currency: 'MYZ',
        txId
      }
    });
  } catch (err) {
    console.error('❌ Errore registrazione animale:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.getAnimals = async (req, res) => {
  try {
    const animals = await Animal.find();
    res.json({ success: true, data: animals });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAnimalById = async (req, res) => {
  try {
    const animal = await Animal.findById(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animale non trovato' });
    res.json({ success: true, data: animal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAnimal = async (req, res) => {
  try {
    const { species, location, description } = req.body;
    const animal = await Animal.findByIdAndUpdate(
      req.params.id,
      { species, location, description, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!animal) return res.status(404).json({ error: 'Animale non trovato' });
    res.json({ success: true, data: animal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAnimal = async (req, res) => {
  try {
    const animal = await Animal.findByIdAndDelete(req.params.id);
    if (!animal) return res.status(404).json({ error: 'Animale non trovato' });
    res.json({ success: true, message: 'Animale eliminato' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
