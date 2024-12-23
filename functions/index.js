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

      const { corePrompt, prompt, language = 'en' } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      const systemPrompts = {
        en: `Respond as a helpful English-speaking teacher named Justin. Respond in English. Your audience is around 8 years old. Keep responses concise, around 2-3 sentences.
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
"I'm your writing helper! I can answer questions about writing, grammar, spelling, and today's lesson. What would you like to know about those topics?"`,

        zh: `Respond as a helpful Chinese-speaking teacher named Ben. Respond in simplified Chinese. Your audience is around 8 years old. Keep responses concise, around 2-3 sentences.
        你是一位友好的写作老师助手，为年轻学生提供帮助。你的目的是协助：
- 写作过程（计划、起草、修改、编辑）
- 语法和标点符号
- 拼写和语音
- 句子结构
- 词汇
- 故事元素（人物、情节、背景）
- 写作类型（叙事、信息、说服）
- 评估学生写作
- 评估学生活动响应
- 课程背景：
问：这节课多长时间？
答：大约15分钟。
${corePrompt}

重要指导原则：
1. 保持回答清晰、简单和鼓励性 - 记住你在和年轻学生交谈
2. 使用适合年龄的例子和解释
3. 对于语法或写作规则，提供简单的例子来说明
4. 给予反馈时，总是从正面开始
5. 将回答限制在2-3句话以保持清晰

如果学生询问与写作、语言艺术或当前课程无关的话题，请礼貌地回答：
"我是你的写作助手！我可以回答关于写作、语法、拼写和今天课程的问题。你想了解这些主题的什么内容呢？"`
      };

      const systemPrompt = systemPrompts[language];
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

      const encodedText = new TextEncoder().encode(textResponse);
      const decodedText = new TextDecoder('utf-8').decode(encodedText);

      // Configure TTS based on language
      const ttsConfig = {
        Engine: 'neural',
        OutputFormat: 'mp3',
        Text: decodedText,
        VoiceId: language === 'zh' ? 'Zhiyu' : 'Justin',
        TextType: 'text'
      };

      const command = new SynthesizeSpeechCommand(ttsConfig);
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
        VoiceId: 'Zhiyu',
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
          "strengths": <string: simple note about what student did well>,
          "improvements": <string: simple note about punctuation, spelling, or capitals if needed>
        }
      }

      Scoring Guidelines:
      1. Relevance Score (0.5 of total):
         - Check if the writing includes information that is relevant to the topic
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
      Additional Information: ${storyData.additionalNeeds}`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Please evaluate this writing: ${writtenStory}` }
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
            strengths: "Remember to check your capitals and periods.",
            improvements: "Make sure to include all the important information."
          }
        };
        return res.json({ text: JSON.stringify(fallbackResponse) });
      }

      // Generate TTS using combined feedback
      const parsedResponse = JSON.parse(jsonResponse);
      const textToSpeak = `${parsedResponse.feedback.strengths} ${parsedResponse.feedback.improvements}`;

      const command = new SynthesizeSpeechCommand({
        Engine: 'neural',
        OutputFormat: 'mp3',
        Text: textToSpeak,
        VoiceId: 'Zhiyu',
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
          strengths: "You capitalized the first letter of the sentence.",
          improvements: "Make sure to spell 'because' correctly and capitalize names."
        }
      };
      res.status(200).json({ text: JSON.stringify(errorResponse) });
    }
  });
});

exports.reviseWriting = onRequest({ cors: true, secrets: [openAI, awsAccessKey, awsSecretKey] }, async (req, res) => {
  cors(req, res, async () => {
    try {
      if (!openaiApiKey) {
        throw new Error('OpenAI API key is not available.');
      }

      const { writtenStory, storyData } = req.body;

      if (!writtenStory || !storyData) {
        return res.status(400).json({ error: 'Written story and story data are required.' });
      }

      const systemPrompt = `You are an AI teaching assistant helping a young student (around 8 years old) revise their writing for content and clarity. You will receive their written story and the original information they were given.

      You must respond in valid JSON format following this exact structure:
      {
        "revision": {
          "ideaScore": <number between 0 and 1>,
          "detailScore": <number between 0 and 1>,
          "organizationScore": <number between 0 and 1>,
          "totalScore": <number between 0 and 1>,
          "details": {
            "hasIntroduction": <boolean>,
            "hasClearSequence": <boolean>,
            "includesAllTopics": <boolean>,
            "hasDescriptiveWords": <boolean>
          }
        },
        "feedback": {
          "strengths": <string: what the student did well>,
          "improvements": <string: specific suggestions for adding details or clarifying ideas>
        }
      }

      Scoring Guidelines:
      1. Idea Score (0.4 of total):
         - Main ideas are clear and on topic
         - Information matches what was provided
         - Ideas are fully developed
      
      2. Detail Score (0.4 of total):
         - Includes specific details about the topic
         - Uses descriptive words
         - Provides examples or explanations
      
      3. Organization Score (0.2 of total):
         - Has a clear beginning
         - Events or ideas follow a logical sequence
         - Similar ideas are grouped together

      Total score should weight the three scores as specified above.
      
      Original information to check against:
      Topic: ${storyData.topic}
      Habitat: ${storyData.habitat}
      Survival Needs: ${storyData.survivalNeeds}
      Additional Information: ${storyData.additionalNeeds}

       Important Notes for Feedback:
      - Use encouraging, age-appropriate language
      - Give specific examples of where to add details
      - Suggest sensory words or descriptive phrases they could use
      - Point out strong parts of their writing
      - Keep suggestions focused on content and clarity, not grammar or spelling
      - Limit to 1 main revision suggestion`;

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Please evaluate this writing: ${writtenStory}` }
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
          revision: {
            ideaScore: 0.5,
            detailScore: 0.5,
            organizationScore: 0.5,
            totalScore: 0.5,
            details: {
              hasIntroduction: true,
              hasClearSequence: true,
              includesAllTopics: true,
              hasDescriptiveWords: true
            }
          },
          feedback: {
            strengths: "You've made a good start with your story!",
            improvements: "Focus on adding more descriptive words to make your story come alive."
          }
        };
        return res.json({ text: JSON.stringify(fallbackResponse) });
      }

      // Generate TTS using combined feedback
      const parsedResponse = JSON.parse(jsonResponse);
      const textToSpeak = `${parsedResponse.feedback.strengths} ${parsedResponse.feedback.improvements}`;

      const command = new SynthesizeSpeechCommand({
        Engine: 'neural',
        OutputFormat: 'mp3',
        Text: textToSpeak,
        VoiceId: 'Zhiyu',
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
        revision: {
          ideaScore: 0,
          detailScore: 0,
          organizationScore: 0,
          totalScore: 0,
          details: {
            hasIntroduction: false,
            hasClearSequence: false,
            includesAllTopics: false,
            hasDescriptiveWords: false
          }
        },
        feedback: {
          strengths: "You've started writing your story, which is great!",
          improvements: "Focus on adding more details to your story"
        }
      };
      res.status(200).json({ text: JSON.stringify(errorResponse) });
    }
  });
});