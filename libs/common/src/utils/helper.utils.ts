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
