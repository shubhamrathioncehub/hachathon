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

router.post("/webhooks", function(req, res, next) {
  try {
    const agent = new WebhookClient({ request: req, response: res });

    async function checkBookingPageHandler(agent) {
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
      if (bookingPageResponse.status === 404) {
        agent.add("Invalid booking Page.");
        return agent.add(
          "Which booking page would you like to book a meeting with?"
        );
      }
      let bookingPageDetail = await bookingPageResponse.json();
      if (bookingPageDetail.userProfileObjMin.profileStatus !== 1) {
        agent.add("Invalid booking Page.");
        return agent.add(
          "Which booking page would you like to book a meeting with?"
        );
      }
      updateUserData(req.body.session, "bookingPageDetail", bookingPageDetail);
      agent.add(`When you would like to schedule meeting?`);
      agent.setContext({
        name: "bookingPage",
        lifespan: 10,
        parameters: {
          bookingPage: req.body.queryResult.parameters.bookingpagename
        }
      });
    }

    async function getTimeslotForDate(agent) {
      try {
        updateUserData(
          req.body.session,
          "date",
          req.body.queryResult.parameters.date || ""
        );

        let date = new Date(req.body.queryResult.parameters.date);
        let [yyyy, MM, dd] = date
          .toJSON()
          .slice(0, 10)
          .split("-");
        let bookingPageDetail = getUserData(req.body.session).bookingPageDetail;
        let timeslotResponse = await fetch(
          "https://starkproxy.staticso2.com/get-availability/calc-ts",
          {
            method: "POST",
            body: JSON.stringify({
              pooledType: bookingPageDetail.PooledAvailabilityType,
              timeZoneId: 122,
              userId: bookingPageDetail.userId,
              settingsId: bookingPageDetail.settingsId,
              meetmelinkid: bookingPageDetail.meetmeLinkId,
              startDate: new Date(`${MM}-${dd}-${yyyy}`).getTime(),
              endDate: new Date(`${MM}-${dd}-${yyyy} 11:59:59`).getTime(),
              serviceId: bookingPageDetail.serviceId || -1,
              teamId: bookingPageDetail.team
            }),
            headers: {
              "Content-Type": "application/json",
              Origin: "https://starkcf.staticso2.com",
              Authorization:
                "Basic " + Buffer.from("starkqa:starkqa@123").toString("base64")
            }
          }
        );

        let timeslot = await timeslotResponse.json();

        agent.add("Following are the available timeslots: ");
        let slots =
          timeslot.data.slots[
            `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
          ];
        if (slots.am.length > 0) {
          for (let i = 0; i < slots.am.length && i < 8; i++)
            agent.add(new Suggestion(slots.am[i].timeStr));
        } else {
          for (let i = 0; i < slots.pm.length && i < 8; i++)
            agent.add(new Suggestion(slots.pm[i].timeStr));
        }
      } catch (e) {
        console.log(e);
      }
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
    intentMap.set("booking page link", checkBookingPageHandler);
    intentMap.set("timeslot - date", getTimeslotForDate);
    intentMap.set("timeslot - time", getName);
    intentMap.set("booking form name", getEmail);
    intentMap.set("booking form email", bookSlot);
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
