import {
  AggregateOptions,
  FilterQuery,
  Model,
  PipelineStage,
  ProjectionType,
  Types,
  UpdateQuery,
  UpdateWriteOpResult,
} from 'mongoose';
import { AbstractDocument } from '../models/abstract.schema';
import { Logger, NotFoundException } from '@nestjs/common';
import { PopulateDto } from '@app/common/dto';

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
    populate?: any,
    projection?: ProjectionType<TDocument>,
    throwError: boolean = true,
  ): Promise<TDocument> {
    const document = await this.model
      .findOne(filterQuery, projection)
      .select(select)
      .populate(populate)
      .lean<TDocument>(true);
    if (!document && throwError) {
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

  async find(
    filterQuery: FilterQuery<TDocument>,
    populate?: PopulateDto | PopulateDto[],
    projection?: ProjectionType<TDocument>,
  ): Promise<TDocument[]> {
    return this.model
      .find(filterQuery, projection)
      .populate(populate)
      .lean<TDocument[]>(true);
  }

  getModel() {
    return this.model;
  }

  async findOneAndDelete(
    filterQuery: FilterQuery<TDocument>,
  ): Promise<TDocument> {
    return this.model.findOneAndDelete(filterQuery).lean<TDocument>(true);
  }

  async aggregate(
    pipeline?: PipelineStage[],
    options?: AggregateOptions,
    countfilter?: FilterQuery<TDocument>,
  ): Promise<{ [key: string]: number | TDocument[] }> {
    if (countfilter) {
      const count = await this.model.countDocuments(countfilter).exec();
      const data = await this.model.aggregate(pipeline, options).exec();
      return { count, data };
    } else {
      const data = await this.model.aggregate(pipeline, options).exec();
      return { data };
    }
  }

  async aggregateToArray(
    pipeline?: PipelineStage[],
    options?: AggregateOptions,
  ) {
    return this.model.aggregate(pipeline, options);
  }

  async getPaginatedDocuments(
    first: number,
    page: number,
    filterQuery: FilterQuery<TDocument>,
    select?: string,
    populate?: PopulateDto | PopulateDto[],
    projection?: ProjectionType<TDocument>,
  ) {
    const total = await this.model.countDocuments(filterQuery);

    const query = this.model
      .find(filterQuery, projection)
      .select(select)
      .lean<TDocument[]>(true)
      .skip(((page ?? 1) - 1) * (first ?? 20))
      .sort({ created_at: -1 })
      .limit(first ?? 20);

    // Handle population, if provided
    if (populate) {
      if (Array.isArray(populate)) {
        // Populate multiple fields
        populate.forEach((pop) => query.populate(pop));
      } else {
        // Populate a single field
        query.populate(populate);
      }
    }

    const documents = await query.exec();

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

  async findOneOrCreate(
    filterQuery: FilterQuery<TDocument>,
    document: Omit<TDocument, '_id'>,
  ): Promise<TDocument> {
    const documentRecord = await this.model.findOne(filterQuery);
    if (documentRecord) return documentRecord;
    return this.model.create({ ...document, _id: new Types.ObjectId() });
  }

  async distinct(field: string, filter?: FilterQuery<TDocument>) {
    const documentRecord = await this.model.distinct(field, filter);
    return documentRecord;
  }

  async updateMany(
    filter?: FilterQuery<TDocument>,
    update?: UpdateQuery<TDocument>,
  ): Promise<UpdateWriteOpResult> {
    return this.model.updateMany(filter, update);
  }

  async countDocs(filter?: FilterQuery<TDocument>): Promise<number> {
    return this.model.countDocuments(filter);
  }
}
