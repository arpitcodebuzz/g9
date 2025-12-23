import client from "../common/config/twillio.config";

const sentOtp = async (Mobile_number, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your OTP is ${otp}. It is valid for 2 minutes. Do not share this code with anyone.`,
      messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
      to: Mobile_number
    });

    return {
      success: true,
      sid: message.sid,
    }

  }
  catch (err) {
    console.log(err)
    return {
      status: false,
      message: 'Something went wrong !!'
    }
  }
}

export default sentOtp;


