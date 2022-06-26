const { Command } = require('commander');
const trackingReport = require('./trackingReport');

async function main() {
  const program = new Command();

  program.addCommand(trackingReport.command)

  await program.parseAsync(process.argv);
}

main();
