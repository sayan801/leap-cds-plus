const Ajv = require("ajv");

const ajv = new Ajv();

const consentDecisionHookRequestSchema = require("../schemas/patient-consent-consult-hook-request.schema.json");
const consentDecisionHookRequestValidator = ajv.compile(
  consentDecisionHookRequestSchema
);

const xacmlRequestSchema = require("../schemas/xacml-request.schema.json");
const xacmlRequestValidator = ajv.compile(xacmlRequestSchema);

const validationException = (errors) => ({
  httpCode: 400,
  error: "bad_request",
  errorMessage: `Invalid request: ${prettifySchemaValidationErrors(errors)}`
});

function validateConsentDecisionHookRequest(req) {
  const body = req.body;
  if (!consentDecisionHookRequestValidator(body)) {
    throw validationException(consentDecisionHookRequestValidator.errors);
  }
}

function validateXacmlRequest(req) {
  const body = req.body;
  if (!xacmlRequestValidator(body)) {
    throw validationException(xacmlRequestValidator.errors);
  }
}


function prettifySchemaValidationErrors(givenErrors) {
  const errors = givenErrors || [];
  return errors
    .map((error) => `${error.instancePath} ${error.message}`)
    .join("; ");
}

module.exports = {
  validateConsentDecisionHookRequest,
  validateXacmlRequest
};
