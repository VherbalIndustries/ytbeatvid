const axios = require('axios');

const WEAVIATE_URL = 'http://localhost:8080';

async function queryMemory(searchText) {
  try {
    const response = await axios.post(`${WEAVIATE_URL}/v1/graphql`, {
      query: `{
        Get {
          Memory(
            limit: 10,
            where: {
              path: ["text"],
              operator: ContainsAny,
              valueText: ["${searchText}"]
            }
          ) {
            text
            tags
          }
        }
      }`
    });
    return response.data.data.Get.Memory || [];
  } catch (error) {
    console.error('Memory query error:', error);
    return [];
  }
}

async function storeMemory(text, tags = []) {
  try {
    const response = await axios.post(`${WEAVIATE_URL}/v1/batch/objects`, {
      objects: [{
        class: 'Memory',
        properties: {
          text,
          tags: [...tags, 'ytbeatvid', new Date().toISOString().split('T')[0]]
        }
      }]
    });
    return response.data[0];
  } catch (error) {
    console.error('Memory store error:', error);
    return null;
  }
}

async function checkMemoryForSolution(problemDescription) {
  const memories = await queryMemory(problemDescription);
  if (memories.length > 0) {
    console.log(`Found ${memories.length} relevant memories:`);
    memories.forEach(m => {
      console.log(`- ${m.text.substring(0, 100)}...`);
      console.log(`  Tags: ${m.tags.join(', ')}`);
    });
  }
  return memories;
}

module.exports = {
  queryMemory,
  storeMemory,
  checkMemoryForSolution
};