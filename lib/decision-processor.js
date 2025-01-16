const { CONSENT_PERMIT } = require("./consent-decisions");
const { maybeRedactBundle } = require("./redacter");

const maybeApplyDecision = (decisionEntry, content) => {
  return content && decisionEntry.decision === CONSENT_PERMIT
    ? {
        ...decisionEntry,
        content: maybeRedactBundle(decisionEntry.obligations, content)
      }
    : decisionEntry;
};
module.exports = { maybeApplyDecision };
