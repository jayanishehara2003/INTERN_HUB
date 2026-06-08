const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/quizzes', require('./routes/quizRoutes'));

app.get('/', (req, res) => res.json({ message: 'Quiz Service is running ✅' }));

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => console.log(`Quiz service running on port ${PORT} 🚀`));

module.exports = app;