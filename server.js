import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import twilio from 'twilio';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

if (!accountSid || !authToken) {
  console.error('Missing Twilio credentials');
  process.exit(1);
}

const client = twilio(accountSid, authToken);
const VoiceResponse = twilio.twiml.VoiceResponse;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Handle incoming calls
app.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();

  // Gather speech input from the caller
  const gather = twiml.gather({
    input: 'speech',
    action: '/process-speech',
    language: 'en-US',
    speechTimeout: 'auto',
    timeout: 3
  });
  
  gather.say('Hello! How can I help you today?');

  // If no input received
  twiml.say('We did not receive any input. Goodbye!');

  res.type('text/xml');
  res.send(twiml.toString());
});

// Process speech and generate response using Gemini
app.post('/process-speech', async (req, res) => {
  const twiml = new VoiceResponse();
  const speechInput = req.body.SpeechResult;

  if (!speechInput) {
    twiml.say('I could not understand what you said. Please try again.');
    twiml.redirect('/voice');
    res.type('text/xml');
    return res.send(twiml.toString());
  }

  try {
    // Get response from Gemini
    const prompt = `You are a helpful phone assistant. Respond to the following request concisely and naturally: ${speechInput}`;
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Convert Gemini's response to speech
    twiml.say({
      voice: 'alice'
    }, response);

    // Forward call if requested
    if (speechInput.toLowerCase().includes('transfer') ||
        speechInput.toLowerCase().includes('forward')) {
      if (process.env.FORWARD_TO_NUMBER) {
        twiml.dial(process.env.FORWARD_TO_NUMBER);
      } else {
        twiml.say('I apologize, but the forward number is not configured.');
      }
    }

    // Send webhook with conversation details
    if (process.env.WEBHOOK_URL) {
      await sendWebhook({
        userInput: speechInput,
        aiResponse: response,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Error:', error);
    twiml.say('I apologize, but I encountered an error. Please try again later.');
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Webhook sender
async function sendWebhook(data) {
  try {
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) return;

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error('Webhook Error:', error);
  }
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});