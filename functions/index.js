const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getStorage } = require("firebase-admin/storage");
const { defineSecret } = require("firebase-functions/params");
const { onInit } = require('firebase-functions/v2/core');
const axios = require("axios");
const cors = require('cors')({ origin: true });
// Update AWS SDK import to v3
const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");

// Initialize Firebase Admin SDK
const app = initializeApp();

// Initialize Firebase Storage
const storage = getStorage(app);

// Secrets
const openAI = defineSecret("OPEN_AI");
const awsAccessKey = defineSecret("AWS_ACCESS_KEY");
const awsSecretKey = defineSecret("AWS_SECRET_KEY");

let openaiApiKey;
let pollyClient;

onInit(() => {
  openaiApiKey = openAI.value();
  
  // Initialize Polly client
  pollyClient = new PollyClient({
    region: "us-east-1",
    credentials: {
      accessKeyId: awsAccessKey.value(),
      secretAccessKey: awsSecretKey.value(),
    }
  });
});

async function saveAndGetPublicUrl(audioContent) {
  const bucket = storage.bucket();
  const fileName = `speech_${Date.now()}.mp3`;
  const file = bucket.file(fileName);

  await file.save(audioContent, {
    metadata: { contentType: 'audio/mpeg' },
  });

  await file.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
}

exports.teacherResponse = onRequest({ cors: true, secrets: [openAI, awsAccessKey, awsSecretKey] }, async (req, res) => {
  cors(req, res, async () => {
    try {
      if (!openaiApiKey) {
        throw new Error('OpenAI API key is not available.');
      }

      const { corePrompt, prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const systemPrompt = `Respond as a helpful teacher named Ben. Your audience is around 8 years old. Keep responses concise, around 2-3 sentences.
      You are a friendly writing teacher assistant for young students. Your purpose is to help with:
- Writing process (planning, drafting, revising, editing)
- Grammar and punctuation
- Spelling and phonics
- Sentence structure
- Vocabulary
- Story elements (characters, plot, setting)
- Types of writing (narrative, informative, persuasive)
- Evaluating student writing
- Evaluating student responses to activities
- Lesson context:
Q: How long is this lesson?
A: About 15 minutes.
${corePrompt}

Important guidelines:
1. Keep responses clear, simple, and encouraging - remember you're talking to young students
2. Use age-appropriate examples and explanations
3. For grammar or writing rules, provide simple examples to illustrate
4. When giving feedback, always start with something positive
5. Limit responses to 2-3 sentences for clarity

If a student asks about topics unrelated to writing, language arts, or the current lesson, respond politely with:
"I'm your writing helper! I can answer questions about writing, grammar, spelling, and today's lesson. What would you like to know about those topics?"

Examples of appropriate questions you can answer:
- "How do I start my story?"
- "What is a verb?"
- "How do I spell 'because'?"
- "What goes at the end of a question?"
- "How can I make my writing better?"

Examples of questions you should redirect:
- "What's the capital of France?"
- "How do I solve math problems?"
- "What's the weather like?"

Remember: Always maintain an encouraging, patient tone appropriate for young learners.
      `;

      console.log(systemPrompt);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
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

      // Generate TTS using Amazon Polly
      const command = new SynthesizeSpeechCommand({
        Engine: 'neural',
        OutputFormat: 'mp3',
        Text: textResponse,
        VoiceId: 'Justin',
        TextType: 'text'
      });

      const ttsResponse = await pollyClient.send(command);

      // Save audio and get public URL
      const audioUrl = await saveAndGetPublicUrl(Buffer.from(await ttsResponse.AudioStream.transformToByteArray()));

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

exports.prewriteResponse = onRequest({ cors: true, secrets: [openAI, awsAccessKey, awsSecretKey] }, async (req, res) => {
  cors(req, res, async () => {
    try {
      if (!openaiApiKey) {
        throw new Error('OpenAI API key is not available.');
      }

      const { corePrompt, prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const systemPrompt = `Respond as a helpful teacher named Kara. Your audience is around 8 years old. Keep responses concise, around 1-2 sentences.
      You are a friendly writing teacher assistant for young students. Your purpose is to help students prewrite by asking them a series of questions and eliciting an answer.
      If students make mistakes in their answers, including spelling and relevancy mistakes, your role is to help fix them.
This is their question:
${corePrompt}

Important guidelines:
1. Keep responses clear, simple, and encouraging - remember you're talking to young students
2. Use age-appropriate examples and explanations
3. For grammar or writing rules, provide simple examples to illustrate
4. When giving feedback, always start with something positive

If a student asks about topics unrelated to writing, language arts, or the current lesson, respond politely by returning them to the question they are supposed to answer.

Examples of appropriate questions you can answer:
- "How do I start my story?"
- "What is a verb?"
- "How do I spell 'because'?"
- "What goes at the end of a question?"
- "How can I make my writing better?"

Examples of questions you should redirect:
- "What's the capital of France?"
- "How do I solve math problems?"
- "What's the weather like?"

Remember: Always maintain an encouraging, patient tone appropriate for young learners.
      `;

      console.log(systemPrompt);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
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

      // Generate TTS using Amazon Polly
      const command = new SynthesizeSpeechCommand({
        Engine: 'neural',
        OutputFormat: 'mp3',
        Text: textResponse,
        VoiceId: 'Justin',
        TextType: 'text'
      });

      const ttsResponse = await pollyClient.send(command);

      // Save audio and get public URL
      const audioUrl = await saveAndGetPublicUrl(Buffer.from(await ttsResponse.AudioStream.transformToByteArray()));

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