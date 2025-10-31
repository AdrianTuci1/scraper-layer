async function WaitForElementExecutor(environment) {
  try {
    const selector = environment.getInput('Selector');
    if (!selector) {
      environment.log.error('input -> selector is not defined');
      return false;
    }

    const timeout = parseInt(environment.getInput('Timeout (ms)') || '30000', 10);

    await environment.getPage().waitForSelector(selector, { timeout });

    return true;
  } catch (error) {
    environment.log.error(error.message);
    return false;
  }
}

module.exports = WaitForElementExecutor;

