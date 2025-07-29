// Load environment variables first
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");

// Add debug logs at the very top
console.log('=== DEBUG: Environment Variables ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('CONSENT_FHIR_SERVERS:', process.env.CONSENT_FHIR_SERVERS);
console.log('CONSENT_FHIR_SERVERS_AUTH:', process.env.CONSENT_FHIR_SERVERS_AUTH);
console.log('====================================');

const { ping } = require("./controllers/ping");
const { error } = require("./controllers/error");
const { discovery } = require("./controllers/discovery");
const ConsentDecisionHook = require("./controllers/patient-consent-consult");
const Xacml = require("./controllers/xacml");

const app = express();

//trust proxy
app.set("trust proxy", true);

//middlewares
process.env.NODE_ENV === "production" || app.use(morgan("dev"));
app.use(bodyParser.json({ type: "application/json" }));

// Add CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

//routes
app.get("/ping", ping);

app.get("/cds-services", discovery);

app.post("/cds-services/patient-consent-consult", ConsentDecisionHook.post);
app.post("/xacml", Xacml.post);

app.use(error);

module.exports = {
  app
};