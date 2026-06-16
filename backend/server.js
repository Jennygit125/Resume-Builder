const express = require('express');
const { neon } = require('@neondatabase/serverless');
const app = express();
app.use(express.json());

// Initialize Neon with your secure connection string
const sql = neon(process.env.NEON_DATABASE_URL);

// Example Endpoint: Save Resume Data
app.post('/api/save-resume', async (req, res) => {
  const { userId, resumeData } = req.body;
  try {
    // This executes directly and securely on your Neon Database
    await sql`INSERT INTO resumes (user_id, content) VALUES (${userId}, ${resumeData})`;
    res.status(200).send({ success: true });
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(3001, () => console.log('Backend running on port 3001'));