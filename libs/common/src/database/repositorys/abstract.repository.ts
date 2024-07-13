import { FilterQuery, Model, Types, UpdateQuery } from 'mongoose';
import { AbstractDocument } from '../models/abstract.schema';
import { Logger, NotFoundException } from '@nestjs/common';

export abstract class AbstractRepository<TDocument extends AbstractDocument> {
  protected abstract readonly logger: Logger;
  constructor(protected readonly model: Model<TDocument>) {}

  async create(document: Omit<TDocument, '_id'>): Promise<TDocument> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });
    return (await createdDocument.save()).toJSON() as unknown as TDocument;
  }

  async findOne(
    filterQuery: FilterQuery<TDocument>,
    select?: string,
  ): Promise<TDocument> {
    const document = await this.model
      .findOne(filterQuery)
      .select(select)
      .lean<TDocument>(true);
    if (!document) {
      this.logger.warn('Document was not found with filterquery', filterQuery);
      throw new NotFoundException('Document was not found');
    }
    return document;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
  ): Promise<TDocument> {
    const document = await this.model
      .findOneAndUpdate(filterQuery, update, {
        new: true,
      })
      .lean<TDocument>(true);
    if (!document) {
      this.logger.warn('Document was not found with filterquery', filterQuery);
      throw new NotFoundException('Document was not found');
    }
    return document;
  }

  async find(filterQuery: FilterQuery<TDocument>): Promise<TDocument[]> {
    return this.model.find(filterQuery).lean<TDocument[]>(true);
  }

  async findOneAndDelete(
    filterQuery: FilterQuery<TDocument>,
  ): Promise<TDocument> {
    return this.model.findOneAndDelete(filterQuery).lean<TDocument>(true);
  }

  async getPaginatedDocuments(
    first: number,
    page: number,
    filterQuery: FilterQuery<TDocument>,
    select?: string,
    column?: string,
  ) {
    const total = await this.model.countDocuments(filterQuery);
    const documents = await this.model
      .find(filterQuery)
      .select(select)
      .lean<TDocument[]>(true)
      .populate(column)
      .skip(((page ?? 1) - 1) * (first ?? 20))
      .sort({ created_at: -1 })
      .limit(first ?? 20)
      .exec();
    return {
      data: documents,
      paginationInfo: {
        total,
        currentPage: page ?? 1,
        lastPage: Math.ceil(total / (first ?? 20)),
        perPage: first ?? 20,
        hasMorePages: Math.ceil(total / (first ?? 20)) > (page ?? 1),
      },
    };
  }
}
