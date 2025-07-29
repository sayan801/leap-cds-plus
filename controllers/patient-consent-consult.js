const { validateConsentDecisionHookRequest } = require("../lib/validators");
const { asCard } = require("../lib/consent-decision-card");
const { processDecision } = require("../lib/consent-processor");
const { fetchConsents } = require("../lib/consent-discovery");
const { maybeApplyDecision } = require("../lib/decision-processor");
const logger = require("../lib/logger");

async function post(req, res, next) {
  try {
    logger.info("🔵 Incoming POST /cds-services/patient-consent-consult");
    logger.info("🔵 Hook payload:", JSON.stringify(req.body, null, 2));

    validateConsentDecisionHookRequest(req);

    const patientIds = req.body.context.patientId;
    const category = req.body.context.category || [];
    const content = req.body.context.content;

    logger.info("🟢 Patient IDs:", JSON.stringify(patientIds));
    logger.info("🟢 Category:", JSON.stringify(category));
    logger.info("🟢 Content:", JSON.stringify(content));

    const consentsBundle = await fetchConsents(patientIds, category);
    logger.info("🟢 Consents bundle:", JSON.stringify(consentsBundle, null, 2));

    const decisionEntry = await processDecision(consentsBundle, req.body.context);
    logger.info("🟢 Decision entry:", JSON.stringify(decisionEntry, null, 2));

    const revisedEntry = maybeApplyDecision(decisionEntry, content);
    logger.info("🟢 Revised entry:", JSON.stringify(revisedEntry, null, 2));

    logger.debug(`Request: ${req.body.hookInstance}, Consents: ${consentsBundle.map(
      ({ fullUrl }) => fullUrl
    )}, Decision: ${JSON.stringify(revisedEntry)}`);

    res.send({
      cards: [asCard(revisedEntry)]
    });

  } catch (e) {
    logger.error("❌ Error in patient-consent-consult hook:", e);
    next(e);
  }
}

module.exports = {
  post
};
