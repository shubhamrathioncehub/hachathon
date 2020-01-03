var express = require('express');
var router = express.Router();

const fetch = require('node-fetch');

router.post('/getLandingPage', async function (req, res, next) {
  let res1_1 = await fetch('https://starkproxy.staticso2.com/get-data/GetLandingPageLayout', {
    method: 'POST',
    body: JSON.stringify({ linkName: req.body.queryResult.parameters.bookingpagename || '' }),
    headers: {
      'Content-Type': 'application/json',
      "Authorization": "Basic " + Buffer.from("starkqa:starkqa@123").toString("base64")
    }
  })
  let res1_2 = await res1_1.json();

  let res2_1 = await fetch('https://starkproxy.staticso2.com/get-data/GetSettingsDetail', {
    method: 'POST',
    body: JSON.stringify(
      {
        "pooledType": res1_2.PooledAvailabilityType,
        "timeZoneId": 95,
        "userId": res1_2.userId,
        "settingsId": res1_2.settingsId,
        "meetmelinkid": res1_2.meetmeLinkId,
        "startDate": 1577910600000,
        "endDate": 1580581799999,
        "serviceId": res1_2.serviceId || -1,
        "teamId": res1_2.team
      }
    ),
    headers: {
      'Content-Type': 'application/json',
      "Authorization": "Basic " + Buffer.from("starkqa:starkqa@123").toString("base64")
    }
  });
  let res2_2 = await res2_1.json();
  // let result = res2_2.serviceDetails.map(val => {
  //   return {
  //     serviceName: val.serviceName,
  //     serviceDuration: val.serviceDuration
  //   }
  // });
  // return res.status(200).json(result);

  let result = {
    "fulfillmentText": "This is a text response",
    "fulfillmentMessages": [
      {
        "card": {
          "title": "card title",
          "subtitle": "card text",
          "imageUri": "https://assistant.google.com/static/images/molecule/Molecule-Formation-stop.png",
          "buttons": [
            {
              "text": "button text",
              "postback": "https://assistant.google.com/"
            }
          ]
        }
      }
    ],
    "source": "example.com",
    "payload": {
    },
    "outputContexts": [
      {
        // "name": "projects/${PROJECT_ID}/agent/sessions/${SESSION_ID}/contexts/context name",
        "name": req.body.session,
        "lifespanCount": 5,
        "parameters": {
          "param": "param value"
        }
      }
    ],
    "followupEventInput": {
      "name": "event name",
      "languageCode": "en-US",
      "parameters": {
        "param": "param value"
      }
    }
  };

  return res.status(200).json(result);
});

module.exports = router;
