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

      const systemPrompt = `You are an AI teaching assistant helping young students (around 8 years old) learn about different topics. 
      You must respond in valid JSON format following this exact structure:
      {
        "analysis": {
          "score": <number between 0 and 1>,
          "isRelevant": <boolean>,
          "completesFrame": <boolean>
        },
        "decision": {
          "action": <string: either "elaborate", "next", or "complete">,
          "reason": <string explaining the decision>
        },
        "response": {
          "feedback": <string: 1 encouraging sentence>,
          "followUp": <string or null: a simple follow-up question if needed>
        }
      }

      Guidelines:
      1. Expect simple, one-sentence answers
      2. Score responses based on:
         - Uses the sentence frame (0.5)
         - Answer is relevant to the question (0.5)
      3. Choose "elaborate" if:
         - Answer doesn't use the sentence frame
         - Answer is completely off-topic
      4. Choose "next" if:
         - Answer uses the frame and is relevant
         - This isn't the final question
      5. Choose "complete" if:
         - Answer is acceptable and this is the final question
      6. Keep feedback very simple and encouraging
      7. Follow-up questions should only ask for basic clarification

      Context from agent:
      ${corePrompt}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const jsonResponse = response.data.choices[0].message.content;

      // Validate JSON structure
      try {
        JSON.parse(jsonResponse);
      } catch (e) {
        const fallbackResponse = {
          analysis: {
            score: 0.5,
            isRelevant: true,
            completesFrame: false
          },
          decision: {
            action: "elaborate",
            reason: "Please use the sentence starter"
          },
          response: {
            feedback: "Good try! Let's use the sentence starter.",
            followUp: null
          }
        };
        return res.json({ text: JSON.stringify(fallbackResponse) });
      }

      // Generate TTS using the feedback text only
      const parsedResponse = JSON.parse(jsonResponse);
      const textToSpeak = parsedResponse.response.feedback + 
        (parsedResponse.response.followUp ? ' ' + parsedResponse.response.followUp : '');

      const command = new SynthesizeSpeechCommand({
        Engine: 'neural',
        OutputFormat: 'mp3',
        Text: textToSpeak,
        VoiceId: 'Justin',
        TextType: 'text'
      });

      const ttsResponse = await pollyClient.send(command);
      const audioUrl = await saveAndGetPublicUrl(Buffer.from(await ttsResponse.AudioStream.transformToByteArray()));

      res.json({
        text: jsonResponse,
        audioUrl: audioUrl
      });
    } catch (error) {
      console.error('Error:', error);
      const errorResponse = {
        analysis: {
          score: 0,
          isRelevant: false,
          completesFrame: false
        },
        decision: {
          action: "elaborate",
          reason: "Error occurred"
        },
        response: {
          feedback: "Let's try that again!",
          followUp: null
        }
      };
      res.status(200).json({ text: JSON.stringify(errorResponse) });
    }
  });
});

exports.evaluateWriting = onRequest({ cors: true, secrets: [openAI, awsAccessKey, awsSecretKey] }, async (req, res) => {
  cors(req, res, async () => {
    try {
      if (!openaiApiKey) {
        throw new Error('OpenAI API key is not available.');
      }

      const { writtenStory, storyData } = req.body;

      if (!writtenStory || !storyData) {
        return res.status(400).json({ error: 'Written story and story data are required.' });
      }

      const systemPrompt = `You are an AI teaching assistant evaluating a young student's writing (around 8 years old). You will receive their written story and the original information they were given.

      You must respond in valid JSON format following this exact structure:
      {
        "evaluation": {
          "relevanceScore": <number between 0 and 1>,
          "mechanicsScore": <number between 0 and 1>,
          "totalScore": <number between 0 and 1>,
          "details": {
            "hasCorrectPunctuation": <boolean>,
            "hasCorrectCapitalization": <boolean>,
            "hasCorrectSpelling": <boolean>,
            "containsOriginalInfo": <boolean>
          }
        },
        "feedback": {
          "mechanics": <string: simple note about punctuation, spelling, or capitals if needed>,
          "relevance": <string: simple note about including all the important information>
        }
      }

      Scoring Guidelines:
      1. Relevance Score (0.5 of total):
         - Check if the story includes all key information from the original text
         - Information should match what was provided
      
      2. Mechanics Score (0.5 of total):
         - Correct punctuation at end of sentences (0.2)
         - Proper capitalization at start of sentences (0.2)
         - Correct spelling of basic words (0.1)

      Total score should be the average of relevanceScore and mechanicsScore.
      
      Original information to check against:
      Topic: ${storyData.topic}
      Habitat: ${storyData.habitat}
      Survival Needs: ${storyData.survivalNeeds}
      Additional Information: ${storyData.additionalNeeds}

      Student's written story to evaluate:
      ${writtenStory}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Please evaluate this writing.' }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const jsonResponse = response.data.choices[0].message.content;

      // Validate JSON structure
      try {
        JSON.parse(jsonResponse);
      } catch (e) {
        const fallbackResponse = {
          evaluation: {
            relevanceScore: 0.5,
            mechanicsScore: 0.5,
            totalScore: 0.5,
            details: {
              hasCorrectPunctuation: true,
              hasCorrectCapitalization: true,
              hasCorrectSpelling: true,
              containsOriginalInfo: true
            }
          },
          feedback: {
            mechanics: "Remember to check your capitals and periods.",
            relevance: "Make sure to include all the important information."
          }
        };
        return res.json({ text: JSON.stringify(fallbackResponse) });
      }

      // Generate TTS using combined feedback
      const parsedResponse = JSON.parse(jsonResponse);
      const textToSpeak = `${parsedResponse.feedback.mechanics} ${parsedResponse.feedback.relevance}`;

      const command = new SynthesizeSpeechCommand({
        Engine: 'neural',
        OutputFormat: 'mp3',
        Text: textToSpeak,
        VoiceId: 'Justin',
        TextType: 'text'
      });

      const ttsResponse = await pollyClient.send(command);
      const audioUrl = await saveAndGetPublicUrl(Buffer.from(await ttsResponse.AudioStream.transformToByteArray()));

      res.json({
        text: jsonResponse,
        audioUrl: audioUrl
      });
    } catch (error) {
      console.error('Error:', error);
      const errorResponse = {
        evaluation: {
          relevanceScore: 0,
          mechanicsScore: 0,
          totalScore: 0,
          details: {
            hasCorrectPunctuation: false,
            hasCorrectCapitalization: false,
            hasCorrectSpelling: false,
            containsOriginalInfo: false
          }
        },
        feedback: {
          mechanics: "Let's check our spelling and punctuation.",
          relevance: "Make sure to include the important information."
        }
      };
      res.status(200).json({ text: JSON.stringify(errorResponse) });
    }
  });
});