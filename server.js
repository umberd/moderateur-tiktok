require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { TikTokConnectionWrapper, getGlobalConnectionCount } = require('./connectionWrapper');
const { clientBlocked } = require('./limiter');
const { OpenAI } = require('openai');
const axios = require('axios');
const db = require('./db'); // Import our database module

const app = express();
const httpServer = createServer(app);

// Default Ollama settings
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: "dummy-key",
});

// Enable cross origin resource sharing
const io = new Server(httpServer, {
    cors: {
        origin: '*'
    }
});

// Initialize database
db.initDatabase()
    .then(() => {
        console.log('Database initialized successfully');
    })
    .catch(err => {
        console.error('Error initializing database:', err);
    });

// Function to get available Ollama models
async function getOllamaModels() {
    try {
        const response = await axios.get(`${OLLAMA_HOST}/api/tags`);
        return response.data.models || [];
    } catch (error) {
        console.error('Error fetching Ollama models:', error);
        return [];
    }
}

// Function to moderate text using OpenAI
async function moderateText(text, apiKey = null) {
    try {
        // Use provided API key or fall back to environment variable
        const openaiClient = apiKey ? 
            new OpenAI({ apiKey }) : 
            openai;
            
        const response = await openaiClient.moderations.create({
            model: "text-moderation-latest",
            input: text,
        });
        
        return response.results[0];
    } catch (error) {
        console.error('Error during OpenAI moderation:', error);
        return null;
    }
}

// Function to moderate text using Ollama
async function moderateTextWithOllama(text, model = 'llama3') {
    try {
        const moderationPrompt = `
You are a content moderation system. Analyze the following message and determine if it contains harmful content.
Any type of insult or racism or patriotism or misgenderation or any other type of discrimination is harmful content.
Be really sensitive to everything related to sex, gender, race, religion, etc.
Examples of harmful content:
"France aux Français" is harassment at 0.6.
"La France aux Arabes" is harassment at 0.6.
"La France aux Africains" is harassment at 0.6.
"La France aux Asiatiques" is harassment at 0.6.
"La France aux Européens" is harassment at 0.6.
"La France aux Américains" is harassment at 0.6.

if any harmful content is included in the message, flag it as true.
Don't think. in the think process, you just write "ok"
I want to make sure everything is super safe.
You speak french, so don't translate the message.
Please respond in XML format using these tags and only these tags:
<flagged>true/false</flagged>
<reason>Specify the reason if flagged, such as: harassment, hate_speech, sexual, violence, self_harm, illegal_activity</reason>
<category_scores>0.0 to 1.0 indicating severity</category_scores>
`;

        const response = await axios.post(`${OLLAMA_HOST}/v1/chat/completions`, {
            model: model,
            messages: [
                { role: "system", content: moderationPrompt },
                { role: "user", content: "Here is the message to moderate: " + text }
            ],
            max_tokens: 200,
            temperature: 0.1,
        });
        
        const content = response.data.choices[0].message.content;
        console.log(text);
        console.log(content);

        const ccontent=removeThinkingContent(content);
        
        // Parse XML response
        const flaggedMatch = ccontent.match(/<flagged>(true|false)<\/flagged>/i);
        const reasonMatch = ccontent.match(/<reason>(.*?)<\/reason>/i);
        const scoreMatch = ccontent.match(/<category_scores>(.*?)<\/category_scores>/i);
        
        const flagged = flaggedMatch ? flaggedMatch[1].toLowerCase() === 'true' : false;
        const reason = reasonMatch ? reasonMatch[1] : '';
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.0;
        
        // Create a response format similar to OpenAI's moderation
        return {
            flagged: flagged,
            categories: {
                harassment: reason.includes('harassment'),
                hate: reason.includes('hate'),
                sexual: reason.includes('sexual'),
                violence: reason.includes('violence'),
                self_harm: reason.includes('self_harm'),
                illegal: reason.includes('illegal')
            },
            category_scores: {
                harassment: reason.includes('harassment') ? score : 0,
                hate: reason.includes('hate') ? score : 0,
                sexual: reason.includes('sexual') ? score : 0,
                violence: reason.includes('violence') ? score : 0,
                self_harm: reason.includes('self_harm') ? score : 0,
                illegal: reason.includes('illegal') ? score : 0
            },
            ollama_reason: reason
        };
    } catch (error) {
        console.error('Error during Ollama moderation:', error);
        return null;
    }
}

