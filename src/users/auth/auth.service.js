import knex from '../../common/config/database.config'
import bcrypt from 'bcrypt'
import moment from 'moment'
import AccessTokensService from '../access-tokens/access-token'
import RefreshTokensService from '../refresh-tokens/refresh-token'
import { decode } from 'jsonwebtoken'
import sentOtp from '../../twilio/otpService'
import { sendWhatsappOtp } from '../../twilio/whatsapp.otp'
import { sendOtpEmail } from '../../common/config/nodemailer.config'
import { sendWelcomeEmail } from '../../common/config/nodemailer.config'

class authService {
  async signUp(body) {
    try {
      const { name, email, password, Mobile_number, ConfirmPassword, registrationType } = body

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          status: false,
          message: 'Invalid email format'
        };
      }


      const isUser = await knex('users').where('email', email).first();

      if (isUser) {
        return {
          status: false,
          message: 'Email already exist !!'
        }
      }

      const isUsers = await knex('users').where({ Mobile_number }).first()
      if (isUsers) {
        return {
          status: false,
          message: 'Mobile Number already exists !!'
        }
      }

      if (password !== ConfirmPassword) {
        return {
          status: false,
          message: 'Password and Confirmpassword not matched !!'
        }
      }

      const hashedpass = await bcrypt.hash(password, 2)
      // var otp;
      // if (process.env.NODE_ENV !== "production") {
      //   otp = 123456;
      // } else {
      //   otp = Math.floor(100000 + Math.random() * 900000);
      // }

      await knex("users").insert({
        name: name,
        email: email,
        password: hashedpass,
        Mobile_number: Mobile_number,
        registrationType: registrationType,
        status: "Active",
        step: "1",
        updatedAt: knex.fn.now(),
      });

