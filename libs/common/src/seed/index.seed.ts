import { connect } from 'mongoose';
import { UserDocument, UserSchema } from '../database';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_NAME = process.env.MONGODB_NAME;

async function seedUsers(): Promise<void> {
  const connection = await connect(MONGODB_URI, { dbName: MONGODB_NAME });

  const userModel = connection.model(UserDocument.name, UserSchema);
}
