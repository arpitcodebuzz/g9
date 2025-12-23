import { createCipheriv, createDecipheriv } from "crypto";
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from "fs";
// import mime from "mime";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import knex from "./config/database.config";


import dotenv from "dotenv";

dotenv.config();

const AES_ENC_KEY = Buffer.from(process.env.AES_ENC_KEY, "hex"); // set random encryption key
const AES_IV = Buffer.from(process.env.AES_IV, "hex"); // set random initialisation vector

export const encrypt = (val) => {
  const cipher = createCipheriv("aes-256-cbc", AES_ENC_KEY, AES_IV);
  let encrypted = cipher.update(val, "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

export const decrypt = (encrypted) => {
  const decipher = createDecipheriv("aes-256-cbc", AES_ENC_KEY, AES_IV);
  const decrypted = decipher.update(encrypted, "base64", "utf8");
  return decrypted + decipher.final("utf8");
};

export const storeAsSync = (dir, buffer, mimetype) => {
  const storageDir = "public/storage";

  // Handle special cases for MIME types like svg+xml
  let extension = mimetype.split('/')[1];
  if (extension.includes('+')) {
    extension = extension.split('+')[0];
  }

  const fileName = `${dir}/${uuidv4()}.${extension}`;

  const storageDirExists = existsSync(storageDir);
  if (!storageDirExists) mkdirSync(storageDir);
  const exists = existsSync(`${storageDir}/${dir}`);
  if (!exists) mkdirSync(`${storageDir}/${dir}`);

  writeFileSync(`${storageDir}/${fileName}`, buffer);

  return fileName;
};

// export const castToStorage = (string) =>
//   string ? constants.baseUrl(`${string}`) : null;

// helper.js or utils.js
export const castToStorage = (folderPath = '', filename = '') => {
  const base = process.env.PRODUCT_BASE_URL || 'http://localhost:5001';

  // Clean up slashes
  const cleanFolder = folderPath.replace(/^\/|\/$/g, '');
  const cleanFile = filename.replace(/^\/|\/$/g, '');

  return `${base}/${cleanFolder}/${cleanFile}`;
};

/**
 * delete file
 *  @param {string} file
 * @returns
 */
export const deleteFile = (file) => {
  const filePath = `./public/upload/${file}`;
  // console.log(filePath,"-------------------file path");
  if (existsSync(filePath)) {
    unlinkSync(filePath);
  }
  return true;
};

export const encodeString = (password) => {
  const SALT = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, SALT);
};

export const compareString = (string, hashString) =>
  bcrypt.compareSync(string, hashString);

/**
 * send push
 * @param tokens
 * @param payload
 */
export const sendPush = (tokens, payload) => {
  if (tokens.length > 0) {
    firebaseAdmin
      .messaging()
      .sendToDevice(tokens, payload)
      .then(async (result) => {
        result.results.forEach(async (deviceResult, index) => {
          if (deviceResult.error) {
            await knex("device_tokens")
              .where({ token: tokens[index] })
              .delete();
            // Now use this token to delete it from your DB, or mark it failed according to your requirements.
          }
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }
};
