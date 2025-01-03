export const getSubscribeUrl = (email?: string) =>
  ['https://getappmap.com', email ? `email=${encodeURIComponent(email)}` : '']
    .filter(Boolean)
    .join('/?');
