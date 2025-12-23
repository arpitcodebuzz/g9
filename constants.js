import dotenv from "dotenv";

dotenv.config();

export const serverPort = process.env.PORT || 2102;

export function baseUrl(path = null) {
  const host = process.env.BASE_URL;
  const url = `${host}`;
  return url + (path ? `/${path}` : "");
}

export function apiBaseUrl(path = null) {
  const url = `${baseUrl()}/api/v1`;
  return url + (path ? `/${path}` : "");
}

export const DEVICE_TOKEN = {
  ANDROID: "Android",
  IOS: "IOS",
};

export const STATUS = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export const HTTP_INTERNAL_SERVER = 500;
export const HTTP_UNPROCESSABLE = 422;
export const HTTP_CONFLICT = 409;
export const HTTP_NOT_FOUND = 404;
export const HTTP_FORBIDDEN = 403;
export const HTTP_UNAUTHORIZE = 401;
export const HTTP_BAD_REQUEST = 400;

export const SOCIAL_PROVIDERS = {
  GOOGLE: "google",
  APPLE: "apple",
  FACEBOOK: "facebook",
};

export const APPROVAL_STATUS = {
  PENDING: "pending",
  ACCEPT: "accept",
  REJECT: "reject",
};

export const TYPE = {
  COMPANY: "Company",
  INDIVIDUAL: "Individual",
};

export const APP_KEY = process.env.APP_KEY;
export const PRIVATE_KEY = process.env.PRIVATE_KEY;
