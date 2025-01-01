const { codesIntersection } = require("./codes");
const { identifiersIntersection } = require("./identifiers");

const superagent = require("superagent");
const { maybeAddAuth } = require("../lib/auth");

const {
  PURPOSE_OF_USE_SYSTEM,
  CONSENT_OBLIGATIONS
} = require("./consent-valuesets");

const { CONSENT_PERMIT, CONSENT_DENY } = require("./consent-decisions");

function matchPurposeOfUse(provision, query) {
  const untrimmedPurposes = provision?.purpose
    ? [provision?.purpose].flat()
    : [];
  const untrimmedQueriedPurposes = query?.purposeOfUse
    ? [query.purposeOfUse].flat()
    : [];

  const purposes = untrimmedPurposes
    .map(({ system, code }) => ({ system, code }))
    .filter((purpose) => purpose);

  const queriedPurposes = untrimmedQueriedPurposes.map((purpose) => ({
    system: PURPOSE_OF_USE_SYSTEM,
    code: purpose
  }));

  return (
    !query.purposeOfUse ||
    !provision?.purpose ||
    codesIntersection(queriedPurposes, purposes).length
  );
}

function matchActor(provision, query, referencedResources) {
  const provisionActors = provision.actor || [];
  const actorResources = provisionActors
    .map(({ reference }) => reference?.reference)
    .map((actorReference) => referencedResources[actorReference]);

  const allActorIdentifiers = actorResources
    .map((resource) => resource.identifier)
    .flat();

  const queryActorIds = query.actor;

  const matchingIdentifiers = identifiersIntersection(
    allActorIdentifiers,
    queryActorIds
  );

  return !provision.actor || matchingIdentifiers.length > 0;
}

function matchClass(provision, query) {
  const untrimmedProvisionClasses = provision.class || [];
  const untrimmedQueryClasses = query.class || [];

  const provisionClasses = untrimmedProvisionClasses.map(
    ({ system, code }) => ({ system, code })
  );
  const queryClasses = untrimmedQueryClasses.map(({ system, code }) => ({
    system,
    code
  }));

  const matchingClasses = codesIntersection(provisionClasses, queryClasses);

  return !provision.class || !query.class || matchingClasses.length > 0;
}

function processProvision(provision, referencedResources, query, overarchingDecision) {
  if (!provision) {
    return {
      match: false,
      obligations: []
    };
  }

  const match =
    matchPurposeOfUse(provision, query) &&
    matchClass(provision, query) &&
    matchActor(provision, query, referencedResources);

  const obligations = match
    ? determineObligations(query, overarchingDecision, provision)
    : [];

  return {
    match,
    obligations
  };
}

function determineObligations(query, decision, provision) {
  const contentClasses = provision?.class ? [provision.class].flat() : [];
  const securityLabels = provision?.securityLabel
    ? [provision.securityLabel].flat()
    : [];
  const clinicalCodes = provision?.code?.coding
    ? [provision?.code?.coding].flat()
    : [];

  const allCodes = [...securityLabels, ...contentClasses, ...clinicalCodes]
    .filter((entry) => entry)
    .map(({ system, code }) => ({ system, code }));

  const obligation =
    decision === CONSENT_PERMIT
      ? CONSENT_OBLIGATIONS.CODES.EXCEPT(allCodes)
      : decision === CONSENT_DENY
        ? CONSENT_OBLIGATIONS.CODES.ONLY(allCodes)
        : null;

  return allCodes.length && obligation ? [obligation] : [];
}

module.exports = {
  processProvision,
  matchPurposeOfUse
};
