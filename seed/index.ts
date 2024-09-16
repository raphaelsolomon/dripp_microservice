import { seedIndustryTable } from './industry/industries.seed';

async function runAllSeeds() {
  await seedIndustryTable();
  process.exit();
}

runAllSeeds();
