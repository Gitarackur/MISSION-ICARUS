// 4. CLI COMMANDS FOR DEVELOPMENT (src/database/cli.ts)
import { migrationRunner } from "..";

const command = process.argv[2];
const arg = process.argv[3];

async function runCLI() {
  try {
    switch (command) {
      case 'migrate':
        await migrationRunner.runMigrations();
        break;
      
      case 'rollback':
        if (!arg) {
          console.error('Please specify target version: npm run rollback 3');
          process.exit(1);
        }
        await migrationRunner.rollback(parseInt(arg));
        break;
      
      case 'status': {
        const currentVersion = migrationRunner.getCurrentVersion();
        const appliedMigrations = migrationRunner.getAppliedMigrations();
        console.log(`Current version: ${currentVersion}`);
        console.log(`Applied migrations: ${appliedMigrations.join(', ')}`);
        break;
      }
      
      default:
        console.log('Available commands: migrate, rollback [version], status');
    }
  } catch (error) {
    console.error('Command failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runCLI();
}