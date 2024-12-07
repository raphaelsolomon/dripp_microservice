import { PipelineStage } from 'mongoose';

export function generateRandomCode(length: number): string {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export const caseInsensitiveRegex = (e: string) => new RegExp(`^${e}$`, 'i');

export const partialMatchInsensitiveRegex = (e: string) => new RegExp(e, 'i');

interface ISuccessReponseParams {
  statusCode: number;
  path: string;
  message: string;
  data: any;
}

export const successResponse = ({
  statusCode,
  data,
  message,
  path,
}: Partial<ISuccessReponseParams>) => {
  return {
    statusCode: statusCode || 200,
    timestamp: new Date().toISOString(),
    path: path,
    message: message || 'Successful',
    success: true,
    data: data || null,
  };
};

export const aggregationPaginationHelper = ({
  first = 20,
  page = 1,
}: {
  first: number | string;
  page: number | string;
}) => {
  const skip = Number(first) * (Number(page) - 1 || 0);

  const pageInNumber = Number(page);
  return [
    {
      $facet: {
        totalDocs: [{ $count: 'total' }],
        data: [
          { $sort: { created_at: -1 } },
          { $skip: skip },
          { $limit: Number(first) },
        ],
      },
    },

    {
      $unwind: '$totalDocs',
    },

    {
      $project: {
        paginationInfo: {
          total: '$totalDocs.total',
          totalPages: {
            $ceil: { $divide: ['$totalDocs.total', Number(first)] },
          },
          hasMorePages: {
            $lt: [
              Number(page),
              {
                $ceil: { $divide: ['$totalDocs.total', Number(first)] },
              },
            ],
          },
          currentPage: page,
        },
        data: 1,
      },
    },
  ] as any[];
};

export const noDataDefault = {
  paginationInfo: {
    total: 0,
    totalPages: 0,
  },
  data: [],
};

export const getTasksAndTotalTasksAmount = [
  {
    $lookup: {
      from: 'subtaskdocuments',
      localField: 'uuid',
      foreignField: 'campaign_uuid',
      as: 'tasks',
    },
  },
  {
    $addFields: {
      total_engagement_reward: {
        $sum: '$tasks.reward_amount',
      },
    },
  },
] as PipelineStage[];
