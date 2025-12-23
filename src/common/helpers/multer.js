import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from "uuid";

// Default path
const uploadDir = 'public/uploads/productmedia';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;

    // Route based on fieldname
    if (file.fieldname === "blogImage") {
      // uploadPath = path.join("public/uploads/blogs");
      uploadPath = path.join("public/uploads/blogsBaseImage");
    }
    else if (["images"].includes(file.fieldname)) {
      uploadPath = path.join("public/uploads/productBaseImage");
    }
    else if (["video"].includes(file.fieldname)) {
      uploadPath = path.join("public/uploads/productmedia");
    }
    else if (["contactImage", "contactVideo"].includes(file.fieldname)) {
      uploadPath = path.join("public/uploads/contactUs");
    }
    else if (file.fieldname === "slider") {
      // uploadPath = path.join("public/uploads/slider")
      uploadPath = path.join("public/uploads/sliderBaseImage")
    }
    else if (file.fieldname === "profile") {
      // uploadPath = path.join("public/uploads/profile")
      uploadPath = path.join("public/uploads/profileBaseImage")
    }
    else if (["complaintImage", "complaintVideo"].includes(file.fieldname)) {
      uploadPath = path.join("public/uploads/complaint");
    }
    else if (file.fieldname === "mediaImage") {
      // uploadPath = path.join("public/uploads/media");
      uploadPath = path.join("public/uploads/mediaBaseImage");
    }
    else if (file.fieldname === 'file') {
      uploadPath = path.join('public/uploads/productCsv')
    }
    else if (['certificate', 'logo'].includes(file.fieldname)) {
      // uploadPath = path.join('public/uploads/certificate')
      uploadPath = path.join('public/uploads/certificateBaseImage')
    }
    else if (file.fieldname === 'festival') {
      // uploadPath = path.join('public/uploads/festival')
      uploadPath = path.join('public/uploads/festivalBaseImage')
    }
    else if (file.fieldname === 'invoice') {
      uploadPath = path.join('public/uploads/invoice')
    }
    else if (file.fieldname === 'exploreImg') {
      // uploadPath = path.join('public/uploads/exploreImg')
      uploadPath = path.join('public/uploads/exploreImgBaseImage')
    }
    else if (file.fieldname === 'askpriceImg') {
      uploadPath = path.join('public/uploads/askpriceImg')
    }
    else if (file.fieldname === 'reels') {
      uploadPath = path.join('public/uploads/reels')
    }
    else if (file.fieldname === 'newArrival') {
      // uploadPath = path.join('public/uploads/newArrival')
      uploadPath = path.join('public/uploads/newArrivalBaseImage')
    }
    else {
      uploadPath = uploadDir; // default fallback
    }

    // Ensure folder exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);

  },

  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname +
      "-" +
      uuidv4().slice(0, 8) +
      path.extname(file.originalname)
    );
  },
});

// const fileFilter = (req, file, cb) => {
//   // console.log(file)
//   if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
//     cb(null, true);
//   }
//   else if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
//     cb(null, true);
//   }
//   else {
//     cb(new Error('Unsupported file format'), false);
//   }
// };

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'invoice') {
    // Only allow PDF for invoice
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for invoice'), false);
    }
  } else if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true); // allow images and videos for other fields
  } else if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true); // allow CSV
  } else {
    cb(new Error('Unsupported file format'), false);
  }
};


// const limits = (req, file, cb) => {
//   console.log(file);

//   // Example: reject files larger than MAX_SIZE
//   if (file.size > MAX_SIZE) {
//     return cb(new multer.MulterError('LIMIT_FILE_SIZE', file), false);
//   }
//   cb(null, true);
// }


const upload = multer({
  storage, fileFilter,
  // limits: { fileSize: 40 * 1024 * 1024 }

});

export default upload;
