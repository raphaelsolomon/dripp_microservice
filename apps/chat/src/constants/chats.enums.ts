export const ChatEventEnum = Object.freeze({
  JOIN_ROOM_EVENT: 'joinRoom',
  CREATE_MESSAGE_EVENT: 'createMessage',
  GET_MESSAGES_EVENT: 'getChatMessages',
  GET_CHAT_USERS_EVENT: 'getAllChats',

  ARCHIVE_ROOM_EVENT: 'archiveRoom',
  ARCHIVE_MULTIPLE_ROOM_EVENT: 'archiveRooms',
  UNARCHIVE_ROOM_EVENT: 'unArchiveRoom',
  GET_ARCHIVED_CHAT_EVENT: 'getArchivedRooms',
  GET_ARCHIVED_CHAT_COUNT_EVENT: 'getArchivedCount',

  USER_STATUS_CHANGED: 'userStatusChanged',
  MESSAGE_RECEIVED_EVENT: 'messageReceived',
  TYPING_EVENT_EVENT: 'isTyping',
  MESSAGE_READ: 'messageRead',

  MARK_MESSAGES_AS_READ: 'markMessagesAsRead',
  MARK_MESSAGE_AS_READ: 'markMessageAsRead',
});
