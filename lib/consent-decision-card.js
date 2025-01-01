
const {
  CONSENT_PERMIT,
  CONSENT_DENY,
  NO_CONSENT
} = require("./consent-decisions");

const ORG_NAME = process.env.ORG_NAME;
const ORG_URL = process.env.ORG_URL;

const DECISION_CARD = {
  NO_CONSENT: () => ({
    summary: NO_CONSENT,
    detail: "No applicable consent was found.",
    indicator: "warning",
    source: {
      label: ORG_NAME,
      url: ORG_URL
    }
  }),
  CONSENT_PERMIT: () => ({
    summary: CONSENT_PERMIT,
    detail: "There is a patient consent permitting this action.",
    indicator: "info",
    source: {
      label: ORG_NAME,
      url: ORG_URL
    }
  }),
  CONSENT_DENY: () => ({
    summary: CONSENT_DENY,
    detail: "There is a patient consent denying this action.",
    indicator: "critical",
    source: {
      label: ORG_NAME,
      url: ORG_URL
    }
  })
};

function asCard(consentDecision) {
  const { decision, obligations, content, fhirBase, id } = consentDecision;
  const card = DECISION_CARD[decision]();
  card.extension = { decision, obligations, content };
  if (decision != NO_CONSENT) {
    card.extension.basedOn = `${fhirBase}/${id}`;
  }
  return card;
}

module.exports = {
  asCard
};
