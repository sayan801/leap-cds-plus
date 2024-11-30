const superagent = require("superagent");
const logger = require("../lib/logger");
const { maybeAddAuth } = require("../lib/auth");

const CONSENT_FHIR_SERVERS = (process.env.CONSENT_FHIR_SERVERS || "")
  .split(",")
  .map((res) => res.trim());

const addFhirBaseToEntry = (entry, url) => ({
  ...entry,
  fhirBase: url
});

const addFhirBaseToEntries = (entries, url) =>
  entries ? entries.map((entry) => addFhirBaseToEntry(entry, url)) : [];

async function fetchConsents(patientIdentifiers) {
  try {
    const consentSearchQueries = CONSENT_FHIR_SERVERS.map((fhirBase) =>
      patientIdentifiers.map((patientIdentifier) =>
        resolveConsents(fhirBase, patientIdentifier)
      )
    ).flat();

    const fhirBasePointers = CONSENT_FHIR_SERVERS.map((fhirBase) =>
      patientIdentifiers.map(() => fhirBase)
    ).flat();

    const consentSearchResults = await Promise.all(consentSearchQueries);
    const resolvedConsents = consentSearchResults
      .map(({ body }, index) => ({
        ...body,
        entry: addFhirBaseToEntries(
          body.entry,
          fhirBasePointers[index]
        )
      }))
      .filter((body) => body?.entry?.length)
      .map((bundle) => bundle.entry)
      .flat();

    return resolvedConsents;
  } catch (e) {
    console.log(e);
    logger.warn(e);
    throw {
      httpCode: 503,
      error: "service_unavailable",
      errorMessage: `Error connecting to one of the consent services.`
    };
  }
}

function resolveConsents(fhirBase, patientIdentifier) {
  const patientParam = {
    "patient.identifier": patientIdentifier.system
      ? `${patientIdentifier.system}|${patientIdentifier.value}`
      : `|${patientIdentifier.value}`
  };

  const params = { ...patientParam };
  return maybeAddAuth(
    superagent
      .get(`${fhirBase}/Consent`)
      .query(params)
      .set({ Accept: "application/json, application/fhir+json" })
  );
}

module.exports = {
  fetchConsents
};