const systemPrompt = `
Vous êtes un assistant qui réponds au chat en direct TikTok.
Vous recevrez des commentaires du chat provenant du canal en direct. Pour chaque nouvelle mise à jour du chat, vous repondrez.
Pour le nom d'utilisateur, assurez-vous de le dire d'une façon facile à prononcer.
Pour les smileys ou les emojis, prononce les simplement. un seul par message, sinon, c'est trop long.
ne dis pas plusieurs emojis par messages. c'est trop long.
Si il y a des fautes d'orthographe ou des fautes des frappes dans le message, corrige les dans ta réponse.
Si le commentaire est une question, tu réponds par une phrase courte et concise.
Si le commentaire est faux, contredit le.
Essaye de reconnaitre le sarcasme et la critique des religions.
Defends la declaration universelle des droits de l'homme, le progressisme.
Tu combats les discriminations, les racismes, les sexismes, les agissements de nature homophobe, transphobe, etc.
`;

// Function to generate a suggested response using Ollama
async function generateResponseWithOllama(text, model = 'llama3') {
    try {
        const response = await axios.post(`${OLLAMA_HOST}/v1/chat/completions`, {
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            max_tokens: 100,
            temperature: 0.7,
        });
        
        let content = response.data.choices[0].message.content;
        
        // Remove thinking tags and their content
        content = removeThinkingContent(content);
        
        return content;
    } catch (error) {
        console.error('Error generating response with Ollama:', error);
        return null;
    }
}

// Helper function to remove content within <thinking> tags
function removeThinkingContent(text) {
    if (!text) return text;
    
    const originalText = text;
    
    // Remove all content between <thinking> and </thinking> tags (case insensitive)
    let processed = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
    
    // Also handle other common thinking tag variants
    processed = processed.replace(/<think>[\s\S]*?<\/think>/gi, '');
    processed = processed.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');
    processed = processed.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
    
    // Clean up any leftover empty lines and extra spaces
    processed = processed.replace(/\n\s*\n+/g, '\n\n');
    
    // Log if thinking content was removed
    if (processed.length !== originalText.length) {
        console.log('Removed thinking content from Ollama response');
    }
    
    return processed.trim();
}

// Function to generate a suggested response using GPT-4o-mini
async function generateResponseWithOpenAI(text, apiKey = null) {
    try {
        // Use provided API key or fall back to environment variable
        const openaiClient = apiKey ? 
            new OpenAI({ apiKey }) : 
            openai;
            
        const response = await openaiClient.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: text }
            ],
            max_tokens: 100,
            temperature: 0.7,
        });
        
        return response.choices[0].message.content;
    } catch (error) {
        console.error('Error generating response with OpenAI:', error);
        return null;
    }
}

// Main function to generate a response using the selected provider
async function generateResponse(text, provider = 'openai', model = null, apiKey = null) {
    if (provider === 'ollama' && model) {
        return generateResponseWithOllama(text, model);
    } else {
        return generateResponseWithOpenAI(text, apiKey);
    }
}

