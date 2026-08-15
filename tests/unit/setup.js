// React 19 requires this flag for act() to work outside a testing-library
// setup; without it every act() call logs
// "The current testing environment is not configured to support act(...)".
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
