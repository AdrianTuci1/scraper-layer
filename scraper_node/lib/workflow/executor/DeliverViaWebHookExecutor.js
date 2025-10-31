async function DeliverViaWebHookExecutor(environment) {
  try {
    const targetUrl = environment.getInput('Webhook URL');
    if (!targetUrl) {
      environment.log.error('input -> Webhook URL is not defined');
      return false;
    }
    const body = environment.getInput('Data');
    if (!body) {
      environment.log.error('input -> Data is not defined');
      return false;
    }

    // Parse body if it's a string
    let parsedBody = body;
    try {
      parsedBody = JSON.parse(body);
    } catch (e) {
      // If parsing fails, use as string
    }

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsedBody),
    });

    const resStatus = res.status;

    if (resStatus !== 200 && resStatus !== 201) {
      environment.log.error(`Status Code ${resStatus}`);
      return false;
    }

    const resBody = await res.json();
    environment.log.info(JSON.stringify(resBody, null, 4));

    return true;
  } catch (error) {
    environment.log.error(error.message);
    return false;
  }
}

module.exports = DeliverViaWebHookExecutor;

