import { BadRequestException, HttpException, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose, { ClientSession } from 'mongoose';

@Injectable()
export class MongooseTransaction {
  @InjectConnection() private readonly connection: mongoose.Connection;

  async transaction<T>(cb: (session: ClientSession) => Promise<T>) {
    try {
      return await this.connection.withSession(async (session) => {
        return session.withTransaction(async () => {
          return cb(session); // Execute the provided callback within the transaction
        });
      });
    } catch (error) {
      throw error; // Rethrow the error to propagate it to the caller
    }
  }
  async close() {
    return this.connection.close();
  }
}
