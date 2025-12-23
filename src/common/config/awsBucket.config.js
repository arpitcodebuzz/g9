import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

const uploadDir = 'public/uploads/productmedia';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// export const uploadToS3 = async (files) => {
//   try {
//     // console.log("FILE RECEIVED:", files);

//     if (files.length == 0) {
//       return false;
//     }

//     files.forEach(async file => {

//       // let s3Folder = "products";

//       // if (file.fieldname === "blogImage") {
//       //   s3Folder = "public/uploads/blogs";
//       // } else if (["image", "video"].includes(file.fieldname)) {
//       //   s3Folder = path.join("public/uploads/productmedia");
//       // }
//       // else if (["contactImage", "contactVideo"].includes(file.fieldname)) {
//       //   s3Folder = path.join("public/uploads/contactUs");
//       // }
//       // else if (file.fieldname === "slider") {
//       //   s3Folder = path.join("public/uploads/slider")
//       // }
//       // else if (file.fieldname === "profile") {
//       //   s3Folder = path.join("public/uploads/profile")
//       // }
//       // else if (["complaintImage", "complaintVideo"].includes(file.fieldname)) {
//       //   s3Folder = path.join("public/uploads/complaint");
//       // }
//       // else if (file.fieldname === "mediaImage") {
//       //   s3Folder = path.join("public/uploads/media");
//       // }
//       // else if (file.fieldname === 'file') {
//       //   s3Folder = path.join('public/uploads/productCsv')
//       // }
//       // else if (file.fieldname === 'certificate') {
//       //   s3Folder = path.join('public/uploads/certificate')
//       // }
//       // else if (file.fieldname === 'festival') {
//       //   s3Folder = path.join('public/uploads/festival')
//       // }
//       // else if (file.fieldname === 'invoice') {
//       //   s3Folder = path.join('public/uploads/invoice')
//       // }
//       // else if (file.fieldname === 'exploreImg') {
//       //   s3Folder = path.join('public/uploads/exploreImg')
//       // }
//       // else if (file.fieldname === 'askpriceImg') {
//       //   s3Folder = path.join('public/uploads/askpriceImg')
//       // }
//       // else if (file.fieldname === 'reels') {
//       //   s3Folder = path.join('public/uploads/reels')
//       // }
//       // else if (file.fieldname === 'newArrival') {
//       //   s3Folder = path.join('public/uploads/newArrival')
//       // }
//       // else {
//       //   s3Folder = uploadDir;
//       // }
//       let s3Folder = "products";

//       if (file.fieldname === "blogImage") {
//         s3Folder = "public/uploads/blogs";
//       } else if (["image", "video"].includes(file.fieldname)) {
//         s3Folder = "public/uploads/productmedia";
//       } else if (["contactImage", "contactVideo"].includes(file.fieldname)) {
//         s3Folder = "public/uploads/contactUs";
//       } else if (file.fieldname === "slider") {
//         s3Folder = "public/uploads/slider";
//       } else if (file.fieldname === "profile") {
//         s3Folder = "public/uploads/profile";
//       } else if (["complaintImage", "complaintVideo"].includes(file.fieldname)) {
//         s3Folder = "public/uploads/complaint";
//       } else if (file.fieldname === "mediaImage") {
//         s3Folder = "public/uploads/media";
//       } else if (file.fieldname === 'file') {
//         s3Folder = 'public/uploads/productCsv';
//       } else if (['certificate','logo'].includes(file.fieldname)) {
//         s3Folder = 'public/uploads/certificate';
//       } else if (file.fieldname === 'festival') {
//         s3Folder = 'public/uploads/festival';
//       } else if (file.fieldname === 'invoice') {
//         s3Folder = 'public/uploads/invoice';
//       } else if (file.fieldname === 'exploreImg') {
//         s3Folder = 'public/uploads/exploreImg';
//       } else if (file.fieldname === 'askpriceImg') {
//         s3Folder = 'public/uploads/askpriceImg';
//       } else if (file.fieldname === 'reels') {
//         s3Folder = 'public/uploads/reels';
//       } else if (file.fieldname === 'newArrival') {
//         s3Folder = 'public/uploads/newArrival';
//       } else {
//         s3Folder = uploadDir;
//       }

//       const s3Key = `${s3Folder}/${file.filename}`; // always use forward slashes


//       // const fileExt = path.extname(file.originalname);
//       // const fileName = file.fieldname +
//       //   "-" +
//       //   uuidv4().slice(0, 8) +
//       //   path.extname(file.originalname);
//       // const s3Key = `${s3Folder}/${file.filename}`;
//       // console.log(path.join(s3Key))

//       const fileStream = fs.createReadStream(file.path);

//       const upload = new Upload({
//         client: s3,
//         params: {
//           Bucket: process.env.AWS_BUCKET,
//           Key: s3Key,
//           Body: fileStream,
//           ContentType: file.mimetype,
//           // ACL: "public-read" // ❌ remove if bucket is private
//         }
//       });

