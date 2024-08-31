export class DeleteRoomsDto {
  readonly chat_uuid: string;

  readonly room_uuids: [string];
}
