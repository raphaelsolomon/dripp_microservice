import mongoose from 'mongoose';
import { v1 as uuidv1 } from 'uuid';
const { Schema } = mongoose;

export const IndustrySchema = new Schema(
  {
    uuid: {
      type: String,
      unique: true,
      required: true,
      default: uuidv1,
    },
    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);
