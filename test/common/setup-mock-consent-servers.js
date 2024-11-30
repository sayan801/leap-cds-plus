const _ = require("lodash");
const nock = require("nock");

const CONSENT_FHIR_SERVERS = (process.env.CONSENT_FHIR_SERVERS || "")
  .split(",")
  .map((res) => res.trim());

const EMPTY_BUNDLE = require("../fixtures/empty-bundle.json");
const PATIENT = require("../fixtures/patients/patient-boris.json");

const MOCK_FHIR_SERVERS = CONSENT_FHIR_SERVERS.map((fhirBase) =>
  nock(fhirBase)
    .defaultReplyHeaders({ "Content-Type": "application/json; charset=utf-8" })
    .replyContentLength()
);

function setupMockOrganization(url, organizationResource, howManyRequests) {
  const numberOfTimes = howManyRequests || 1;
  MOCK_FHIR_SERVERS[0]
    .get(url)
    .times(numberOfTimes)
    .reply(200, organizationResource);
}

function setupMockAuditEndpoint(howManyRequests) {
  const numberOfTimes = howManyRequests || 1;
  MOCK_FHIR_SERVERS[0].post("/AuditEvent").times(numberOfTimes).reply(200);
}

function setupMockPractitioner(url, practitionerResource, howManyRequests) {
  const numberOfTimes = howManyRequests || 1;
  MOCK_FHIR_SERVERS[0]
    .get(url)
    .times(numberOfTimes)
    .reply(200, practitionerResource);
}

function setupMockConsent(consent, index, patientIdentifier) {
  const fhirServerIndex = index || 0;
  const { system, value } = patientIdentifier || {
    system: "http://hl7.org/fhir/sid/us-medicare",
    value: "0000-000-0000"
  };

  const CONSENT_RESULTS_BUNDLE = consent
    ? _.set(
        _.set(
          _.set(
            _.clone(EMPTY_BUNDLE),
            "entry[0].resource",
            _.set(consent, "id", "1")
          ),
          "entry[0].fullUrl",
          `${CONSENT_FHIR_SERVERS[0]}/Consent/1`
        ),
        "total",
        1
      )
    : EMPTY_BUNDLE;

  MOCK_FHIR_SERVERS[fhirServerIndex]
    .get(`/Consent?patient.identifier=${system}|${value}`)
    .reply(200, CONSENT_RESULTS_BUNDLE);

  for (var i = 0; i < MOCK_FHIR_SERVERS.length; i++) {
    if (i == fhirServerIndex) continue;
    MOCK_FHIR_SERVERS[i]
      .get(`/Consent?patient.identifier=${system}|${value}`)
      .reply(200, EMPTY_BUNDLE);
  }
}

module.exports = {
  setupMockConsent,
  setupMockOrganization,
  setupMockPractitioner,
  setupMockAuditEndpoint,
  MOCK_FHIR_SERVERS,
  CONSENT_FHIR_SERVERS
};
