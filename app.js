var express = require("express");
var cookieParser = require("cookie-parser");
var fs = require("fs");
var fetch = require("node-fetch");
var cors = require("cors");
var indexRouter = require("./routes/index");

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use("/", indexRouter);
app.use(cors());
app.use("/get-data/GetLandingPageLayout", async (req, res) => {
  try {
    let bookingPageResponse = await fetch(
      "https://starkproxy.staticso2.com/get-data/GetLandingPageLayout",
      {
        method: "POST",
        body: JSON.stringify({
          linkName: req.body.linkName || ""
        }),
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " + Buffer.from("starkqa:starkqa@123").toString("base64")
        }
      }
    );
    let bookingPageDetail = await bookingPageResponse.json();
    bookingPageDetail.userProfileObjMin.profileStatus = 1;
    res.json(bookingPageDetail);
  } catch (e) {
    next(e);
  }
});

app.all("/:link", async (req, res) => {
  try {
    const htmlResponse = await fetch(
      "https://starkcf.staticso2.com/" + req.params.link,
      {
        headers: {
          Authorization:
            "Basic " + Buffer.from("starkqa:starkqa@123").toString("base64")
        }
      }
    );

    if (htmlResponse.status !== 200) {
      res.end("Something went wrong");
    }

    const html = await htmlResponse.text();
    const replacedHtml = html.replace(
      /https\:\/\/cdnstark\.azureedge\.net\/versions\/bundle\.[a-z0-9]+\.js/,
      "https://oncehacktest.s3.amazonaws.com/bundle.cc195eea.js"
    );
    res.setHeader("content-type", "text/html");
    res.end(replacedHtml);
  } catch (e) {
    console.log(e);
    res.end("testing");
  }
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500).json(err);
});

module.exports = app;
