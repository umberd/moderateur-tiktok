// fetchOpenAICosts.js
// Script to fetch OpenAI organization costs

// Option 1: Using built-in https module
const https = require('https');

// Replace with your actual API key
const OPENAI_ADMIN_KEY = process.env.OPENAI_ADMIN_KEY;

// Calculate yesterday's date in Unix timestamp format (seconds)
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const startTime = Math.floor(yesterday.getTime() / 1000);
const limit = 1;

// Configure the request options
const options = {
  hostname: 'api.openai.com',
  path: `/v1/organization/costs?start_time=${startTime}&limit=${limit}`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${OPENAI_ADMIN_KEY}`,
    'Content-Type': 'application/json'
  }
};

// Make the request
const req = https.request(options, (res) => {
  let data = '';

  // A chunk of data has been received
  res.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received
  res.on('end', () => {
    console.log('Response status:', res.statusCode);
    console.log('Response headers:', res.headers);
    console.log('Using start_time (yesterday):', startTime, '=', new Date(startTime * 1000).toISOString());
    try {
      const parsedData = JSON.parse(data);
      console.log('Response data:', JSON.stringify(parsedData, null, 2));
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      console.log('Raw response:', data);
    }
  });
});

// Handle errors
req.on('error', (error) => {
  console.error('Error making request:', error);
});

// End the request
req.end();

/* 
// Option 2: Using axios (more modern and easier to use)
// First install axios: npm install axios

const axios = require('axios');

// Replace with your actual API key
const OPENAI_ADMIN_KEY = process.env.OPENAI_ADMIN_KEY;

// Calculate yesterday's date in Unix timestamp format (seconds)
// const yesterday = new Date();
// yesterday.setDate(yesterday.getDate() - 1);
// const startTime = Math.floor(yesterday.getTime() / 1000);

// Make the request
async function fetchOpenAICosts() {
  try {
    const response = await axios.get('https://api.openai.com/v1/organization/costs', {
      params: {
        start_time: startTime, // Using the same startTime variable from above
        limit: 1
      },
      headers: {
        'Authorization': `Bearer ${OPENAI_ADMIN_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Using start_time (yesterday):', startTime, '=', new Date(startTime * 1000).toISOString());
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

fetchOpenAICosts();
*/ 