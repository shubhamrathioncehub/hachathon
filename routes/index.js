var express = require('express');
var router = express.Router();

const fetch = require('node-fetch');

/* GET home page. */
router.get('/getLandingPage', async function(req, res, next) {
  let res1 = await fetch('https://starkproxy.staticso2.com/get-data/GetLandingPageLayout', { method: 'POST',
  body: JSON.stringify({ linkName: req.query.linkName || '' }),
  headers: { 'Content-Type': 'application/json' } })
  let res1_1 = await res1.json();
  let settingsId = res1_1.settingsId;

  let res2_1 = await fetch('https://starkproxy.staticso2.com/get-data/GetServiceDetail', { method: 'POST',
  body: JSON.stringify({ settingsId }),
  headers: { 'Content-Type': 'application/json' } });
  let res2_2 = await res2_1.json();
  let result = res2_2.serviceDetails.map(val => {
    return {
      serviceName: val.serviceName,
      serviceDuration: val.serviceDuration
    }
  });
  res.status(200).json(result);
});

module.exports = router;
