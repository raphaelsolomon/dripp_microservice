import { connect } from 'mongoose';
import { IndustrySchema } from './industry.model';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const MONGODB_URI: string = process.env.MONGODB_URI;
const MONGODB_NAME: string = process.env.MONGODB_NAME;

async function seedIndustryTable() {
  const industries: string[] = [
    'Technology',
    'Finance',
    'Fashion',
    'Hospitality',
    'Automobile',
    'Foods & Drinks',
    'Entertainment/Media',
    'Retail',
    'Catering/Chef',
    'Manufacturing',
    'Agriculture ',
    'Trade',
    'Construction',
    'Health Care',
    'Transportation',
    'Education',
    'Telecommunications',
    'Logistics',
    'Pharmaceutical',
    'Law',
    'Investment',
  ];
  const connection = await connect(MONGODB_URI, { dbName: MONGODB_NAME });

  const industryModel = connection.model('industrydocuments', IndustrySchema);

  for (const industry of industries) {
    await industryModel.create({ name: industry });
  }
  console.log('seeding industries completed successfully');
}

seedIndustryTable();
