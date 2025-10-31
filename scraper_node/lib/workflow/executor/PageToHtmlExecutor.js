async function PageToHtmlExecutor(environment) {
  try {
    const html = await environment.getPage().content();
    environment.setOutput('HTML', html);
    return true;
  } catch (error) {
    environment.log.error(error.message);
    return false;
  }
}

module.exports = PageToHtmlExecutor;

