const { TaskType } = require('../constants');
const LaunchBrowserExecutor = require('./LaunchBrowserExecutor');
const PageToHtmlExecutor = require('./PageToHtmlExecutor');
const ExtractTextFromElementExecutor = require('./ExtractTextFromElementExecutor');
const FillInputExecutor = require('./FillInputExecutor');
const ClickElementExecutor = require('./ClickElementExecutor');
const WaitForElementExecutor = require('./WaitForElementExecutor');
const DeliverViaWebHookExecutor = require('./DeliverViaWebHookExecutor');
const ExtractDataWithAiExecutor = require('./ExtractDataWithAiExecutor');
const ReadPropertyFromJsonExecutor = require('./ReadPropertyFromJsonExecutor');
const AddPropertyToJsonExecutor = require('./AddPropertyToJsonExecutor');
const NavigateUrlExecutor = require('./NavigateUrlExecutor');
const ScrollToElementExecutor = require('./ScrollToElementExecutor');

const ExecutorRegistry = {
  [TaskType.LAUNCH_BROWSER]: LaunchBrowserExecutor,
  [TaskType.PAGE_TO_HTML]: PageToHtmlExecutor,
  [TaskType.EXTRACT_TEXT_FROM_ELEMENT]: ExtractTextFromElementExecutor,
  [TaskType.FILL_INPUT]: FillInputExecutor,
  [TaskType.CLICK_ELEMENT]: ClickElementExecutor,
  [TaskType.WAIT_FOR_ELEMENT]: WaitForElementExecutor,
  [TaskType.DELIVER_VIA_WEBHOOK]: DeliverViaWebHookExecutor,
  [TaskType.EXTRACT_DATA_WITH_AI]: ExtractDataWithAiExecutor,
  [TaskType.READ_PROPERTY_FROM_JSON]: ReadPropertyFromJsonExecutor,
  [TaskType.ADD_PROPERTY_TO_JSON]: AddPropertyToJsonExecutor,
  [TaskType.NAVIGATE_URL]: NavigateUrlExecutor,
  [TaskType.SCROLL_TO_ELEMENT]: ScrollToElementExecutor,
};

module.exports = {
  ExecutorRegistry,
};

