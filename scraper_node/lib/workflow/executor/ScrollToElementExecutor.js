async function ScrollToElementExecutor(environment) {
  try {
    const selector = environment.getInput('Selector');
    if (!selector) {
      environment.log.error('input -> selector is not defined');
      return false;
    }

    await environment.getPage().evaluate((sel) => {
      const element = document.querySelector(sel);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, selector);

    // Wait a bit for scroll to complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    return true;
  } catch (error) {
    environment.log.error(error.message);
    return false;
  }
}

module.exports = ScrollToElementExecutor;

