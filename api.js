const { MongoClient } = require('mongodb');
const express = require('express');
const axios = require('axios');
const mqtt = require('mqtt');
const cron = require('node-cron');
const cors = require('cors');
const tf = require('@tensorflow/tfjs-node');

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

// schedule
var ID = 0;
var task = {};

// Tensorflowjs
const class_name = ['Clear', 'Cloudy', 'Night'];

var model;
async function model_init() {
  model = await tf.loadLayersModel('file://./save_model_js/model.json');
}
model_init();

// Json body parser
app.use(express.json({ limit: '30mb' }));

// CORS
app.use(cors());

// root
app.get('/', (req, res) => {
  res.send({
    Contributer: 'Poonnatuch Boonyarattanasoontorn',
    email: '6110613228@student.tu.ac.th',
  });
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

      return res.status(400).send({ result: false, msg: 'No documents found' });
    }

    const result = await query.toArray();

    return res.send({ result: true, data: result[result.length - 1] });
  } catch (error) {
    console.log(error.message);

    return res.status(400).send({ result: false, msg: error });
  }
});

// watering
app.post('/watering', (req, res) => {
  watering();
  axios
    .post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: req.body.uid,
        messages: [
          {
            type: 'text',
            text: 'Watered your plant!',
          },
        ],
      },
      {
        headers: {
          Authorization: 'Bearer ' + process.env.CHANNEL_ACC_TOKEN,
        },
      }
    )
    .then((response) => {
      return res.send({ result: true, msg: 'Watering your plant.' });
    })
    .catch((error) => {
      console.log(error.message);
      res.send({ result: false, msg: 'Fail to water your plant.' });
    });
});

// weather by city
app.post('/getWeather', async (req, res) => {
  if (Object.keys(req.body).length === 1 && req.body.hasOwnProperty('q')) {
    try {
      let result = await getWeather(req.body.q);
      return res.send(result);
    } catch (error) {
      return res.status(400).send({ result: false, msg: error.message });
    }
  } else {
    return res.status(400).send({ result: false, msg: 'Invalid body' });
  }
});

// Forecast by city
app.post('/forecast', async (req, res) => {
  if (Object.keys(req.body).length === 1 && req.body.hasOwnProperty('q')) {
    try {
      let result = await forecast(req.body.q);
      res.send(result);
    } catch (error) {
      return res.status(400).send({ result: false, msg: error.message });
    }
  } else {
    return res.status(400).send({ result: false, msg: 'Invalid body' });
  }
});

app.post('/schedule', (req, res) => {
  if (
    Object.keys(req.body).length === 1 &&
    req.body.hasOwnProperty('schedule')
  ) {
    if (cron.validate(req.body.schedule)) {
      let id = scheduleWatering(req.body.schedule);
      return res.send({ result: true, task_id: id, msg: 'Schedule is made' });
    } else {
      return res.status(400).send({ result: false, msg: 'Fail to schedule' });
    }
  } else {
    return res.status(400).send({ result: false, msg: 'Invalid body' });
  }
});

app.post('/startSchedule', (req, res) => {
  if (
    Object.keys(req.body).length === 1 &&
    req.body.hasOwnProperty('schedule_id')
  ) {
    try {
      startSchedule(req.body.schedule_id);
      return res.send({ result: true, msg: 'Schedule start' });
    } catch (error) {
      return res
        .status(400)
        .send({ result: false, msg: 'Fail to start schedule' });
    }
  } else {
    return res.status(400).send({ result: false, msg: 'Invalid body' });
  }
});

app.post('/stopSchedule', (req, res) => {
  if (
    Object.keys(req.body).length === 1 &&
    req.body.hasOwnProperty('schedule_id')
  ) {
    try {
      stopSchedule(req.body.schedule_id);
      return res.send({ result: true, msg: 'Schedule stop' });
    } catch (error) {
      return res
        .status(400)
        .send({ result: false, msg: 'Fail to stop schedule' });
    }
  } else {
    return res.status(400).send({ result: false, msg: 'Invalid body' });
  }
});

