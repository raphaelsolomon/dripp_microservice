export type ChatMessagesBody = {
  room_id: string;
  chat_uuid: string;
  page?: number;
  first?: number;
};

export type ChatUsersBody = {
  chat_uuid: string;
  page?: number;
  first?: number;
};
