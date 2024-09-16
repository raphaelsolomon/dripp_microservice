import { seedIndustryTable } from './industry/industries.seed';

async function ruunAllSeeds() {
  await seedIndustryTable();
  process.exit();
}

ruunAllSeeds();
