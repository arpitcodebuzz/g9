import client from "../common/config/twillio.config";


export const sendWhatsappOtp = async (toNumber, otp) => {
  try {
    console.log('Sending WhatsApp OTP...');
    console.log('To Number:', toNumber);
    console.log('OTP:', otp);
    console.log('Using Template SID:', process.env.TWILIO_OTP_TEMPLATE_SID);

    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_FROM,
      to: `whatsapp:${toNumber}`,
      contentSid: process.env.TWILIO_OTP_TEMPLATE_SID,

      // ✅ FIXED FOR AUTH TEMPLATE
      contentVariables: JSON.stringify({
        "1": otp.toString()
      })
    });

    console.log('Twilio Response SID:', message.sid);

    const msgStatus = await client.messages(message.sid).fetch();
    console.log('Message delivery status:', msgStatus.status);

    return { status: true, sid: message.sid, deliveryStatus: msgStatus.status };

  }
  catch (error) {
    console.error('WhatsApp OTP Error:', error.message);
    return {
      status: false,
      message: error.message || 'Failed to send WhatsApp OTP.'
    };
  }
};



// export const sendWhatsappInvoicePDF = async (mobile, invoiceFileName, userName) => {
//   try {
//     const to = `whatsapp:${mobile.startsWith('+') ? mobile : `+91${mobile}`}`;
//     const from = process.env.TWILIO_WHATSAPP_FROM;

//     const publicPdfUrl = `${process.env.BASE_URL}/uploads/invoice/${invoiceFileName}`;

//     const message = await client.messages.create({
//       from,
//       to,

//       // ✅ Use approved template
//       contentSid: 'HXa570310220ad5600fe2d9ce5a527bcea',

//       // ✅ Only if your template has variables
//       contentVariables: JSON.stringify({
//         "1": userName,
//       }),

//       // ✅ Media must match template type
//       mediaUrl: [publicPdfUrl],
//     });

//     return {
//       success: true,
//       sid: message.sid,
//     };

//   } catch (error) {
//     console.error("WhatsApp Invoice Error:", error);
//     return {
//       success: false,
//       message: error.message || "Failed to send invoice on WhatsApp.",
//     };
//   }
// };



// export const sendWhatsappInvoicePDF = async (mobile, invoiceFileName, customerName) => {
//   try {
//     const to = `whatsapp:${mobile.startsWith('+') ? mobile : `+91${mobile}`}`;
//     const from = process.env.TWILIO_WHATSAPP_FROM;

//     const publicPdfUrl = `${process.env.ORDER_INVOICE_UR}/uploads/invoice/${invoiceFileName}`;

//     const message = await client.messages.create({
//       from,
//       to,
//       contentSid: 'HXa570310220ad5600fe2d9ce5a527bcea',
//       contentVariables: JSON.stringify({ "customer_name": customerName }), // <-- exact variable name
//       mediaUrl: [publicPdfUrl],  // dynamic PDF
//     });


//     return { success: true, sid: message.sid };

//   } catch (error) {
//     console.error("WhatsApp Invoice Error:", error);
//     return { success: false, message: error.message || "Failed to send invoice on WhatsApp." };
//   }
// };


export const sendWhatsappInvoicePDF = async (mobile, invoiceFileName, customerName) => {
  try {
    const to = `whatsapp:${mobile.startsWith('+') ? mobile : `+91${mobile}`}`;
    const from = process.env.TWILIO_WHATSAPP_FROM;

    const publicPdfUrl = `${process.env.ORDER_INVOICE_UR}/uploads/invoice/${invoiceFileName}`;

    const message = await client.messages.create({
      from,
      to,
      contentSid: 'HX29ac893da9004f392d263c7ffddd023e',
      contentVariables: JSON.stringify({
        "customer_name": customerName,
        "2": invoiceFileName
      }),
      mediaUrl: [publicPdfUrl],
    });

    return { success: true, sid: message.sid };

  } catch (error) {
    console.error("WhatsApp Invoice Error:", error);
    return { success: false, message: error.message || "Failed to send invoice on WhatsApp." };
  }
};
