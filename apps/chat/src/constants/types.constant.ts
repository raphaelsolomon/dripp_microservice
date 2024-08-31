export type ChatMessagesBody = {
  room_id: string;
  page?: number;
  first?: number;
};

export type ChatUsersBody = {
  page?: number;
  first?: number;
};
