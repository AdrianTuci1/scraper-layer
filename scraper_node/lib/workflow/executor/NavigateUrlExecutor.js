async function NavigateUrlExecutor(environment) {
  try {
    const url = environment.getInput('URL');
    if (!url) {
      environment.log.error('input -> URL is not defined');
      return false;
    }

    await environment.getPage().goto(url);

    return true;
  } catch (error) {
    environment.log.error(error.message);
    return false;
  }
}

module.exports = NavigateUrlExecutor;

