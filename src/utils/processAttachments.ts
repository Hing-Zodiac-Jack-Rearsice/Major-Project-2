// Helper function to process attachments on the client side
export const processAttachments = async (
  files: File[]
): Promise<{ name: string; type: string; content: string }[]> => {
  return Promise.all(
    files.map(async (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Content = (reader.result as string).split(",")[1];
          resolve({
            name: file.name,
            type: file.type,
            content: base64Content,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    })
  ) as Promise<{ name: string; type: string; content: string }[]>;
};