//       const result = await upload.done();

//       // console.log("UPLOAD DONE:", result);

//       // const mediaPath = `${process.env.PRODUCT_BASE_URL}/${s3Key}`
//       // console.log("🚀 ~ uploadToS3 ~ mediaPath:", mediaPath)


//       // console.log("🚀 ~ uploadToS3 ~ fs.existsSync(mediaPath:", fs.existsSync(mediaPath))
//       // if (fs.existsSync(mediaPath)) {
//       //   fs.unlinkSync(mediaPath)
//       // }

//       // if (fs.existsSync(file.path)) {
//       //   fs.unlinkSync(file.path);
//       // }

//       // return {
//       //   url: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`,
//       //   key: s3Key
//       // };
//     });


//     return true;

//   } catch (error) {
//     console.log("S3 UPLOAD ERROR:", error);
//     // throw error;
//     return false;
//   }
// };

export const uploadToS3 = async (files) => {
  try {
    if (!files || files.length === 0) {
      return false;
    }

    for (const file of files) {
      let s3Folder = "products";

      if (file.fieldname === "blogImage") {
        s3Folder = "public/uploads/blogs";
      } else if (["image", "video"].includes(file.fieldname)) {
        s3Folder = "public/uploads/productmedia";
      } else if (["contactImage", "contactVideo"].includes(file.fieldname)) {
        s3Folder = "public/uploads/contactUs";
      } else if (file.fieldname === "slider") {
        s3Folder = "public/uploads/slider";
      } else if (file.fieldname === "profile") {
        s3Folder = "public/uploads/profile";
      } else if (["complaintImage", "complaintVideo"].includes(file.fieldname)) {
        s3Folder = "public/uploads/complaint";
      } else if (file.fieldname === "mediaImage") {
        s3Folder = "public/uploads/media";
      } else if (file.fieldname === "file") {
        s3Folder = "public/uploads/productCsv";
      } else if (["certificate", "logo"].includes(file.fieldname)) {
        s3Folder = "public/uploads/certificate";
      } else if (file.fieldname === "festival") {
        s3Folder = "public/uploads/festival";
      } else if (file.fieldname === "invoice") {
        s3Folder = "public/uploads/invoice";
      } else if (file.fieldname === "exploreImg") {
        s3Folder = "public/uploads/exploreImg";
      } else if (file.fieldname === "askpriceImg") {
        s3Folder = "public/uploads/askpriceImg";
      } else if (file.fieldname === "reels") {
        s3Folder = "public/uploads/reels";
      } else if (file.fieldname === "newArrival") {
        s3Folder = "public/uploads/newArrival";
      }

      const s3Key = `${s3Folder}/${file.filename}`;
      const fileStream = fs.createReadStream(file.path);

      const cacheControl = file.mimetype.startsWith("video")
        ? "public, max-age=86400" // 1 day for videos
        : "public, max-age=31536000, immutable"; // 1 year for images

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: process.env.AWS_BUCKET,
          Key: s3Key,
          Body: fileStream,
          ContentType: file.mimetype,
          CacheControl: cacheControl,
        },
      });

      // ✅ THIS ACTUALLY WAITS
      await upload.done();

    }

    // ✅ This runs ONLY after all uploads finish
    return true;

  } catch (error) {
    console.log("S3 UPLOAD ERROR:", error);
    return false;
  }
};


export const deleteFromS3 = async (files) => {
  console.log("🚀 ~ deleteFromS3 ~ files:", files)
  try {

    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET,
      Key: `${files}`, // example: uploads/blogs/image123.png
    });
    // console.log(command)

    await s3.send(command);

    return {
      success: true,
      // message: "File deleted from S3"
    };
  } catch (error) {
    return {
      success: false,
      // message: error.message
    };
  }
};

export const getAllMedia = async () => {
  let allFiles = [];
  let continuationToken = undefined;
  try {

    const bucketName = process.env.AWS_BUCKET
    // const command = new ListObjectsV2Command({
    //   Bucket: bucketName,
    //   Prefix: 'public/uploads/productmedia/'
    // });

    // const response = await s3.send(command);

    // // Returns array of file URLs
    // const files = response.Contents?.map(file => ({
    //   key: file.Key,
    //   size: file.Size,
    //   url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`
    // })) || [];

    // return files;
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'public/uploads/productmedia/',
        ContinuationToken: continuationToken
      });

      const response = await s3.send(command);

      const files = response.Contents?.map(file => ({
        key: file.Key,
        name: path.basename(file.Key), // only file name
        size: file.Size,
        url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${file.Key}`
      })) || [];

      allFiles = allFiles.concat(files);

      // If there are more files, get the continuation token
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return allFiles;
  } catch (err) {
    console.error("Error fetching media from S3:", err);
    throw err;
  }
};
