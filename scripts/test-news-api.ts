import { config } from 'dotenv';
config();

const API_URL = 'http://localhost:3000/api/news-posts';
const API_KEY = 'test-api-key-dev-2024'; // Use existing test key

async function testNewsPostAPI() {
  console.log('🧪 Testing News Posts API...\n');

  // Test 1: Real news site (Ynet)
  console.log('Test 1: Creating post with Ynet URL');
  const ynetPost = await createPost({
    content: 'כתבה חדשה על חוק הגיוס מידיעות אחרונות',
    sourceUrl: 'https://www.ynet.co.il',
    sourceName: 'ידיעות אחרונות',
  });
  console.log('✅ Response:', JSON.stringify(ynetPost, null, 2));

  // Test 2: GitHub (has OG tags)
  console.log('\nTest 2: Creating post with GitHub URL (has OG tags)');
  const githubPost = await createPost({
    content: 'דוגמה עם תמונת תצוגה מקדימה מגיטהאב',
    sourceUrl: 'https://github.com',
  });
  console.log('✅ Response:', JSON.stringify(githubPost, null, 2));

  // Test 3: YouTube video
  console.log('\nTest 3: Creating post with YouTube URL');
  const youtubePost = await createPost({
    content: 'סרטון על חוק הגיוס',
    sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  });
  console.log('✅ Response:', JSON.stringify(youtubePost, null, 2));

  // Test 4: Get all posts
  console.log('\nTest 4: Fetching all posts');
  const allPosts = await getPosts();
  console.log(`✅ Retrieved ${allPosts.data?.total || 0} posts`);
  if (allPosts.data?.posts && allPosts.data.posts.length > 0) {
    console.log('First post preview data:');
    const firstPost = allPosts.data.posts[0];
    console.log({
      id: firstPost.id,
      content: firstPost.content.substring(0, 50) + '...',
      previewTitle: firstPost.previewTitle,
      previewImage: firstPost.previewImage?.substring(0, 50) + '...',
      previewSiteName: firstPost.previewSiteName,
    });
  }

  // Test 5: Invalid URL (should fail)
  console.log('\nTest 5: Testing with invalid URL (should fail)');
  const invalidPost = await createPost({
    content: 'תוכן חדש',
    sourceUrl: 'not-a-valid-url',
  });
  console.log('❌ Expected error:', invalidPost.error || invalidPost);

  // Test 6: Too short content (should fail)
  console.log('\nTest 6: Testing with content too short (should fail)');
  const shortPost = await createPost({
    content: 'קצר',
    sourceUrl: 'https://www.example.com',
  });
  console.log('❌ Expected error:', shortPost.error || shortPost);

  console.log('\n✅ All tests completed!');
}

async function createPost(data: any) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function getPosts() {
  try {
    const response = await fetch(`${API_URL}?limit=10`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });
    return await response.json();
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

testNewsPostAPI().catch(console.error);
