# Gemini-Twilio Phone Call Handler

This application integrates Twilio's Voice API with Google's Gemini AI to handle phone calls, process speech, and send webhooks.

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials:
   - Twilio credentials (Account SID, Auth Token, Phone Number)
   - Google API Key
   - Webhook URL (if needed)

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

## Features

- Handles incoming phone calls via Twilio
- Processes speech using Twilio's speech recognition
- Generates responses using Gemini AI
- Forwards calls when requested
- Sends webhooks with conversation details

## Configuration

- Update the `.env` file with your credentials
- Modify the webhook URL to receive conversation logs
- Adjust the speech recognition settings in the `/voice` endpoint

## Note

Make sure your server is publicly accessible so Twilio can send webhooks to it. Consider using ngrok for local development.