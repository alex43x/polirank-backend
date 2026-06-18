import umzug from './migrator.js';

const command = process.argv[2];

const commands = {
  up: () => umzug.up(),
  down: () => umzug.down(),
  status: () => umzug.executed().then((executed) => {
    const pending = umzug.pending();
    return Promise.all([executed, pending]).then(([done, todo]) => {
      console.log('\nExecuted:');
      done.forEach((m) => console.log(' ✓', m.name));
      console.log('\nPending:');
      todo.forEach((m) => console.log(' ○', m.name));
    });
  }),
};

if (!commands[command]) {
  console.error(`Usage: node src/database/migrate.js [up|down|status]`);
  process.exit(1);
}

commands[command]()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
