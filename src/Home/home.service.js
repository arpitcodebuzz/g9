import knex from "../common/config/database.config";
import mediaresource from '../admin/media/resources/media.resource'
import { nanoid } from "nanoid";
import dotenv from 'dotenv'

import { v4 as uuidv4 } from 'uuid';

const shares = new Map();
function generateShortId() {
  const fullUUID = uuidv4();
  const shortId = fullUUID.replace(/-/g, '').substring(0, 8); // "8dfd47db"
  return shortId;
}


class homeService {
  async offerbarlist() {
    try {
      const data = await knex('offerbar').orderBy('createdAt', 'desc')
      if (!data) {
        return {
          status: true,
          message: 'No data found !!'
        }
      }

      return {
        status: true,
        message: 'offerbar list fetched successfully !!',
        data: data,
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

  async mediaList(query) {
    try {
      const { perPage, page } = query;

      const paginateData = await knex('media')
        .select()
        .orderBy('createdAt', 'desc')
        .paginate({
          perPage: perPage ? parseInt(perPage) : 10,
          currentPage: page ? parseInt(page) : 1,
          isLengthAware: true
        });

      const mediaData = paginateData.data.map((data) => new mediaresource(data));

      return {
        status: true,
        message: 'Media list fetched successfully !!',
        data: mediaData,
        pagination: paginateData.pagination
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

  // async createLink(req) {
  //   try {
  //     const { productId } = req.body;

  //     if (!productId) {
  //       return {
  //         status: false,
  //         message: 'productId is required !!'
  //       };
  //     }

  //     const product = await knex('products').where({ id: productId }).first();

  //     if (!product) {
  //       return {
  //         status: false,
  //         message: 'Product not found !!'
  //       };
  //     }

  //     const id = nanoid(10);
  //     shares.set(id, product);

  //     const baseUrl = 'https://2prbc8z4-5001.inc1.devtunnels.ms' || `${req.protocol}://${req.get('host')}`;
  //     const link = `${baseUrl}/share/${id}`;

  //     return {
  //       status: true,
  //       message: 'Share link generated successfully !!',
  //       id,
  //       link
  //     };
  //   } catch (err) {
  //     console.error(err);
  //     return {
  //       status: false,
  //       message: 'Something went wrong !!'
  //     };
  //   }
  // }

  // async getSharedProduct(id) {
  //   try {
  //     console.log("Looking up share ID:", id);

  //     if (!shares.has(id)) {
  //       console.log("Share ID not found or expired:", id);
  //       return { status: false, message: "Invalid or expired link !!" };
  //     }

  //     const product = shares.get(id);
  //     const productUrl = `https://gxbbvmt5-5173.inc1.devtunnels.ms/product-details/${product.id}`;
  //     console.log("Found product, redirect URL:", productUrl);

  //     return { status: true, url: productUrl };

  //   } catch (err) {
  //     console.error("Error in getSharedProduct service:", err);
  //     return {
  //       status: false,
  //       message: "Something went wrong !!"
  //     };
  //   }
  // }


  // async generateProductDeepLink(id) {
  //   try {
  //     const product = await knex("products").where({ id: id }).first();

  //     if (!product) {
  //       return {
  //         success: false,
  //         message: "Product not found",
  //       };
  //     }

  //     const baseUrl = process.env.BASE_URL || "https://2prbc8z4-5001.inc1.devtunnels.ms";

  //     const deepLink = `${baseUrl}/product-details/${product.id}`;

  //     return {
  //       success: true,
  //       productId: product.id,
  //       deepLink,
  //     };
  //   }
  //   catch (err) {
  //     return {
  //       status: false,
  //       message: 'Something went wrong'
  //     }
  //   }
  // }


  // async getProductRedirectLink(id) {
  //   try {
  //     const product = await knex('products').where({ id }).first();

  //     if (!product) return null;

  //     const frontendBaseUrl = 'https://gxbbvmt5-5173.inc1.devtunnels.ms';
  //     return `${frontendBaseUrl}/product-details/${id}`;
  //   }
  //   catch (err) {
  //     console.log(err)
  //     return {
  //       status: false,
  //       message: 'Something went wrong !!'
  //     }
  //   }
  // }



  async generateLink(productId) {
    const existingLink = await knex('productLinks')
      .where({ productId })
      .first();

    if (existingLink) {
      return existingLink.uniqueId;
    }

    const uniqueId = generateShortId();

    await knex('productLinks').insert({
      productId,
      uniqueId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });



    return uniqueId;
  }


  async getProductIdByUniqueId(uniqueId) {
    const record = await knex('productLinks').where({ uniqueId }).first();
    return record ? record.productId : null;
  }

  async certificateList() {
    try {
      const data = await knex('certificate').select().orderBy('createdAt', 'desc');
      // console.log(data)

      if (!data || data.length === 0) {
        return {
          status: false,
          message: 'Certificate not found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;

      const formattedData = data.map(item => ({
        ...item,
        image: item.image ? `${baseUrl}/uploads/certificate/${item.image}` : null,
        logo: item.logo ? `${baseUrl}/uploads/logo/${item.logo}` : null
      }));

      return {
        status: true,
        message: 'Certificate fetched successfully !!',
        data: formattedData
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong'
      };
    }
  }

  async festivalList() {
    try {
      const data = await knex('festival').select().orderBy('createdAt', 'desc')
      if (!data) {
        return {
          status: false,
          message: 'image not found !!'
        }
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;
      const image = data.map(item => ({
        ...item,
        image: item.image ? `${baseUrl}/uploads/festival/${item.image}` : null
      }))


      return {
        status: true,
        message: 'Image fetched successfully !!',
        data: image
      }

    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'Something went wrong '
      }
    }
  }


  async reelsList() {
    try {
      const data = await knex('reels').select().orderBy('createdAt', 'desc');

      if (!data || data.length === 0) {
        return {
          status: true,
          message: 'Reels not found !!',
          data: []
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;

      const formattedData = data.map(item => ({
        id: item.id,
        redirectUrl: item.redirectUrl,
        video: item.video ? `${baseUrl}/uploads/reels/${item.video}` : null,
        createdAt: item.createdAt
      }));

      return {
        status: true,
        message: 'Reels fetched successfully !!',
        data: formattedData
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong'
      };
    }
  }


  async exploreList() {
    try {
      const data = await knex('exploreCollection').select().orderBy('createdAt', 'desc');

      if (!data || data.length === 0) {
        return {
          status: false,
          message: 'explore Collection not found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;

      const formattedData = data.map(item => ({
        ...item,
        image: item.image ? `${baseUrl}/uploads/exploreImg/${item.image}` : null
      }));

      return {
        status: true,
        message: 'collection fetched successfully !!',
        data: formattedData
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong'
      };
    }
  }


  async newArrivalList() {
    try {
      const data = await knex('newArrival').select().orderBy('createdAt', 'desc');
      // console.log(data)
      if (!data || data.length === 0) {
        return {
          status: true,
          message: 'newArrival not found !!'
        };
      }

      const baseUrl = process.env.PRODUCT_BASE_URL;

      const formattedData = data.map(item => ({
        ...item,
        banner: item.banner ? `${baseUrl}/uploads/newArrival/${item.banner}` : null
      }));

      return {
        status: true,
        message: 'newArrival fetched successfully !!',
        data: formattedData
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong'
      };
    }
  }

  async seoList() {
    try {
      const data = await knex('seo').select().orderBy('createdAt', 'desc');

      if (!data) {
        return {
          status: true,
          message: 'No data found !!'
        }
      }

      return {
        status: true,
        message: 'Data fetched successfully !!',
        data: data
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

  async seoDetail(params) {
    try {
      const { pageName } = params
      const data = await knex('seo').where('pageName', pageName).first();
      if (!data) {
        return {
          status: true,
          message: 'No data found !!'
        }
      }

      return {
        status: true,
        message: 'Data fetched successfully !!',
        data: data
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

  
  async sentOtp(body) {
    try {
      const { email_Mobile } = body

      if (!email_Mobile) {
        return {
          status: false,
          message: 'Email or mobileNumber is required !!'
        }
      }

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_Mobile);
      const isMobile = /^[6-9]\d{9}$/.test(email_Mobile);

      let isUser;
      let otp;
      const otpExpireTime = moment().add(2, "minutes").format();

      const generateOtp = () =>
        process.env.NODE_ENV === "development"
          ? 123456
          : Math.floor(100000 + Math.random() * 900000);

      if (isEmail) {
        isUser = await knex('users').where({ email: email_Mobile }).first();

        if (!isUser) {
          return {
            status: false,
            message: 'User not found with this email !!'
          };
        }

        otp = generateOtp();

        if (email_Mobile === "testapp@gmail.com") {
          otp = 123456;
        } else {
          const emailResponse = await sendDeleteAccountOtpEmail(email_Mobile, otp);
          if (!emailResponse) {
            return {
              status: false,
              message: 'Failed to send OTP via email'
            };
          }
        }
      }

      if (isMobile) {
        isUser = await knex('users').where({ Mobile_number: email_Mobile }).first();

        if (!isUser) {
          return {
            status: false,
            message: 'User not found with this mobile number !!'
          };
        }

        otp = generateOtp();

        const formattedNumber = email_Mobile.startsWith('+')
          ? email_Mobile
          : `+91${email_Mobile}`;

        const response = await sentOtp(formattedNumber, otp);

        if (!response?.success) {
          return {
            status: false,
            message: 'Failed to send OTP via SMS'
          };
        }
      }

      await knex('users')
        .where({ id: isUser.id })
        .update({
          otp: otp,
          otpExpireTime: otpExpireTime,
          lastOtpChannel: isEmail ? 'email' : 'sms',
          updatedAt: knex.fn.now()
        });

      return {
        status: true,
        message: `OTP sent successfully via ${isEmail ? 'email' : 'sms'}`
      };


    }
    catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      }
    }
  }

  async deleteAccount(body) {
    try {
      const { otp, email_Mobile } = body;

      if (!email_Mobile || !otp) {
        return {
          status: false,
          message: 'Email/Mobile and OTP are required !!'
        };
      }

      const currentTime = moment().format();

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_Mobile);
      const isMobile = /^[6-9]\d{9}$/.test(email_Mobile);

      if (!isEmail && !isMobile) {
        return {
          status: false,
          message: 'Invalid email or mobile number'
        };
      }

      const isUser = await knex('users')
        .where(isEmail ? { email: email_Mobile } : { Mobile_number: email_Mobile })
        .first();

      if (!isUser) {
        return {
          status: false,
          message: 'User not found !!'
        };
      }

      if (isUser.lastOtpChannel === 'email' && !isEmail) {
        return {
          status: false,
          message: 'Please verify using email (OTP was sent to email)'
        };
      }

      if (isUser.lastOtpChannel === 'sms' && !isMobile) {
        return {
          status: false,
          message: 'Please verify using mobile number (OTP was sent via SMS)'
        };
      }
      if (currentTime > isUser.otpExpireTime) {
        return {
          status: false,
          message: 'OTP expired !!'
        };
      }

      if (otp.toString() !== isUser.otp) {
        return {
          status: false,
          message: 'Invalid OTP'
        };
      }

      await knex('users')
        .where({ id: isUser.id })
        .update({
          otp: null,
          otpExpireTime: null,
          lastOtpChannel: null,
          updatedAt: knex.fn.now()
        });

      await knex('users').where({ id: isUser.id }).del();


      return {
        status: true,
        message: 'OTP verified successfully !!',
        data: {
          userId: isUser.id,
          verifiedVia: isEmail ? 'email' : 'sms'
        }
      };

    } catch (err) {
      console.log(err);
      return {
        status: false,
        message: 'Something went wrong !!'
      };
    }
  }


}






export default new homeService()