import express from 'express';
import { WebSocketServer } from 'ws';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// We'll initialize the GenAI client. Note: it requires process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({});

async function generateCard(topic, index) {
  // MOCK API TO BYPASS GOOGLE DAILY QUOTA LIMITS
  await delay(1200); // Simulate AI generation time
  
  return {
    title: `${topic} - Concept ${index + 1}`,
    concept: `This is the generated explanation for ${topic}. It progressively explains the core principles of the subject in an easy to digest format, mimicking a real AI stream.`,
    funFact: `Did you know? This is randomly generated fact #${Math.floor(Math.random() * 1000)} about ${topic}!`
  };
}

// Helper to simulate delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.action === 'generate') {
        const { topic, simulateError } = data;
        console.log(`Starting generation for topic: ${topic}, simulateError: ${simulateError}`);

        for (let i = 0; i < 3; i++) {
          // Tell client we are starting this card
          ws.send(JSON.stringify({ type: 'CARD_START', index: i }));

          try {
            // Simulate generation failure on the 3rd card
            if (i === 2 && simulateError) {
              await delay(1500); // Simulate processing time before failure
              throw new Error("Simulated generation failure for Card 3");
            }

            const card = await generateCard(topic, i);
            
            // Add a small artificial delay so streaming is visibly progressive even if AI is fast
            await delay(1000); 

            ws.send(JSON.stringify({ type: 'CARD_SUCCESS', index: i, card }));
          } catch (error) {
            console.error(`Error generating card ${i}:`, error.message);
            ws.send(JSON.stringify({ type: 'CARD_ERROR', index: i, message: error.message }));
          }
        }
        
        ws.send(JSON.stringify({ type: 'COMPLETE' }));
      }

      if (data.action === 'retry') {
        const { topic, cardIndex } = data;
        console.log(`Retrying generation for topic: ${topic}, cardIndex: ${cardIndex}`);
        
        ws.send(JSON.stringify({ type: 'CARD_START', index: cardIndex }));
        
        try {
          const card = await generateCard(topic, cardIndex);
          await delay(1000); // Artificial delay
          ws.send(JSON.stringify({ type: 'CARD_SUCCESS', index: cardIndex, card }));
          // If we want to send complete after retry, we could, but maybe not necessary for a single retry
        } catch (error) {
          console.error(`Error retrying card ${cardIndex}:`, error.message);
          ws.send(JSON.stringify({ type: 'CARD_ERROR', index: cardIndex, message: "Retry failed: " + error.message }));
        }
      }
    } catch (error) {
      console.error("WebSocket message handling error:", error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
