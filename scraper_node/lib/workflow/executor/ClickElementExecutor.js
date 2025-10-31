async function ClickElementExecutor(environment) {
  try {
    const selector = environment.getInput('Selector');
    if (!selector) {
      environment.log.error('input -> selector is not defined');
      return false;
    }

    await environment.getPage().click(selector);

    return true;
  } catch (error) {
    environment.log.error(error.message);
    return false;
  }
}

module.exports = ClickElementExecutor;

