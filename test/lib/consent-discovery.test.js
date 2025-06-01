const nock = require("nock");
const { fetchConsents } = require("../../lib/consent-discovery");

const CONSENT = require("../fixtures/consents/r4/consent-boris-optin.json");

const {
  setupMockConsent,
  MOCK_FHIR_SERVERS
} = require("../common/setup-mock-consent-servers");

afterEach(() => {
  nock.cleanAll();
});

it("make sure there is at least one FHIR Consent Server", async () => {
  expect(MOCK_FHIR_SERVERS.length).toBeGreaterThan(0);
});

it("should return an array of consents from all servers", async () => {
  expect.assertions(1);

  setupMockConsent(CONSENT);

  const consents = await fetchConsents([
    { system: "http://hl7.org/fhir/sid/us-medicare", value: "0000-000-0000" }
  ]);
  expect(consents).toHaveLength(1);
});

it("should throw an exception if consent servers don't respond.", async () => {
  expect.assertions(1);
  try {
    await fetchConsents([
      { system: "http://hl7.org/fhir/sid/us-medicare", value: "0000-000-0000" }
    ]);
  } catch (e) {
    expect(e).toMatchObject({
      error: "service_unavailable"
    });
  }
});
