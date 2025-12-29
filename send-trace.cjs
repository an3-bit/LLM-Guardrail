// Minimal Datadog trace sender for onboarding
const tracer = require('dd-trace');

tracer.init({ service: 'llm-guardrail', env: 'production' });

tracer.trace('llm.test.request', { resource: 'onboarding' }, (span) => {
	span.setTag('component', 'onboarding');
	span.setTag('llm_app', 'llm-guardrail');
});

// Give the tracer a moment to flush before exit
setTimeout(() => process.exit(0), 2000);
