import express from 'express';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import dotenv from 'dotenv';

const router = express.Router();
dotenv.config();

const mongoClient = new MongoClient(process.env.DB_CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// All routes in here are starting with /topics
router.get('/', async (req, res) => {
  try {
    const topics = [];
    const suggestions = [];
    const result = [];

    await mongoClient.connect();
    
    mongoClient.db(process.env.DB_NAME)
      .collection(process.env.DB_TOPICS_COLLECTION_NAME)
      .find()
      .forEach((topic) => topic.creator ? suggestions.push(topic) : topics.push(topic))
      .then(() => {
        result.push({topics : topics, suggestions: suggestions});
        res.status(200).json(result);
      })
      .catch(() => res.status(500).json({ error: 'Could not fetch topics.' }))
      .finally(async () => await mongoClient.close());
  } catch(error) {
    res.status(500).json({ error: 'Could not connect to database.' });
  }
});

router.post('/update', async (req, res) => {
  try {
    let votes = req.body;

    votes = [...votes].map((id) => ObjectId(id));
  
    await mongoClient.connect();
  
    mongoClient.db(process.env.DB_NAME).collection(process.env.DB_TOPICS_COLLECTION_NAME).updateMany({ _id: { $in: votes } }, { $inc: { votes: 1 } })
      .then(() => res.status(200).json({ updated: 'Vote(s) added.' }))
      .catch(() => res.status(500).json({ error: 'Could not add vote.' }))
      .finally(async () => await mongoClient.close());
  } catch(error) {
    res.status(500).json({ error: 'Could not connect to database.' });
  }
});

router.post('/add', async (req, res) => {
  try {
    const newSuggestion = req.body;
    const user = req.cookies.token;
    const formatted = [];
  
    newSuggestion.forEach((suggestion) => {
      const firstLetterUpper = suggestion.toLowerCase().replace(/(^\s*\w|[\.\!\?]\s*\w)/g , (c) => c.toUpperCase());
      formatted.push({ creator: user, topic: firstLetterUpper, votes: 1 });
    });
  
    await mongoClient.connect();
    
    mongoClient.db(process.env.DB_NAME).collection(process.env.DB_TOPICS_COLLECTION_NAME).insertMany(formatted)
    .then(() => res.status(200).json({ success: 'Suggestion added.' }))
    .catch(() => res.status(500).json({ error: 'Could not add new suggestion.' }))
    .finally(async () => await mongoClient.close());
  } catch(error) {
    res.status(500).json({ error: 'Could not connect to database.' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const suggestionId = req.body.id;
    const user = req.cookies.token;

    if (ObjectId.isValid(removeSuggestion)) {
      await mongoClient.connect();
      
      mongoClient.db(process.env.DB_NAME).collection(process.env.DB_TOPICS_COLLECTION_NAME).deleteOne({ _id: ObjectId(suggestionId), creator: user })
        .then(() => res.status(200).json({ success: 'Suggestion removed.' }))
        .catch(() => res.status(500).json({ error: 'Could not remove suggestion.' }))
        .finally(async () => await mongoClient.close());
    }
  } catch(error) {
    res.status(500).json({ error: 'Could not connect to database.' });
  }
});

export default router;