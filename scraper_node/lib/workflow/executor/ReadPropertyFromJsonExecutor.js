async function ReadPropertyFromJsonExecutor(environment) {
  try {
    let jsonData = environment.getInput('JSON');
    if (!jsonData) {
      environment.log.error('input -> JSON is not defined');
      return false;
    }
    const propertyPath = environment.getInput('Property Path');

    if (!propertyPath) {
      environment.log.error('input -> Property Path is not defined');
      return false;
    }

    const json = JSON.parse(jsonData);

    // Support nested property paths like "user.name"
    const propertyValue = propertyPath.split('.').reduce((obj, key) => obj?.[key], json);

    if (propertyValue === undefined) {
      environment.log.error('Property not found');
      return false;
    }

    environment.setOutput('Property Value', JSON.stringify(propertyValue));

    return true;
  } catch (error) {
    environment.log.error(error.message);
    return false;
  }
}

module.exports = ReadPropertyFromJsonExecutor;

