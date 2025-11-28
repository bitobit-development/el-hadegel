import { config } from 'dotenv';
config();

const API_URL = 'http://localhost:3000/api/news-posts';
const API_KEY = 'test-api-key-dev-2024';

async function addSampleTweet() {
  console.log('📱 Adding sample tweet from Boaz Bismuth...\n');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'ציוץ של בועז ביסמוט על חוק הגיוס',
        sourceUrl: 'https://x.com/BismuthBoaz/status/1994107335783141520',
        sourceName: 'X (Twitter)',
      }),
    });

    const result = await response.json();

    if (response.status === 201) {
      console.log('✅ Successfully created post!');
      console.log('\nPost Details:');
      console.log('━'.repeat(50));
      console.log(`ID: ${result.data.id}`);
      console.log(`Content: ${result.data.content}`);
      console.log(`Source: ${result.data.sourceUrl}`);
      console.log(`Preview Title: ${result.data.previewTitle || 'N/A'}`);
      console.log(`Preview Image: ${result.data.previewImage || 'N/A'}`);
      console.log(`Preview Description: ${result.data.previewDescription || 'N/A'}`);
      console.log('━'.repeat(50));
      console.log('\n🎉 Sample tweet added! Check your landing page at http://localhost:3000');
    } else {
      console.error('❌ Failed to create post');
      console.error(`Status: ${response.status}`);
      console.error('Response:', result);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addSampleTweet();
