export class CreateMessageDto {
  readonly sender_uuid: string;

  readonly receiver_uuid: string;

  readonly content: ChatContent;

  readonly content_type?: string | 'text';
}

/* 
  if there are multiple collaborators on a site then,
  passing the collaborator uuid(not chat_service_uuid) currently sending the msg.
  this uuid will be used to to get the collaborator details and indicate is_site:true 
  if this msg is comming from a site..indicate false if this message is btw individuals
*/
class ChatContent {
  message: string;
  sender_uuid?: string;
  is_brand?: boolean;
}
