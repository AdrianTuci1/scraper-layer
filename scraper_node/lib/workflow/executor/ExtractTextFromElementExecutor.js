const cheerio = require('cheerio');

async function ExtractTextFromElementExecutor(environment) {
  try {
    const selector = environment.getInput('Selector');
    if (!selector) {
      environment.log.error('Selector not defined');
      return false;
    }

    const html = environment.getInput('Html');
    if (!html) {
      environment.log.error('HTML not defined');
      return false;
    }

    const $ = cheerio.load(html);
    const element = $(selector);

    if (!element.length) {
      environment.log.error('Element not found on selector');
      return false;
    }

    const extractedText = element.text();
    if (!extractedText) {
      environment.log.error('Element has no text');
      return false;
    }

    environment.setOutput('Extracted Text', extractedText);

    return true;
  } catch (error) {
    environment.log.error(error.message);
    return false;
  }
}

module.exports = ExtractTextFromElementExecutor;

