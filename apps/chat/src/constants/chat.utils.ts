import { Model } from 'mongoose';
import { ChatRoomDocument } from '../models/chatroom.schema';
import { MessageDocument } from '../models/message.schema';
import { ChatUsersBody } from './types.constant';

export const getPaginatedRoom = async (
  chatRoom: Model<ChatRoomDocument>,
  input: ChatUsersBody,
  message: Model<MessageDocument>,
) => {
  const { first, page, chat_uuid } = input;

  const total = await chatRoom.countDocuments({
    participants: { $in: [chat_uuid] },
    isArchivedFor: { $nin: [chat_uuid] },
  });

  const chatRooms = await chatRoom
    .find({
      participants: { $in: [chat_uuid] },
      isArchivedFor: { $nin: [chat_uuid] },
    })
    .select('-updatedAt -__v -createdAt')
    .populate('lastMessage')
    .skip(((page ?? 1) - 1) * (first ?? 20))
    .sort({ createdAt: -1 })
    .limit(first ?? 20)
    .exec();

  for (let i = 0; i < chatRooms.length; i++) {
    const unReadMsgCount = await message.countDocuments({
      chat: chatRooms[i]._id,
      receiver_uuid: chat_uuid,
      $or: [{ status: 'SENT' }, { status: 'DELIVERED' }],
    });
    chatRooms[i].unReadCount = unReadMsgCount;
  }

  return {
    data: chatRooms,
    paginatorInfo: {
      total,
      currentPage: page ?? 1,
      lastPage: Math.ceil(total / (first ?? 20)),
      perPage: first ?? 20,
      hasMorePages: Math.ceil(total / (first ?? 20)) > (page ?? 1),
    },
  };
};

export const getPaginatedArchivedRoom = async (
  chatRoom: Model<ChatRoomDocument>,
  input: ChatUsersBody,
  message: Model<MessageDocument>,
) => {
  const { first, page, chat_uuid } = input;

  const total = await chatRoom.countDocuments({
    participants: { $in: [chat_uuid] },
    isArchivedFor: { $in: [chat_uuid] },
  });
  const chatRooms = await chatRoom
    .find({
      participants: { $in: [chat_uuid] },
      isArchivedFor: { $in: [chat_uuid] },
    })
    .select('-updatedAt -__v -createdAt')
    .populate('lastMessage')
    .skip(((page ?? 1) - 1) * (first ?? 20))
    .sort({ createdAt: -1 })
    .limit(first ?? 20)
    .exec();

  for (let i = 0; i < chatRooms.length; i++) {
    const unReadMsgCount = await message.countDocuments({
      chat: chatRooms[i]._id,
      receiver_uuid: chat_uuid,
      $or: [{ status: 'SENT' }, { status: 'DELIVERED' }],
    });
    chatRooms[i].unReadCount = unReadMsgCount;
  }

  return {
    data: chatRooms,
    paginatorInfo: {
      total,
      currentPage: page ?? 1,
      lastPage: Math.ceil(total / (first ?? 20)),
      perPage: first ?? 20,
      hasMorePages: Math.ceil(total / (first ?? 20)) > (page ?? 1),
    },
  };
};
