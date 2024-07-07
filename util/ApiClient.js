// Import expo-file-system
import * as FileSystem from 'expo-file-system';

// Define the base URL for the API
const BASE_URL = 'https://nomsters-bnmqimcuea-as.a.run.app/';
const SERVER_SECRET_KEY = '';
const USER_ID = '';

// Function to make a GET request
async function getData(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('There was a problem with the GET request:', error);
  }
}

// Function to make a POST request
async function postData(endpoint, payload) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('There was a problem with the POST request:', error);
  }
}

// Function to make a PUT request
async function updateData(endpoint, payload) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('There was a problem with the PUT request:', error);
  }
}

// Function to make a DELETE request
async function deleteData(endpoint) {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('There was a problem with the DELETE request:', error);
  }
}

// Function to query the API with an image file
export async function query(filename) {
  try {
    const data = await FileSystem.readAsStringAsync(filename, { encoding: FileSystem.EncodingType.Base64 });
    const response = await fetch("https://api-inference.huggingface.co/models/nateraw/food", {
      headers: {
        Authorization: "Bearer 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",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({ image: data }),
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error querying the API:', error);
    throw error; // Rethrow error to be handled by calling function
  }
}

// Stub for simulating query
export async function queryStub(filename) {
  await sleep(5000); // Simulate API call
  const predictions = [
    { "label": "french_onion_soup", "score": 0.2141202688217163, "calories": 100 },
    { "label": "hot_and_sour_soup", "score": 0.09142252057790756, "calories": 150 },
    { "label": "miso_soup", "score": 0.06172953546047211, "calories": 200 },
    { "label": "bread_pudding", "score": 0.04476030170917511, "calories": 250 },
    { "label": "chicken_curry", "score": 0.02886212430894375, "calories": 300 }
  ];
  return predictions;
}

// Stub for simulating error encountered during query
export async function queryErrorStub(filename) {
  await sleep(5000); // Simulate API call
  throw new Error('Error in network response');
}

// Stub for simulating submitting a new label
async function submitNewLabelStub(filename, userLabel) {
  // Simulate API call
  await sleep(2000);
  return;
}

// Stub for simulating encountering an error in submitting a new label
async function submitNewLabelErrorStub(filename, userLabel) {
  await sleep(2000); // Simulate API call
  throw new Error('Error in network response');
}

// Utility function to simulate delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { getData, postData, updateData, deleteData, submitNewLabelStub, submitNewLabelErrorStub };