io.on('connection', (socket) => {
    let tiktokConnectionWrapper;

    console.info('New connection from origin', socket.handshake.headers['origin'] || socket.handshake.headers['referer']);

    // Send available Ollama models to the client
    getOllamaModels().then(models => {
        socket.emit('ollamaModels', models);
    }).catch(error => {
        console.error('Error sending Ollama models:', error);
    });

    socket.on('setUniqueId', (uniqueId, options) => {

        // Prohibit the client from specifying these options (for security reasons)
        if (typeof options === 'object' && options) {
            delete options.requestOptions;
            delete options.websocketOptions;
            
            // Store AI provider settings in the socket object
            socket.aiProvider = options.aiProvider || 'openai';
            socket.aiModel = options.aiModel || null;
            
            // Store moderation and response settings
            socket.showModeration = options.showModeration === true;
            socket.showResponses = options.showResponses === true;
            
            // Store OpenAI API key if provided
            if (options.openaiApiKey) {
                socket.openaiApiKey = options.openaiApiKey;
                console.log('Client provided OpenAI API key');
            }
            
            console.log(`Client using AI provider: ${socket.aiProvider}${socket.aiModel ? ', model: ' + socket.aiModel : ''}`);
        } else {
            options = {};
            socket.aiProvider = 'openai';
            socket.aiModel = null;
            socket.showModeration = false;
            socket.showResponses = false;
        }

        // Session ID in .env file is optional
        if (process.env.SESSIONID) {
            options.sessionId = process.env.SESSIONID;
            console.info('Using SessionId');
        }

        // Check if rate limit exceeded
        if (process.env.ENABLE_RATE_LIMIT && clientBlocked(io, socket)) {
            socket.emit('tiktokDisconnected', 'You have opened too many connections or made too many connection requests. Please reduce the number of connections/requests or host your own server instance. The connections are limited to avoid that the server IP gets blocked by TokTok.');
            return;
        }

        // Connect to the given username (uniqueId)
        try {
            tiktokConnectionWrapper = new TikTokConnectionWrapper(uniqueId, options, true);
            tiktokConnectionWrapper.connect();
        } catch (err) {
            socket.emit('tiktokDisconnected', err.toString());
            return;
        }

        // Redirect wrapper control events once
        tiktokConnectionWrapper.once('connected', state => socket.emit('tiktokConnected', state));
        tiktokConnectionWrapper.once('disconnected', reason => socket.emit('tiktokDisconnected', reason));

        // Notify client when stream ends
        tiktokConnectionWrapper.connection.on('streamEnd', () => socket.emit('streamEnd'));

        // Redirect message events
        tiktokConnectionWrapper.connection.on('roomUser', msg => socket.emit('roomUser', msg));
        tiktokConnectionWrapper.connection.on('member', msg => socket.emit('member', msg));
        
        // Handle chat messages with moderation
        tiktokConnectionWrapper.connection.on('chat', async (msg) => {
            // Send message immediately
            const initialMsg = { ...msg, pendingModeration: true, pendingResponse: true };
            socket.emit('chat', initialMsg);
            
            // Apply moderation to comment based on provider
            if (msg.comment) {                
                if (socket.showModeration && socket.aiProvider === 'ollama' && socket.aiModel) {
                    const moderationResult = await moderateTextWithOllama(msg.comment, socket.aiModel);
                    if (moderationResult) {
                        msg.moderation = moderationResult;
                        //console.log('Moderation result');
                        
                        // Log flagged content to server console
                        if (moderationResult.flagged) {
                            console.log('\nFlagged comment (Ollama):', msg.comment);
                            console.log('Reason:', moderationResult.ollama_reason);
                        }
                    } else {
                        console.log('No moderation result');
                    }
                } else if (socket.showModeration && (socket.openaiApiKey || process.env.OPENAI_API_KEY)) {
                    console.log('Moderation with OpenAI');
                    console.log(msg.comment);
                    const moderationResult = await moderateText(msg.comment, socket.openaiApiKey || process.env.OPENAI_API_KEY);
                    //console.log(moderationResult);
                    if (moderationResult) {
                        msg.moderation = moderationResult;
                        
                        // Log flagged content to server console
                        if (moderationResult.flagged) {
                            console.log('\nFlagged comment (OpenAI):', msg.comment);
                            console.log('Flagged categories:');
                            for (const [category, value] of Object.entries(moderationResult.categories)) {
                                if (value) {
                                    console.log(`${category}: ${moderationResult.category_scores[category].toFixed(3)}`);
                                }
                            }
                        }
                    }
                }
                
                // Send moderation update
                msg.pendingModeration = false;
                socket.emit('chatUpdate', { id: msg.msgId, type: 'moderation', data: msg });
            }
            
            // Generate a suggested response using the selected provider and model
            try {
                //console.log(msg);
                if (socket.showResponses) {
                    //console.log('Generating response');
                    let theMessage=msg.nickname + ' à dit : "' + msg.comment + '"';
                    // if msg comment start with @[username] make nickname à écrit à [username] : comment
                    if (msg.comment.startsWith('@')) {
                        const username = msg.comment.slice(1);
                        theMessage = msg.nickname + ' à écrit à ' + username + ' : ' + msg.comment;
                    }
                    const suggestedResponse = await generateResponse(
                        theMessage, 
                        socket.aiProvider, 
                        socket.aiModel, 
                        socket.openaiApiKey || process.env.OPENAI_API_KEY
                    );
                    if (suggestedResponse) {
                        msg.suggestedResponse = suggestedResponse;

                        //console.log(msg.suggestedResponse);
                    }
                }
            } catch (error) {
                console.error('Error generating response:', error);
            }
            
            // Send response update
            msg.pendingResponse = false;
            socket.emit('chatUpdate', { id: msg.msgId, type: 'response', data: msg });
        });
        
        tiktokConnectionWrapper.connection.on('gift', msg => socket.emit('gift', msg));
        tiktokConnectionWrapper.connection.on('social', msg => socket.emit('social', msg));
        tiktokConnectionWrapper.connection.on('like', msg => socket.emit('like', msg));
        tiktokConnectionWrapper.connection.on('questionNew', msg => socket.emit('questionNew', msg));
        tiktokConnectionWrapper.connection.on('linkMicBattle', msg => socket.emit('linkMicBattle', msg));
        tiktokConnectionWrapper.connection.on('linkMicArmies', msg => socket.emit('linkMicArmies', msg));
        tiktokConnectionWrapper.connection.on('liveIntro', msg => socket.emit('liveIntro', msg));
        tiktokConnectionWrapper.connection.on('emote', msg => socket.emit('emote', msg));
        tiktokConnectionWrapper.connection.on('envelope', msg => socket.emit('envelope', msg));
        tiktokConnectionWrapper.connection.on('subscribe', msg => socket.emit('subscribe', msg));

        // Add a new function to handle room state data
        socket.on('getUserStatus', async (tiktokId) => {
            try {
                // Get user's status in lists
                const isFriend = await db.isUserFriend(tiktokId);
                const undesirableStatus = await db.isUserUndesirable(tiktokId);
                
                socket.emit('userStatus', {
                    tiktokId,
                    isFriend,
                    ...undesirableStatus
                });
            } catch (error) {
                console.error('Error getting user status:', error);
            }
        });
    });

    socket.on('disconnect', () => {
        if (tiktokConnectionWrapper) {
            tiktokConnectionWrapper.disconnect();
        }
    });
});

