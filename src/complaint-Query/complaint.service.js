import knex from "../common/config/database.config";
import nodemailer from 'nodemailer'
import { uploadToS3 } from "../common/config/awsBucket.config";

class complaintService {
  async add(authUser, body, files) {
    try {
      const { name, email_mobileNo, service, serviceType, message } = body;

      const complaintImages = files.complaintImage || [];
      const complaintVideo = files.complaintVideo || [];

      if (complaintImages.length > 5) {
        return {
          status: false,
          message: 'You can upload a maximum of 5 images.'
        };
      }

      for (const img of complaintImages) {
        if (img.size > 5 * 1024 * 1024) {
          console.log(`Image too large: ${img.originalname} - ${(img.size / 1024 / 1024).toFixed(2)} MB`);
          return {
            status: false,
            message: `Image "${img.originalname}" exceeds 5MB size limit.`
          };
        }
      }

      for (const vid of complaintVideo) {
        if (vid.size > 10 * 1024 * 1024) {
          console.log(`Video too large: ${vid.originalname} - ${(vid.size / 1024 / 1024).toFixed(2)} MB`);
          return {
            status: false,
            message: `Video "${vid.originalname}" exceeds 10MB size limit.`
          };
        }
      }

      const awsUpload = await uploadToS3(files?.complaintImage);

      if (!awsUpload) {
        return {
          status: false,
          message: 'Complaint not added !!'
        }
      }

      const awsUpload2 = await uploadToS3(files?.complaintVideo);

      if (!awsUpload2) {
        return {
          status: false,
          message: 'Complaint not added !!'
        }
      }

      const imageFilenames = complaintImages.map(file => file.filename);
      const videoFilenames = complaintVideo.map(file => file.filename);

      await knex('complaintQuery').insert({
        name,
        email_mobileNo,
        service,
        serviceType,
        message,
        userId: authUser.id,
        images: JSON.stringify(imageFilenames),
        video: JSON.stringify(videoFilenames),
      });

      await sendComplaintEmail({
        name,
        email_mobileNo,
        service,
        serviceType,
        message,
      });

      return {
        status: true,
        message: 'Data submitted successfully!'
      };

    } catch (err) {
      console.error(err);
      return {
        status: false,
        message: 'Something went wrong!'
      };
    }
  }


}


async function sendComplaintEmail(details) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAILPASS
    }
  });

  const html = `
    <h3>New Complaint Query</h3>
    <p><strong>Name:</strong> ${details.name}</p>
    <p><strong>Email / Mobile:</strong> ${details.email_mobileNo}</p>
    <p><strong>Service:</strong> ${details.service || 'N/A'}</p>
    <p><strong>Service Type:</strong> ${details.serviceType || 'N/A'}</p>
    <p><strong>Message:</strong> ${details.message || 'N/A'}</p>
  `;

  await transporter.sendMail({
    from: `"${details.name}" <${process.env.EMAIL}>`,
    to: "g9jewellerys@gmail.com",
    subject: "New Complaint Query Submission",
    html
  });
}

export default new complaintService()