app.post('/shouldIWater', (req, res) => {
  if (
    Object.keys(req.body).length === 3 &&
    req.body.hasOwnProperty('image') &&
    req.body.hasOwnProperty('q') &&
    req.body.hasOwnProperty('bid')
  ) {
    try {
      const buffer = Buffer.from(req.body.image, 'base64');
      const ts_image = tf.node.decodeImage(buffer);
      console.log(ts_image.shape);

      Promise.all([
        predict_image(ts_image),
        forecast(req.body.q),
        getLastData(req.body.bid),
      ])
        .then((results) => {
          [predict_result, forecast_result, lastdata_result] = results;

          let msg = '';

          let score = 0;
          if (predict_result == class_name[0]) {
            score += 0.2;
          } else if (predict_result == class_name[1]) {
            score += 0.1;
          } else {
            score += 0;
          }

          let forecastday_rain_chance =
            forecast_result.forecast.forecastday[0].day.daily_chance_of_rain;

          if (forecastday_rain_chance > 0.6) {
            score += 0;
          } else if (forecastday_rain_chance > 0.3) {
            score += 0.3;
          } else {
            score += 0.5;
          }

          let humidity = lastdata_result.humidity;
          if (humidity >= 70) {
            score += 0;
          } else if (humidity >= 55) {
            score += 0.2;
          } else {
            score += 0.3;
          }

          if (score >= 0.6) {
            msg = 'You should water your plant';
          } else {
            msg = 'You should not water your plant';
          }
          return res.send({
            data: [predict_result, forecastday_rain_chance, humidity],
            score: score,
            msg: msg,
          });
        })
        .catch((error) => {
          res.status(400).send({ error: error.message });
        });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  } else {
    return res.status(400).send({ result: false, msg: 'Invalid body' });
  }
});

async function predict_image(image) {
  let resize_image = image.resizeBilinear([256, 256]);
  let expanddim_resize_image = resize_image.expandDims(0);

  console.log(expanddim_resize_image.shape);

  let predict = model.predict(expanddim_resize_image);
  let result = await predict.data();

  let tf_result = tf.tensor1d(result);
  let argMax_result = tf_result.argMax().dataSync()[0];

  console.log(argMax_result);
  return class_name[argMax_result];
}

function getLastData(bid) {
  return new Promise(async (resolve, reject) => {
    try {
      await client.connect();

      const db = client.db(DB);
      const collection = db.collection(COLLECTION);

      const query = collection.find({ BID: parseInt(bid) });

      if ((await query.count()) === 0) {
        console.log('No documents found!');
        reject(new Error('No documents found!'));
      }

      const result = await query.toArray();

      resolve(result[result.length - 1]);
    } catch (error) {
      reject(error);
    }
  });
}

function getWeather(q) {
  return new Promise((resolve, reject) => {
    axios
      .get(`${WEATHER_URI}/current.json?key=${WEATHER_API_KEY}&q=${q}&aqi=yes`)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function forecast(q) {
  return new Promise((resolve, reject) => {
    axios
      .get(
        `${WEATHER_URI}/forecast.json?key=${WEATHER_API_KEY}&q=${q}&days=1&aqi=yes&alerts=no`
      )
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function scheduleWatering(schedule) {
  try {
    task[ID] = cron.schedule(schedule, watering, {
      scheduled: true,
      timezone: 'Asia/Bangkok',
    });
    return ID++;
  } catch (error) {
    console.log(error);
    return null;
  }
}

function startSchedule(id) {
  try {
    task[id].start();
    return true;
  } catch (error) {
    throw error;
  }
}

function stopSchedule(id) {
  try {
    task[id].stop();
    return true;
  } catch (error) {
    throw error;
  }
}

function watering() {
  let count = 0;
  console.log('watering');
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
  res.status(404).send({ message: "Can't find your requested URL." });
});

app.listen(PORT, () => {
  console.log(`listening at http://localhost:${PORT}`);
});