// Emit global connection statistics
setInterval(() => {
    io.emit('statistic', { globalConnectionCount: getGlobalConnectionCount() });
}, 2000)

// Serve frontend files
app.use(express.static('public'));

// Add middleware to parse JSON
app.use(express.json());

// Define API routes for user lists
app.get('/api/users/friends', async (req, res) => {
    try {
        const friends = await db.getAllFriends();
        res.json(friends);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'Failed to fetch friends' });
    }
});

app.get('/api/users/undesirables', async (req, res) => {
    try {
        const undesirables = await db.getAllUndesirables();
        res.json(undesirables);
    } catch (error) {
        console.error('Error fetching undesirables:', error);
        res.status(500).json({ error: 'Failed to fetch undesirables' });
    }
});

app.get('/api/users/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const users = await db.searchUsers(query);
        res.json(users);
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});

app.post('/api/users/friends', async (req, res) => {
    try {
        const { tiktokId, nickname } = req.body;
        if (!tiktokId || !nickname) {
            return res.status(400).json({ error: 'TikTok ID and nickname are required' });
        }
        const added = await db.addToFriends(tiktokId, nickname);
        res.json({ success: true, added });
    } catch (error) {
        console.error('Error adding friend:', error);
        res.status(500).json({ error: 'Failed to add friend' });
    }
});

app.post('/api/users/undesirables', async (req, res) => {
    try {
        const { tiktokId, nickname, reason } = req.body;
        if (!tiktokId || !nickname) {
            return res.status(400).json({ error: 'TikTok ID and nickname are required' });
        }
        const added = await db.addToUndesirables(tiktokId, nickname, reason || '');
        res.json({ success: true, added });
    } catch (error) {
        console.error('Error adding undesirable:', error);
        res.status(500).json({ error: 'Failed to add undesirable' });
    }
});

app.delete('/api/users/friends/:tiktokId', async (req, res) => {
    try {
        const { tiktokId } = req.params;
        const removed = await db.removeFromFriends(tiktokId);
        res.json({ success: true, removed });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
});

app.delete('/api/users/undesirables/:tiktokId', async (req, res) => {
    try {
        const { tiktokId } = req.params;
        const removed = await db.removeFromUndesirables(tiktokId);
        res.json({ success: true, removed });
    } catch (error) {
        console.error('Error removing undesirable:', error);
        res.status(500).json({ error: 'Failed to remove undesirable' });
    }
});

// Start http listener
const port = 8081;
httpServer.listen(port);
console.info(`Server running! Please visit http://localhost:${port}`);