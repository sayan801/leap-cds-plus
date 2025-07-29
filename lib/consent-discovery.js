const superagent = require("superagent");
const logger = require("../lib/logger");
const { maybeAddAuth } = require("../lib/auth");

const CONSENT_FHIR_SERVERS = (process.env.CONSENT_FHIR_SERVERS || "")
  .split(",")
  .map((res) => res.trim());

async function fetchConsents(patientIdentifiers) {
  try {
    const consentSearchQueries = CONSENT_FHIR_SERVERS.map((fhirBase) =>
      patientIdentifiers.map((patientIdentifier) =>
        resolveConsents(fhirBase, patientIdentifier)
      )
    ).flat();

    const consentSearchResults = await Promise.all(consentSearchQueries);

    return rearrangeConsentSearchResults(consentSearchResults);
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

const rearrangeConsentSearchResults = (consentSearchResults) =>
  consentSearchResults
    .map(({ body }) => searchResult(body))
    .map((searchResult, index) => ({
      ...searchResult,
      fhirBase: CONSENT_FHIR_SERVERS[Math.floor(index / CONSENT_FHIR_SERVERS.length)]
    }))
    .filter((searchResult) => searchResult.consents.length > 0);

const searchResult = (bundle) => {
  // Add null/undefined checks for bundle and bundle.entry
  if (!bundle || !bundle.entry || !Array.isArray(bundle.entry)) {
    logger.warn('Invalid bundle structure received:', bundle);
    return { consents: [], referencedResources: {} };
  }

  return bundle.entry.reduce(
    (acc, entry) => {
      // Add null check for entry and entry.resource
      if (!entry || !entry.resource) {
        return acc;
      }

      return entry.resource.resourceType === "Consent"
        ? { ...acc, consents: [...acc.consents, entry.resource] }
        : {
          ...acc,
          referencedResources: {
            ...acc.referencedResources,
            [`${entry.resource.resourceType}/${entry.resource.id}`]:
              entry.resource
          }
        };
    },
    { consents: [], referencedResources: {} }
  );
};

function resolveConsents(fhirBase, patientIdentifier) {
  const patientIdentifierQueryString = patientIdentifier.system
    ? `${patientIdentifier.system}|${patientIdentifier.value}`
    : `|${patientIdentifier.value}`;

  const patientParam = {
    "patient.identifier": patientIdentifierQueryString,
    _include: "Consent:actor"
  };

  // Add logging to see what's being queried
  console.log(`Querying ${fhirBase}/Consent with params:`, patientParam);

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