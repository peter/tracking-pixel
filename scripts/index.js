const { Command } = require('commander');
const trackingReport = require('./trackingReport');

async function main() {
  const command = new Command();

  command
    .command('trackingReport')
    .description('Get CSV report from /trackingReport endpoint')
    .action(trackingReport.action)
    .requiredOption('--from <from>', 'from timestamp or date, i.e. 2022-06-24T20:16:00.000Z or 2022-06-24')
    .requiredOption('--to <to>', 'to timestamp or date, i.e. 2022-06-25T20:16:00.000Z or 2022-06-25')
    .option('--baseUrl <baseUrl>', 'base URL of tracking API', 'http://localhost:3000')

    await command.parseAsync(process.argv);
}

main();
