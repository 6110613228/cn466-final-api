const { MongoClient } = require('mongodb');
const express = require('express');
const axios = require('axios');
const mqtt = require('mqtt');

const app = express();
const PORT = process.env.PORT || 3001;

// Connection URI
const DB = process.env.DB;
const COLLECTION = process.env.COLLECTION;
const URI = process.env.MONGODB_URI;

// Create a new MongoClient
const client = new MongoClient(URI);

const WEATHER_URI = 'http://api.weatherapi.com/v1';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

//
// MQTT //
//
const mqttClient = mqtt.connect('mqtt://broker.hivemq.com');

// TOPIC
const LED_TOPIC = process.env.LED_TOPIC;

// Json body parser
app.use(express.json());

// root
app.get('/', (req, res) => {
  res.send({ msg: 'Hello, World' });
});

// get last data
app.get('/getLastData/:bid', async (req, res) => {
  try {
    await client.connect();

    const db = client.db(DB);
    const collection = db.collection(COLLECTION);

    console.log(req.params);
    const query = collection.find({ BID: parseInt(req.params.bid) });

    if ((await query.count()) === 0) {
      console.log('No documents found!');

      return res.send({ result: false, msg: 'No documents found' });
    }

    const result = await query.toArray();

    return res.send({ result: true, data: result[result.length - 1] });
  } catch (error) {
    console.log(error.message);

    return res.send({ result: false, msg: error });
  }
});

// watering
app.get('/watering', (req, res) => {
  watering();
  return res.send({ result: true, msg: 'Watering your plant.' });
});

// weather by city
app.post('/getWeatherByCity', (req, res) => {
  if (Object.keys(req.body).length === 1 && req.body.hasOwnProperty('city')) {
    axios
      .get(
        `${WEATHER_URI}/current.json?key=${WEATHER_API_KEY}&q=${req.body.city}&aqi=yes`
      )
      .then((response) => {
        return res.send(response.data);
      })
      .catch((error) => {
        console.log(error.message);
        return res.status(400).send({ result: false, msg: error.message });
      });
  } else {
    return res.status(400).send({ result: false, msg: 'Invalid body' });
  }
});

// weather by lat & long
app.post('/getWeatherByLatLong', (req, res) => {
  if (
    Object.keys(req.body).length === 1 &&
    req.body.hasOwnProperty('latlong')
  ) {
    axios
      .get(
        `${WEATHER_URI}/current.json?key=${WEATHER_API_KEY}&q=${req.body.latlong}&aqi=yes`
      )
      .then((response) => {
        return res.send(response.data);
      })
      .catch((error) => {
        console.log(error.message);
        return res.status(400).send({ result: false, msg: error.message });
      });
  } else {
    return res.status(400).send({ result: false, msg: 'Invalid body' });
  }
});

function should_water() {
  // get weather
  // get last data
  // might classified image
}

function watering() {
  let count = 0;
  const interval = setInterval(() => {
    mqttClient.publish(LED_TOPIC, 'red');
    setTimeout(() => {
      mqttClient.publish(LED_TOPIC, 'off');
    }, 1000);

    count++;
    if (count >= 20) {
      clearInterval(interval);
    }
  }, 1500);
}

// 404
app.all('*', (req, res) => {
  res.status(404).send({ message: "Can't find ypur requested URL." });
});

app.listen(PORT, () => {
  console.log(`listening at http://localhost:${PORT}`);
});
