var express = require("express");
var router = express.Router();
var { WebhookClient } = require("dialogflow-fulfillment");
const { Card, Suggestion } = require("dialogflow-fulfillment");
const fetch = require("node-fetch");

const userData = {};

function updateUserData(sessionId, key, value) {
  if (!userData[sessionId]) userData[sessionId] = {};
  userData[sessionId][key] = value;
}

function getUserData(sessionId) {
  return userData[sessionId] || null;
}

function deleteUserData(sessionId) {
  if (!userData[sessionId]) delete userData[sessionId];
}

router.post("/webhooks", async function(req, res, next) {
  try {
    console.log("******************************");
    console.log("session: ", req.body.session);
    console.log("responseId: ", req.body.responseId);
    console.log("queryResult: ", req.body.queryResult);
    console.log("******************************");

    let bookingPageResponse = await fetch(
      "https://starkproxy.staticso2.com/get-data/GetLandingPageLayout",
      {
        method: "POST",
        body: JSON.stringify({
          linkName: req.body.queryResult.parameters.bookingpagename || ""
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " + Buffer.from("starkqa:starkqa@123").toString("base64")
        }
      }
    );
    let bookingPageDetail = await bookingPageResponse.json();
    const agent = new WebhookClient({ request: req, response: res });

    function checkBookingPageHandler(agent) {
      updateUserData(
        req.body.session,
        "bookingpagename",
        req.body.queryResult.parameters.bookingpagename || "Booking Page Name"
      );
      agent.add(`When you would like to schedule meeting?`);
      agent.setContext({
        name: "bookingPage",
        lifespan: 10,
        parameters: {
          bookingPage: req.body.queryResult.parameters.bookingpagename
        }
      });
    }

    function getTimeslotForDate(agent) {
      updateUserData(
        req.body.session,
        "date",
        req.body.queryResult.parameters.date || ""
      );
      agent.add("Following are the available timeslots: ");
      agent.add(new Suggestion(`4:00 AM`));
      agent.add(new Suggestion(`5:00 AM`));
      agent.add(new Suggestion(`6:00 AM`));
    }

    function getName(agent) {
      updateUserData(
        req.body.session,
        "name",
        req.body.queryResult.parameters.any || "User Name"
      );
      agent.add("Please tell me your name");
    }

    function getEmail(agent) {
      updateUserData(
        req.body.session,
        "email",
        req.body.queryResult.parameters.any || "User Email"
      );
      agent.add("Please tell me your email");
    }

    function preparePostData(data) {
      return {
        name: data.name,
        message: data.message,
        timezone: data.timezone,
        email: data.email,
        subject: `meeting with ${name}`,
        duration: data.duration,
        meetingtimes: data.meetingtimes,
        postBuffer: data.postBuffer,
        preBuffer: data.preBuffer,
        meetinglowerboundary: data.meetinglowerboundary,
        meetingupperboundary: data.meetingupperboundary,
        customfield: data.customfield
      };
    }

    function createPostdata() {
      return {
        postData: preparePostData(),
        sid: data.sid,
        userId: data.userId,
        meetmeLinkId: data.meetmeLinkId,
        serviceId: -1,
        serviceCategoryId: "",
        bookingPageCategoryId: "",
        IFParams: {},
        salesForceBooking: null,
        bid: null,
        sn: -1,
        themeId: themeId,
        e: false,
        categorySkippedStatus: -1,
        OneTimeLinkId: null
      };
    }

    function bookSlot(agent) {
      let userData = getUserData(req.body.session);
      console.log("userData: ", userData);
      deleteUserData(req.body.session);

      // const conv = agent.conv();
      agent.add("Your slot has been booked.");
    }

    let intentMap = new Map();
    intentMap.set(
      req.body.queryResult.intent.displayName,
      req.body.queryResult.intent.displayName.includes("booking page")
        ? checkBookingPageHandler
        : (req.body.queryResult.intent.displayName,
          req.body.queryResult.intent.displayName.includes("timeslot - time"))
        ? getName
        : (req.body.queryResult.intent.displayName,
          req.body.queryResult.intent.displayName.includes("booking form name"))
        ? getEmail
        : (req.body.queryResult.intent.displayName,
          req.body.queryResult.intent.displayName.includes(
            "booking form email"
          ))
        ? bookSlot
        : getTimeslotForDate
    );
    agent.handleRequest(intentMap);
  } catch (e) {
    console.log(e);
  }
});

router.post("/timeslot", async (request, response) => {
  try {
    let bookingPageResponse = await fetch(
      "https://starkproxy.staticso2.com/get-data/calc-ts",
      {
        method: "POST",
        body: JSON.stringify({
          linkName: req.body.queryResult.parameters.bookingpagename || ""
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " + Buffer.from("starkqa:starkqa@123").toString("base64")
        }
      }
    );
    let bookingPageDetail = await bookingPageResponse.json();
    const agent = new WebhookClient({ request: req, response: res });

    function yourFunctionHandler(agent) {
      agent.add(`When you would like to schedule meeting?`);
      agent.setContext({
        name: "bookingPage",
        lifespan: 10,
        parameters: {
          bookingPage: req.body.queryResult.parameters.bookingpagename
        }
      });
    }

    let intentMap = new Map();
    intentMap.set("booking page link", yourFunctionHandler);
    agent.handleRequest(intentMap);
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
