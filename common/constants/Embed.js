/**
 * Projects need to support multiple modes:
 *  - Default: allows all operations
 *  - Readonly: allows running, etc, but no file changes
 *  - NoSave: allows to running and file changes but not saving those
 *  (- ViewDocument: only view a document with editing but no saving)
 */
export const MODES = {
  'Default': 'Default', /* default mode */
  'Readonly': 'Readonly', /* prevents editing the embed */
  'NoSave': 'NoSave', /* disables saving for the current IDE, e. g. viewing a different document */
  'ViewDocument': 'ViewDocument', /* allows to view a different document for this embed */
  'RunMode': 'RunMode' /* disables saving for the current IDE */,
  'Unknown': 'Unknown'
};

/**
 * Possible embed types.
 */
export const EmbedTypes = {
  Sourcebox: 'sourcebox',
  Skulpt: 'skulpt'
};

/**
 * RunMode Defaults (Schnellausführung)
 */
export const RunModeDefaults = {
  id: 'EXPERIMENTAL_RUN_MODE_WITH_ID'
};

/**
 * CodeEmbed asset key for Tests.
 */
export const TESTS_KEY = 'tests';

/**
 * Possible remote actions for the IDE and the websocket connection.
 */
export const RemoteActions = {
  GetEvents: 'get-events', // get all events for the specific code embed
  SubscribeToEvents: 'subscribe', // subscribe to event feed for a specific code embed
  UnsubscribeFromEvents: 'unsubscribe', // unsubscribe from event feed
  ArchiveEventLogs: 'archive-event-logs', // hide old event logs or from previous semester (does not delete, just set a flag)
  Submission: 'submission', // student submission to teacher
  TestResult: 'testresult', // student's testresult
  GetTestResults: 'get-testresults', // get all test results for a specific code embed
  GetCodeEmbedMetadata: 'get-codeembed-metadata' // get metadata for a specific code embed
};