      return {
        status: true,
        message: "User registered successfully !!"
      };
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'Something went wrong !!'
      }
    }
  }

  // async signUpWithGoogle(body) {
  //   try {
  //     const { email } = body;

  //     if (!email) {
  //       return {
  //         status: false,
  //         message: 'Enter your email !!',
  //       };
  //     }

  //     const isUser = await knex('users').where("email", email).first();
  //     if (isUser) {
  //       return {
  //         status: false,
  //         message: 'Email already exists !!',
  //       };
  //     }

  //     await knex('users').insert({
  //       email: email,
  //       status: 'Active',
  //       providerType: "google",
  //       step: '2',
  //       createdAt: knex.fn.now(),
  //       updatedAt: knex.fn.now(),
  //     });

  //     const user = await knex('users').where({ email }).first();

  //     const accesstoken = await AccessTokensService.createToken(user.id, email);
  //     const decodeToken = decode(accesstoken);

  //     const refreshToken = await RefreshTokensService.createToken(
  //       decodeToken.jti,
  //       decodeToken.exp
  //     );

  //     return {
  //       status: true,
  //       message: "Successfully Registered !!",
  //       authentication: {
  //         accesstoken,
  //         refreshToken,
  //         expireAt: decodeToken.exp,
  //       },
  //     };
  //   }
  //   catch (err) {
  //     console.log(err);
  //     return {
  //       status: false,
  //       message: 'Something went wrong !!',
  //     };
  //   }
  // }

  async otpMethod(body) {
    try {
      const { type, email, Mobile_number } = body;
      if (!type) {
        return {
          status: false,
          message: 'Type is required !!'
        };
      }

      let isUser;
      let otp;
      let otpExpireTime = moment().add(2, "minutes").format();

      const generateOtp = () =>
        process.env.NODE_ENV === "development"
          ? 123456
          : Math.floor(100000 + Math.random() * 900000);

      if (type === 'email') {
        if (!email) {
          return {
            status: false,
            message: 'Email is required !!'
          };
        }
        isUser = await knex('users').where({ email }).first();

        if (!isUser) {
          return {
            status: false,
            message: 'User not found with this email !!'
          };
        }
        otp = generateOtp();
        console.log('Sending OTP to email:', email);

        const emailResponse = await sendOtpEmail(email, otp);

        if (!emailResponse?.success) {
          return { status: false, message: 'Failed to send OTP via email' };
        }


      }
      else if (type === 'sms') {
        if (!Mobile_number) {
          return {
            status: false,
            message: 'Mobile number is required !!'
          };
        }

        isUser = await knex('users').where({ Mobile_number }).first();

        if (!isUser) {
          return {
            status: false,
            message: 'User not found with this mobile number !!'
          };
        }

        otp = generateOtp();

        let response;
        const formattedNumber = Mobile_number.startsWith('+') ? Mobile_number : `+91${Mobile_number}`;

        if (type === 'sms') {
          response = await sentOtp(formattedNumber, otp);
        }

        if (!response.success) {
          return {
            status: false,
            message: `Failed to send OTP via Sms`
          };
        }
      }

      else if (type === 'whatsapp') {
        if (!Mobile_number) {
          return { status: false, message: 'Mobile number is required !!' };
        }

        isUser = await knex('users').where({ Mobile_number }).first();
        if (!isUser) {
          return { status: false, message: 'User not found with this mobile number !!' };
        }

        otp = generateOtp();

        const formattedNumber = Mobile_number.startsWith('+')
          ? Mobile_number
          : `+91${Mobile_number}`;

        const response = await sendWhatsappOtp(formattedNumber, otp);

        if (!response.status) {
          return {
            status: false,
            message: `Failed to send OTP via WhatsApp: ${response.message}`
          };
        }
      }

      else {
        return {
          status: false,
          message: 'Invalid type !!'
        };
      }

      await knex('users')
        .where({ id: isUser.id })
        .update({
          otp: otp,
          otpExpireTime: otpExpireTime,
          lastOtpChannel: type,
          updatedAt: knex.fn.now()
        });

      return {
        status: true,
        message: "OTP sent successfully !!"
      };

    }
    catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }

  async otpVerification(body) {
    try {
      const { otp, email, Mobile_number } = body
      const currentTime = moment().format()

      var isUser;
      if (email) {
        isUser = await knex('users').where({ email }).first();
      }
      else {
        isUser = await knex('users').where({ Mobile_number }).first();
      }
      if (!isUser) {
        return {
          status: false,
          message: 'User not found !!'
        }
      }

      if (isUser.lastOtpChannel === 'sms' && Mobile_number !== isUser.Mobile_number) {
        return { status: false, message: 'Please verify with mobile number (SMS OTP was sent)' };
      }
      if (isUser.lastOtpChannel === 'email' && email !== isUser.email) {
        return { status: false, message: 'Please verify with email (Email OTP was sent)' };
      }
      if (isUser.lastOtpChannel === 'whatsapp' && Mobile_number !== isUser.Mobile_number) {
        return { status: false, message: 'Please verify with mobile number (WhatsApp OTP was sent)' };
      }

      if (isUser.lastOtpChannel === "email" && step === "2" && isUser.Otp_Verification !== "Completed") {
        await sendWelcomeEmail(isUser.email, isUser.name || "Customer");
      }

      if (currentTime > isUser.otpExpireTime) {
        return {
          status: false,
          message: 'Otp expired !!'
        }
      }

      if (otp.toString() !== isUser.otp) {
        return {
          status: false,
          message: "Invalid OTP",
        };
      }

      const accessToken = await AccessTokensService.createToken(
        isUser.id,
        isUser.email
      );

      const decodeToken = decode(accessToken);

      const refreshToken = await RefreshTokensService.createToken(
        decodeToken.jti,
        decodeToken.exp
      );

      let updateFields = {
        otp: null,
        otpExpireTime: null,
        lastOtpChannel: null,
        updatedAt: knex.fn.now(),
      };

      if (isUser.lastOtpChannel === 'email') {
        updateFields.Otp_Verification = 'Completed'

        if (isUser.Otp_Verification !== 'Completed') {
          await sendWelcomeEmail(isUser.email, isUser.name || 'Customer');
        }
      }
      else if (isUser.lastOtpChannel === 'sms') {
        updateFields.mobile_Otp_Verification = 'Completed'
      }
      else if (isUser.lastOtpChannel === 'whatsapp') {
        updateFields.whatsapp_Otp_Verification = 'Completed';
      }

      let step = isUser.step;
      let isForgotPassword;


      if (!isForgotPassword) {
        if (isUser.step === "1") {
          // var mobile_otp;

          // if (process.env.NODE_ENV !== "production") {
          //   mobile_otp = "123456";
          // }
          // else {
          //   mobile_otp = Math.floor(100000 + Math.random() * 900000).toString();
          // }

          // const mobile_otp_expire_time = moment().add(2, "minutes").format();

          // await knex("users").where({ id: isUser.id }).update({
          //   mobile_otp,
          //   mobile_otp_expire_time,
          //   step: "2",
          // });

          step = "2";
        }
        else if (isUser.step === "2") {
          step = "2";
        }
      }

      updateFields.step = step


      await knex("users")
        .update(updateFields)
        .where("id", isUser.id);

      return {
        status: true,
        message: "OTP verified successfully !!",
        data: {
          type: isUser.ProviderType,
          authentication: {
            accessToken,
            refreshToken,
            expireAt: decodeToken.exp,
          },
        },
      };

    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: "something went wrong !!"
      }
    }
  }

  async userAddress(authUser, body) {
    try {
      const { address_line_1, address_line_2, city, state, country, postal_code, address_type } = body
      const existing = await knex('user_address').where({ user_id: authUser.id })

      if (existing.length > 0) {
        await knex('user_address').where({ user_id: authUser.id }).update({ primary: 0 })
      }

      await knex('user_address').insert({
        user_id: authUser.id,
        address_line_1,
        address_line_2,
        city,
        state,
        country,
        postal_code,
        address_type,
        primary: 1
      })

      return {
        status: true,
        message: "User Address added successfully !!"
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

  async signIn(body) {
    try {
      const { email, password, Mobile_number } = body

      let isUser;

      if (email) {
        isUser = await knex('users').where({ email: email }).first()
      }
      else if (Mobile_number) {
        isUser = await knex('users').where({ Mobile_number: Mobile_number }).first()
      }

      if (!isUser) {
        return {
          status: false,
          message: 'User does not exits !!'
        }
      }

      if (isUser.status !== "Active") {
        return {
          status: false,
          message: "Your account is not active",
        };
      }

      if (isUser.ProviderType !== "manual") {
        return {
          status: false,
          message: 'Please use Google Sign-In to access this account. This account was created via Google authentication.'
        }
      }

      // if (isUser.step == 1) {
      //   var otp;
      //   if (process.env.NODE_ENV !== "production") {
      //     otp = 123456;
      //   } else {
      //     otp = Math.floor(100000 + Math.random() * 900000);
      //   }

      //   const otpExpireTime = moment().add(2, "minutes").format();

      //   await knex("users").where({ id: isUser.id }).update({
      //     otp: otp,
      //     otpExpireTime: otpExpireTime,
      //     updatedAt: knex.fn.now(),
      //   });

      //   return {
      //     status: true,
      //     message: "A verification code has been sent to your email. Please verify the code to proceed.",
      //     data: isUser,
      //   }
      // }

      const match = await bcrypt.compare(password, isUser.password);
      if (!match) {
        return {
          status: false,
          message: "Invalid password",
        };
      }

      if (isUser.step == 1) {
        return {
          status: true,
          message: "Proceed to verification step before login.",
          authentication: {
            type: isUser.ProviderType,
            accessToken: null,
            refreshToken: null
          },
        };
      }

      const accessToken = await AccessTokensService.createToken(
        isUser.id,
        isUser.email
      );

      const decodedToken = decode(accessToken);

      const refreshToken = await RefreshTokensService.createToken(
        decodedToken.jti,
        decodedToken.exp
      );

      return {
        status: true,
        message: "Login successfully !!",
        data: {
          authentication: {
            accessToken,
            refreshToken,
            expireAt: decodedToken.exp,
          },
        },
      };

    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'Something went wrong !!'
      }
    }
  }

  async signInOrSignUpWithGoogle(body) {
    try {
      const { email, Mobile_number, name } = body;
      // console.log("Google SignInOrSignUp body:", body);


      if (!email) {
        return {
          status: false,
          message: "Email is required.",
        };
      }

      let user = await knex("users").where({ email }).first();

      if (!user) {
        // New user → sign up with Google
        const [userId] = await knex("users").insert({
          email,
          Mobile_number,
          name,
          ProviderType: "google",
          status: "Active",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        // console.log('User inserted with id:', userId);

        user = await knex("users").where({ id: userId }).first();
      } else {
        // Existing user → validate status and provider
        if (user.status !== "Active") {
          return {
            status: false,
            message: "Your account is not active.",
          };
        }

        if (user.ProviderType !== "google") {
          return {
            status: false,
            message: "This email is not registered with Google login.",
          };
        }
      }

      // Generate access + refresh tokens
      const accessToken = await AccessTokensService.createToken(
        user.id,
        user.email,
        "user"
      );

      const decoded = decode(accessToken);

      const refreshToken = await RefreshTokensService.createToken(
        decoded.jti,
        decoded.exp
      );

      return {
        status: true,
        message: "Login successful.",
        data: {
          ...user,
          authentication: {
            accessToken,
            refreshToken,
            expireAt: decoded.exp,
          },
        },
      };
    } catch (error) {
      console.error("Google SignIn/SignUp Error:", error);
      return {
        status: false,
        message: "Something went wrong while signing in with Google.",
      };
    }
  }


  async forgetPassword(body) {
    try {
      const { email, Mobile_number } = body;

      // if (!['email', 'sms', 'whatsapp'].includes(type)) {
      //   return {
      //     status: false,
      //     message: 'Invalid type! Use "email" or "Mobile_number".'
      //   };
      // }



      let isUser
      if (email) {
        isUser = await knex('users').where({ email: email }).first()
      }
      else if (Mobile_number) {
        isUser = await knex('users').where({ Mobile_number: Mobile_number }).first()
      }


      if (!isUser) {
        return {
          status: false,
          message: 'User does not exists !!'
        };
      }

      if ((isUser.ProviderType || '').toLowerCase() === 'google') {
        return {
          status: false,
          message: 'Password change is not allowed for Google sign-in users.'
        };
      }

      return {
        status: true,
        message: "Verify otp to reset your password !!"
      };

    }
    catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong!!'
      };
    }
  }


  async changePassword(authUser, body) {
    try {
      const { password, ConfirmPassword } = body

      const isUser = await knex('users').where({ id: authUser.id }).first()
      if (!isUser) {
        return {
          status: false,
          message: 'Email does not exist !'
        }
      }


      if (password !== ConfirmPassword) {
        return {
          status: false,
          message: 'Password and Confirmpassword not match !!'
        }
      }

      const hashpass = await bcrypt.hash(password, 3)
      await knex('users').update({
        password: hashpass,
        updatedAt: knex.fn.now()
      })
        .where("id", authUser.id)

      return {
        status: true,
        message: 'Password changed Successfully !!'
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

  async resendOtp(body) {
    try {
      const { email, Mobile_number, type } = body;

      if (!['email', 'sms', 'whatsapp'].includes(type)) {
        return {
          status: false,
          message: 'Invalid type!.'
        };
      }

      let isUser;
      if (type === 'email' && email) {
        isUser = await knex('users').where({ email }).first();
      } else if (type === 'sms' || type === 'whatsapp') {
        isUser = await knex('users').where({ Mobile_number }).first();
      }

      if (!isUser) {
        return {
          status: false,
          message: 'User does not exist !!'
        };
      }

      const otp = process.env.NODE_ENV !== 'development'
        ? '123456'
        : Math.floor(100000 + Math.random() * 900000).toString();

      const otpExpireTime = moment().add(2, 'minutes').format();

      const updateFields = {
        updatedAt: knex.fn.now(),
        lastOtpChannel: type
      };

      if (type === 'email') {
        updateFields.otp = otp;
        updateFields.otpExpireTime = otpExpireTime;
      }
      else if (type === 'sms') {
        updateFields.otp = otp;
        updateFields.otpExpireTime = otpExpireTime;
      }
      else if (type === 'whatsapp') {
        updateFields.otp = otp;
        updateFields.otpExpireTime = otpExpireTime
      }

      await knex('users').where({ id: isUser.id }).update(updateFields);

      return {
        status: true,
        message: `OTP resent successfully to ${type === 'email' ? 'email' : 'mobile number'}.`
      };

    }
    catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }


  // async MobileOtpVerification(body) {
  //   try {
  //     const { Mobile_number, mobile_otp } = body;
  //     const currentTime = moment().format();

  //     const isUser = await knex('users').where({ Mobile_number: Mobile_number }).first();


  //     if (!isUser) {
  //       return {
  //         status: false,
  //         message: 'Mobile number does not exist !!'
  //       };
  //     }

  //     if (!isUser.mobile_otp || !isUser.mobile_otp_expire_time) {
  //       return {
  //         status: false,
  //         message: 'No OTP found. Please request a new one.',
  //       };
  //     }

  //     if (currentTime > isUser.mobile_otp_expire_time) {
  //       return {
  //         status: false,
  //         message: 'OTP expired !!'
  //       };
  //     }

  //     if (mobile_otp?.toString().trim() !== isUser.mobile_otp.toString().trim()) {
  //       return {
  //         status: false,
  //         message: "Invalid OTP",
  //       };
  //     }



  //     await knex('users')
  //       .update({
  //         mobile_otp: null,
  //         mobile_otp_expire_time: null,
  //         step: '3',
  //         mobile_Otp_Verification: 'Completed',
  //         updatedAt: knex.fn.now()
  //       })
  //       .where({ id: isUser.id });

  //     if (isUser.step === '3') {
  //       const accessToken = await AccessTokensService.createToken(
  //         isUser.id,
  //         isUser.email
  //       );

  //       const decodeToken = decode(accessToken);

  //       const refreshToken = await RefreshTokensService.createToken(
  //         decodeToken.jti,
  //         decodeToken.exp
  //       );

  //       return {
  //         status: true,
  //         message: 'Mobile OTP re-verified successfully',
  //         authentication: {
  //           accessToken,
  //           refreshToken,
  //           expireAt: decodeToken.exp
  //         }
  //       };
  //     }
  //     return {
  //       status: true,
  //       message: 'Mobile OTP verified successfully. Step 3 completed!'
  //     };


  //   }
  //   catch (err) {
  //     console.error("Mobile OTP Error:", err);
  //     return {
  //       status: false,
  //       message: 'Something went wrong !!'
  //     };
  //   }
  // }

  async signOut(authUser) {
    try {
      console.log(authUser)
      const data = await knex('users').where({ id: authUser.id }).first()
      if (!data) {
        return {
          status: false,
          message: 'No data found !!'
        }
      }

      console.log(authUser.id)
      await knex('user_access_token').where({ userId: authUser.id, id: authUser.jti }).update({
        revoked: true
      })

      return {
        status: true,
        message: "Logged out Successfully !!"
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


}


export default new authService()