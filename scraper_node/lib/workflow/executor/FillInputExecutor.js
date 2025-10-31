async function FillInputExecutor(environment) {
  try {
    const selector = environment.getInput('Selector');
    if (!selector) {
      environment.log.error('input -> selector is not defined');
      return false;
    }

    const value = environment.getInput('Value');
    if (!value) {
      environment.log.error('input -> value is not defined');
      return false;
    }

    await environment.getPage().type(selector, value);

    return true;
  } catch (error) {
    environment.log.error(error.message);
    return false;
  }
}

module.exports = FillInputExecutor;

