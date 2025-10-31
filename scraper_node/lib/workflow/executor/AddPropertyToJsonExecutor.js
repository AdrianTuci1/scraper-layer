async function AddPropertyToJsonExecutor(environment) {
  try {
    const jsonData = environment.getInput('JSON');
    if (!jsonData) {
      environment.log.error('input -> JSON is not defined');
      return false;
    }
    const propertyPath = environment.getInput('Property Path');

    if (!propertyPath) {
      environment.log.error('input -> Property Path is not defined');
      return false;
    }

    const value = environment.getInput('Value');

    if (!value) {
      environment.log.error('input -> Value is not defined');
      return false;
    }

    const json = JSON.parse(jsonData);

    // Support nested property paths
    const pathParts = propertyPath.split('.');
    const lastKey = pathParts.pop();
    const target = pathParts.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, json);

    // Try to parse value as JSON, otherwise use as string
    let parsedValue = value;
    try {
      parsedValue = JSON.parse(value);
    } catch (e) {
      // Keep as string
    }

    target[lastKey] = parsedValue;

    environment.setOutput('JSON', JSON.stringify(json));

    return true;
  } catch (error) {
    environment.log.error(error.message);
    return false;
  }
}

module.exports = AddPropertyToJsonExecutor;

