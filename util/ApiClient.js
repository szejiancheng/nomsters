// Jak - gonna use expo file system here so we don't have to change environments for the photos
import * as FileSystem from 'expo-file-system';

// Define the base URL for the API
const BASE_URL = 'https://api.example.com';
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


export async function query(filename) {
    const data = await FileSystem.readAsStringAsync(filename, { encoding: FileSystem.EncodingType.Base64 });
    const response = await fetch(
      "https://api-inference.huggingface.co/models/nateraw/food",
      {
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ image: data }),
      }
    );
    const result = await response.json();
    return result;
  }
  

//stub for simulating query
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

//stub for simulating error encountered during query
async function queryErrorStub(filename) {
	const data = fs.readFileSync(filename);
	data
	await sleep(5000) //simulate API call
	throw new Error('Error in network response');
	//Jak prompt user to try again in a few seconds
}

//stub for simulating submitting a new label
async function submitNewLabelStub(filename, userLabel) {
	filename
	userLabel
	//send some post request to server saying to log this image and the new
	//label they provide, note to user that all data will be anonymous
	await sleep(2000) //simulate API call
	return
}

//stub for simulating encountering an error in submitting a new label
async function submitNewLabelErrorStub(filename, userLabel) {
	const data = fs.readFileSync(filename);
	data
	userLabel
	await sleep(2000) //simulate API call
	throw new Error('Error in network response');
	//Prompt user that data submission was unsucessful, aborting submission
}

// Utility function to simulate delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
