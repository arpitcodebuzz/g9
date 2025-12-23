import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()
import path from 'path'
import fs from 'fs'

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAILPASS
  }
})

export const sendOtpEmail = async (email, otp) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: `Your G9 Verification Code`,
      text: `
Your verification code for G9 is: ${otp}
This code is valid for 2 minutes. Please do not share it with anyone.

Thank you,
G9 Team`,
    });

    return {
      success: true,
      messageId: info.messageId,
    };

  } catch (error) {
    console.error('Error sending email:', error.message);
    return {
      success: false,
      message: error.message,
    };
  }
};

export const sendWelcomeEmail = async (to, customerName) => {
  try {
    const subject = `Welcome to the World of G9 Jewellery`;
    const templatePath = path.join(process.cwd(), 'src', 'email-templets', 'welcome.html');
    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    //     const body = `
    // Dear ${customerName},

    // Welcome to G9 Jewellery — where every piece tells your story in gold and shine. 💛
    // We’re thrilled to have you join our community of timeless elegance. Explore our latest collections and discover jewellery made with love, care, and craftsmanship.

    // Explore Now = https://g9jewellery.com/

    // Warm regards,
    // Team G9 Jewellery
    // Loved Worldwide
    //     `.trim();
    htmlContent = htmlContent.replace(/http:\/\/192\.168\.1\.16:5001\/uploads\/email_templete\//g, 'https://g9jewellery.com/uploads/email_templete/');

    htmlContent = htmlContent.replace('{{name}}', customerName);
    // htmlContent = htmlContent.replace('{{Explore Now}}', customerName);

    const info = await transporter.sendMail({
      from: `"Team G9 Jewellery" <${process.env.EMAIL}>`,
      to,
      subject,
      html: htmlContent,
      // text: body
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending welcome email:', err.message);
    return { success: false, message: err.message };
  }
};


const sendMail = async (to, subject, body, fromName = "G9 Team") => {
  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${process.env.EMAIL}>`,
      to,
      subject,
      text: body,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("Error sending email:", err.message);
    return { success: false, message: err.message };
  }
};


// export const sendUserEmail = async (
//   to,
//   subject,
//   orderDetails,
//   fromName = "G9 Team"
// ) => {
//   try {
//     const emailBody = `
// ${orderDetails.message || ''}

// Order Details:
// -------------------------
// Order ID      : #${orderDetails.orderId}
// Product        : ${orderDetails.productTitle}
// Stock Number  : ${orderDetails.stockNumber}
// Status        : ${orderDetails.status}
// -------------------------

// Thank you,
// ${fromName}
//     `.trim();

//     const info = await transporter.sendMail({
//       from: `"${fromName}" <${process.env.EMAIL}>`,
//       to,
//       subject,
//       text: emailBody,
//     });

//     return { success: true, messageId: info.messageId };
//   } catch (err) {
//     console.error("Error sending email:", err.message);
//     return { success: false, message: err.message };
//   }
// };

export const sendOrderPlacedEmail = async ({
  to,
  customerName,
  orderDetails,
  invoiceFileName
}) => {
  console.log("🚀 ~ sendOrderPlacedEmail ~ orderDetails:", orderDetails)
  try {
    const subject = `Your G9 Jewellery Order #${orderDetails.orderId} Has Been Placed `;

    const templatePath = path.join(
      process.cwd(),
      "src/email-templets/order_placed.html"
    );

    let htmlContent = fs.readFileSync(templatePath, "utf-8");

    htmlContent = htmlContent.replace(/\[name\]/g, customerName);
    htmlContent = htmlContent.replace(/\[Order Details\]/g, orderDetails.id);
    htmlContent = htmlContent.replace(/\[Order ID\]/g, orderDetails.orderId);
    htmlContent = htmlContent.replace(/\[#G9-2025-123\]/g, orderDetails.orderId);
    htmlContent = htmlContent.replace(/\[price\]/g, `₹${orderDetails.amount}`);
    htmlContent = htmlContent.replace(/\[Qty\]/g, `Qty: ${orderDetails.totalQty || 1}`);

    let attachments = [];

    if (invoiceFileName) {
      const pdfPath = path.join(
        process.cwd(),
        "public/uploads/invoice",
        invoiceFileName
      );

      if (!fs.existsSync(pdfPath)) {
        throw new Error("Invoice PDF not found");
      }

      attachments.push({
        filename: invoiceFileName,
        path: pdfPath,
        contentType: "application/pdf"
      });
    }

    await transporter.sendMail({
      from: `"Team G9 Jewellery" <${process.env.EMAIL}>`,
      to,
      subject,
      html: htmlContent,
      attachments
    });

    return { success: true };
  } catch (err) {
    console.error("❌ Email error:", err.message);
    return { success: false, message: err.message };
  }
};


// export const sendOrderAcceptedEmail = async (to, customerName, orderDetails) => {
//   const subject = `Great News! Your Order #${orderDetails.orderId} Has Been Accepted 💖`;
//   //   const body = `
//   // Hi ${customerName},

//   // We’re excited to let you know that your G9 Jewellery order has been accepted and is now in line for processing.
//   // Our artisans are preparing your piece with utmost care and love.

//   // We’ll notify you once it’s ready to ship.

//   // Thank you for trusting G9 Jewellery — where every shine has a story. ✨

//   // Warmly,
//   // Team G9 Jewellery
//   //   `.trim();

//   return sendMail(to, subject, body);
// };

// export const sendOrderRejectedEmail = async (to, customerName, orderDetails, reason) => {
//   const subject = `Update on Your G9 Jewellery Order #${orderDetails.orderId}`;
//   const body = `
// Dear ${customerName},

// We regret to inform you that your G9 Jewellery order #${orderDetails.orderId} could not be processed at this time due to ${reason}.

// We truly value your interest and invite you to explore other beautiful designs from our latest collection.

// For assistance, please contact us at ${process.env.SUPPORT_EMAIL}.

// Warm regards,
// Team G9 Jewellery
//   `.trim();

//   return sendMail(to, subject, body);
// };

// export const sendOrderProcessingEmail = async (to, customerName, orderDetails) => {
//   const subject = `Your G9 Jewellery Order is Being Processed ✨`;
//   const body = `
// Hi ${customerName},

// Your G9 Jewellery order #${orderDetails.orderId} is currently being prepared.
// Our team is carefully inspecting and packing your jewellery to ensure it reaches you in perfect condition.

// We’ll share your tracking details once it’s shipped.

// Thank you for your patience and trust 💛
// Team G9 Jewellery
//   `.trim();

//   return sendMail(to, subject, body);
// };

// export const sendOrderShippedEmail = async (to, customerName, orderDetails) => {
//   const subject = `Your G9 Jewellery Order ${orderDetails.orderId} is On Its Way! 💌`;
//   const body = `
// Hi ${customerName},

// Your sparkle is on its way! ✨
// Your G9 Jewellery order has been shipped and will reach you soon.

// Tracking Details:
// Courier Partner: ${orderDetails.courierName}
// Tracking ID: ${orderDetails.orderId}
// Track Here → ${orderDetails.trackingLink}

// We can’t wait for you to unbox your shine. 💎

// With love,
// Team G9 Jewellery
//   `.trim();

//   return sendMail(to, subject, body);
// };



// export const sendOrderDeliveredEmail = async (to, customerName, orderDetails) => {
//   const subject = `Delivered! Your G9 Jewellery Order ${orderDetails.orderId} 💛`;
//   const body = `
// Hi ${customerName},

// We’re happy to inform you that your G9 Jewellery order ${orderDetails.orderId} has been successfully delivered.

// We hope your jewellery brings a sparkle to your every moment. ✨
// If you loved it (we’re sure you did!), we’d be grateful if you share your feedback or tag us on Instagram @g9jwellery 💫

// Thank you for being a part of the G9 family!

// Warmly,
// Team G9 Jewellery
//   `.trim();

//   return sendMail(to, subject, body);
// };

export const sendOrderShippedEmail = async (to, customerName, orderDetails) => {
  // console.log("🚀 ~ sendOrderShippedEmail ~ customerName:", customerName)
  try {
    const subject = `Your G9 Jewellery Order ${orderDetails.orderId} is On Its Way!`;
    const templatePath = path.join(
      process.cwd(),
      'src',
      'email-templets',
      'order_shipped.html'
    );

    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Fix local asset URLs
    htmlContent = htmlContent.replace(
      /http:\/\/192\.168\.1\.16:5001\/uploads\/email_templete\//g,
      'https://g9jewellery.com/uploads/email_templete/'
    );

    htmlContent = htmlContent.replace(/\[name\]/g, customerName);
    htmlContent = htmlContent.replace(/\[Order ID\]/g, orderDetails.orderId);

    let paymentDetails = {};
    try {
      paymentDetails = typeof orderDetails.paymentDetails === 'string'
        ? JSON.parse(orderDetails.paymentDetails)
        : orderDetails.paymentDetails;
    } catch (err) {
      console.error('Invalid paymentDetails JSON:', err);
    }

    const item = orderDetails.items?.[0];
    const productTitle = item?.title || 'Product';
    const purity = item?.purity?.name ? ` ${item.purity.name}` : '';
    const quantity = item?.quantity || 1;
    const price = paymentDetails.total || 0
    const stockNumber = item?.stockNumber || 'N/A';
    const status = item?.status

    const productImage =
      item?.media?.[0]?.images?.[0]
        ? `https://2prbc8z4-5001.inc1.devtunnels.ms/uploads/productmedia/${item.media[0].images[0]}`
        : 'https://via.placeholder.com/70';

    htmlContent = htmlContent.replace('#G9-2025-123', stockNumber);
    htmlContent = htmlContent.replace('Diamond Pendent Necklace', `${productTitle}${purity}`);
    htmlContent = htmlContent.replace('Qty: 1', `Qty: ${quantity}`);
    htmlContent = htmlContent.replace('$999.00', `₹${price}`);
    htmlContent = htmlContent.replace('https://via.placeholder.com/70', productImage);

    // Order details
    const orderDate = orderDetails.createdAt
      ? new Date(orderDetails.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      : 'N/A';
    htmlContent = htmlContent.replace('12 Dec 2025', orderDate);
    htmlContent = htmlContent.replace('Paid', orderDetails.paymentStatus || 'Paid');
    htmlContent = htmlContent.replace(/\[Processing\]/g, status || 'null');

    // Send email
    const info = await transporter.sendMail({
      from: `"Team G9 Jewellery" <${process.env.EMAIL}>`,
      to,
      subject,
      html: htmlContent
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending order shipped email:', err.message);
    return { success: false, message: err.message };
  }
};

export const sendOrderDeliveredEmail = async (to, customerName, order) => {
  try {
    const subject = `Delivered! Your G9 Jewellery Order #${order.orderId}`;

    const templatePath = path.join(
      process.cwd(),
      'src',
      'email-templets',
      'order_deliverd.html'
    );

    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    htmlContent = htmlContent.replace(
      /http:\/\/192\.168\.1\.16:5001\/uploads\/email_templete\//g,
      'https://g9jewellery.com/uploads/email_templete/'
    );

    // 🧍 Customer info
    htmlContent = htmlContent.replace(/\[Customer Name\]/g, customerName);
    htmlContent = htmlContent.replace(/\[Order ID\]/g, order.orderId);

    const item = order.items?.[0];
    console.log("🚀 ~ sendOrderDeliveredEmail ~ item:", item)

    let paymentDetails = {};
    try {
      paymentDetails = typeof order.paymentDetails === 'string'
        ? JSON.parse(order.paymentDetails)
        : order.paymentDetails;
    } catch (err) {
      console.error('Invalid paymentDetails JSON:', err);
    }

    const productTitle = item?.title || 'Product';
    const purity = item?.purity?.name ? ` ${item.purity.name}` : '';
    const quantity = item?.quantity || 1;
    const price = paymentDetails.total || 0
    const stockNumber = item?.stockNumber || 'N/A';
    const productImage =
      item?.media?.[0]?.images?.[0]
        ? ` https://2prbc8z4-5001.inc1.devtunnels.ms/uploads/productmedia/${item.media[0].images[0]}`
        : 'https://via.placeholder.com/70';
    console.log("🚀 ~ sendOrderDeliveredEmail ~ productImage:", productImage)
    htmlContent = htmlContent.replace('#G9-2025-123', stockNumber);
    htmlContent = htmlContent.replace(
      'Diamond Pendent Necklace',
      `${productTitle}${purity}`
    );
    htmlContent = htmlContent.replace('Qty: 1', `Qty: ${quantity}`);
    htmlContent = htmlContent.replace('$999.00', `₹${price}`);
    htmlContent = htmlContent.replace(
      'https://via.placeholder.com/70',
      productImage
    );

    // 📄 Order details
    const orderDate = order.createdAt
      ? new Date(order.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      : 'N/A';

    htmlContent = htmlContent.replace('12 Dec 2025', orderDate);
    htmlContent = htmlContent.replace('Paid', order.paymentStatus || 'Paid');
    htmlContent = htmlContent.replace(
      'Processing',
      order.status || 'Delivered'
    );

    // ✉️ Send email
    const info = await transporter.sendMail({
      from: `"Team G9 Jewellery" <${process.env.EMAIL}>`,
      to,
      subject,
      html: htmlContent
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending order delivered email:', err);
    return { success: false, message: err.message };
  }
};

export const sendOrderInQueueEmail = async (to, customerName, orderDetails) => {
  // console.log("🚀 ~ sendOrderInQueueEmail ~ orderDetails:", orderDetails)
  try {
    const subject = `Your G9 Jewellery Order ${orderDetails.orderId} is Being Processed`;

    const templatePath = path.join(
      process.cwd(),
      'src',
      'email-templets',
      'order_processing.html'
    );

    let htmlContent = fs.readFileSync(templatePath, 'utf-8');

    // Fix local asset URLs
    htmlContent = htmlContent.replace(
      /http:\/\/192\.168\.1\.16:5001\/uploads\/email_templete\//g,
      'https://g9jewellery.com/uploads/email_templete/'
    );

    htmlContent = htmlContent.replace(/\[name\]/g, customerName);
    htmlContent = htmlContent.replace(/\[Order ID\]/g, orderDetails.orderId);

    let paymentDetails = {};
    try {
      paymentDetails = typeof orderDetails.paymentDetails === 'string'
        ? JSON.parse(orderDetails.paymentDetails)
        : orderDetails.paymentDetails;
    } catch (err) {
      console.error('Invalid paymentDetails JSON:', err);
    }

    const item = orderDetails.items?.[0];
    const productTitle = item?.title || 'Product';
    const purity = item?.purity?.name ? ` ${item.purity.name}` : '';
    const quantity = item?.quantity || 1;
    const price = paymentDetails.total || 0
    const stockNumber = item?.stockNumber || 'N/A';
    const status = item?.status
    console.log(status, 'status')

    const productImage =
      item?.media?.[0]?.images?.[0]
        ? `https://2prbc8z4-5001.inc1.devtunnels.ms/uploads/productmedia/${item.media[0].images[0]}`
        : 'https://via.placeholder.com/70';

    htmlContent = htmlContent.replace('#G9-2025-123', stockNumber);
    htmlContent = htmlContent.replace('Diamond Pendent Necklace', `${productTitle}${purity}`);
    htmlContent = htmlContent.replace('Qty: 1', `Qty: ${quantity}`);
    htmlContent = htmlContent.replace('$999.00', `₹${price}`);
    htmlContent = htmlContent.replace('https://via.placeholder.com/70', productImage);

    // Order details
    const orderDate = orderDetails.createdAt
      ? new Date(orderDetails.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      : 'N/A';
    htmlContent = htmlContent.replace('12 Dec 2025', orderDate);
    htmlContent = htmlContent.replace('Paid', orderDetails.paymentStatus || 'Paid');
    htmlContent = htmlContent.replace(/\[Processing\]/g, status || 'null');

    // Send email
    const info = await transporter.sendMail({
      from: `"Team G9 Jewellery" <${process.env.EMAIL}>`,
      to,
      subject,
      html: htmlContent
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Error sending order shipped email:', err.message);
    return { success: false, message: err.message };
  }

};



// const transporters = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL,
//     pass: process.env.EMAILPASS
//   }
// })

// export const sendInvoiceEmail = async (to, customerName, orderId, invoice) => {
//   try {
//     // Build PDF path if not provided absolute

//     const pdfPath = path.join(__dirname, "../../../public/uploads/invoice", `${invoice}`);

//     const info = await transporter.sendMail({
//       from: `"G9 Team" <${process.env.EMAIL}>`,
//       to,
//       subject: `Your G9 Jewellery Invoice for Order #${orderId}`,
//       html: `
//         <p>Hi ${customerName},</p>
//         <p>Thank you for your order!</p>
//         <p>You can download your invoice from the attachment below.</p>
//         <p>With love,<br/>Team G9 Jewellery</p>
//       `,
//       attachments: [
//         {
//           filename: `Invoice-${orderId}.pdf`,
//           path: pdfPath,
//           contentType: "application/pdf"
//         }
//       ]
//     });

//     // console.log("Invoice email sent:", info.messageId);
//     return { success: true, messageId: info.messageId };
//     // return { success: true }
//   }
//   catch (err) {
//     console.error("Failed to send invoice email:", err.message);
//     return { success: false, message: err.message };
//   }
// };


export const sentData = async (name, email_mobileNo, message, email) => {
  try {
    const info = await transporter.sendMail({
      from: `"${name}" <${email}>`,
      to: "g9jewellerys@gmail.com",
      replyTo: email,
      subject: "New Contact Form Submission",
      html: `
            <h3>New Contact Form Submission</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email/MobileNo:</strong> ${email_mobileNo || "N/A"}</p>
            <p><strong>Message:</strong> ${message}</p>
          `
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  }
  catch (err) {
    console.log('err sending mail !!')
    return {
      status: false,
      message: err.message
    }
  }
}

export const sendRole = async (to, roleDetails) => {
  const subject = '🎉 Your Role Has Been Created';

  const loginUrl = process.env.SUB_ADMIN_URL || "URL_NOT_FOUND";

  const body = `
Hi ${roleDetails.email},

We’re happy to inform you that a new role has been created for you in our system.

Role Details:
- Email: ${roleDetails.email}
- Password: ${roleDetails.password}
- Role Name: ${roleDetails.rolename}

🔗 Login Here:
${loginUrl}

Please keep this information safe. If you have questions, contact the admin team.

Thank you,
Team Admin
  `.trim();

  return sendMail(to, subject, body, "Admin");
};