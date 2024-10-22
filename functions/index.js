const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const { defineSecret } = require("firebase-functions/params");
const { onInit } = require('firebase-functions/v2/core');
const axios = require("axios");
const cors = require('cors')({ origin: true });
const textToSpeech = require('@google-cloud/text-to-speech');

// Initialize Firebase Admin SDK
const app = initializeApp();

// Initialize Firebase Storage
const storage = getStorage(app);

//Secrets
const openAI = defineSecret("OPEN_AI");

let openaiApiKey;

onInit(() => {
  openaiApiKey = openAI.value();
});

const ttsClient = new textToSpeech.TextToSpeechClient();

async function saveAndGetPublicUrl(audioContent) {
  const bucket = storage.bucket(); // Get the default bucket
  const fileName = `speech_${Date.now()}.mp3`;
  const file = bucket.file(fileName);

  await file.save(audioContent, {
    metadata: { contentType: 'audio/mpeg' },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

exports.teacherResponse = onRequest({ cors: true, secrets: [openAI] }, async (req, res) => {
  cors(req, res, async () => {
    try {
      if (!openaiApiKey) {
        throw new Error('OpenAI API key is not available.');
      }

      const { corePrompt, prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const systemPrompt = "Respond as a helpful teacher. Keep responses concise, around 2-3 sentences.";
      const fullPrompt = corePrompt + systemPrompt;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: fullPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const textResponse = response.data.choices[0].message.content;

      // Generate TTS
      const [ttsResponse] = await ttsClient.synthesizeSpeech({
        input: { text: textResponse },
        voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
        audioConfig: { audioEncoding: 'MP3' },
      });

      // Save audio and get public URL
      const audioUrl = await saveAndGetPublicUrl(ttsResponse.audioContent);

      res.json({
        text: textResponse,
        audioUrl: audioUrl
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'An error occurred: ' + error.message });
    }
  });
});