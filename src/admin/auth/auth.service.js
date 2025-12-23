import { randomBytes } from 'crypto'
import knex from '../../common/config/database.config'
import jwt from 'jsonwebtoken'
import { type } from 'os'

class authService {
  async login(body) {
    try {
      const { email, password } = body

      if (email !== process.env.APPUSERNAME) {
        return {
          status: false,
          message: 'Invalid email !!'
        }
      }

      if (password !== process.env.APPUSERPASS) {
        return {
          status: false,
          message: 'Invalid password !!'
        }
      }

      if (email !== process.env.APPUSERNAME || password !== process.env.APPUSERPASS) {
        return {
          status: false,
          message: 'Invalid email or password !!'
        }
      }

      const jti = randomBytes(32).toString('hex')
      const secret_key = process.env.JWT_SECRET_KEY

      const token = await jwt.sign({
        jti,
        email,
        type: 'admin'
      }, secret_key, {
        expiresIn: '365 days'
      })

      return {
        status: true,
        message: 'Login done successfully !!',
        data: token
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

  async dashboard() {
    try {
      const totalCategory = await knex('category')
      const totalSubcategory = await knex('subCategory')
      const totalProducts = await knex('products')
      const totalBlogs = await knex('blogs')
      const totalUser = await knex('users')
      const totalFaqs = await knex('faqs')
      const totalOrder = await knex('orders')
      const totalpolicy = await knex('policy')
      const totalSlider = await knex('slider')
      const totalcontactUs = await knex('contact_us')
      const totalmedia = await knex('media')
      const totalOfferbar = await knex('offerbar')
      const totalComplaintQuery = await knex('complaintQuery')
      const totalfestivalOffer = await knex('festival')
      const totalCertificate = await knex('certificate')
      const totalReels = await knex('reels')
      const totalexploreCollection = await knex('exploreCollection')
      const totalnewArrival = await knex('newArrival')

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const todaysOrders = await knex('orders')
        .whereBetween('createdAt', [startOfDay, endOfDay]);

      let todaysReceivedPayment = 0;

      for (const order of todaysOrders) {
        if (order.paymentDetails) {
          try {
            const paymentDetail = JSON.parse(order.paymentDetails || "{}");
            // console.log(paymentDetail,'paymentDetail')

            if (paymentDetail.total) {
              todaysReceivedPayment += Number(paymentDetail.total) || 0;
            }

          } catch (err) {
            console.log(`Invalid paymentDetails for order ${order.id}:`, err.message);
          }
        }
      }

      return {
        status: true,
        message: 'Dashboard data fetched successfully !!',
        data: {
          totalCategory: totalCategory.length,
          totalSubcategory: totalSubcategory.length,
          totalProducts: totalProducts.length,
          totalBlogs: totalBlogs.length,
          totalUser: totalUser.length,
          totalFaqs: totalFaqs.length,
          totalOrders: totalOrder.length,
          totalpolicy: totalpolicy.length,
          totalSlider: totalSlider.length,
          totalcontactUs: totalcontactUs.length,
          totalmedia: totalmedia.length,
          totalOfferbar: totalOfferbar.length,
          totalComplaintQuery: totalComplaintQuery.length,
          totalfestivalOffer: totalfestivalOffer.length,
          totalCertificate: totalCertificate.length,
          todaysOrders: todaysOrders.length,
          todaysReceivedPayment: todaysReceivedPayment,
          totalReels:totalReels.length,
          totalexploreCollection:totalexploreCollection.length,
          totalnewArrival:totalnewArrival.length
        }
      }
    }
    catch (err) {
      console.log(err)
      return {
        status: false,
        message: 'Soemthing went wrong !!'
      }
    }
  }
}

export default new authService()