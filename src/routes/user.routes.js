import { Router } from "express";
const routes = Router()
import userRoutes from '../users/auth/auth.router'
import blogsRoutes from '../blogs/blogs.router'
import accountRoutes from '../account-overview/account.router'
import addressManage from '../manage-address/address.router'
import wishlistRoutes from '../wishlist/wishlist.router';
import contactRoutes from '../contact-us/contact.router'
import cartRoutes from '../cart/cart.router';
import productRoutes from '../products/products.router'
import faqRoutes from '../faq/faq.router'
import sliderRoutes from '../slider/slider.router'
import policyRoutes from '../policy/policy.router'
import changePasswordRoutes from '../changePassword/changepassword.router'
import paymentRoutes from '../payment/payment.router'
import orderRoutes from '../orders/order.router'
import complaint from '../complaint-Query/complaint.router'
import homeRoutes from '../Home/home.router'
import chatbotRoutes from '../chat-bot/chatbot.router'
import savedRoutes from '../productSaved/productSaved.router'
import askPriceRoutes from '../ask-price/ask-price.router'

routes.use('/user', userRoutes)
routes.use('/blogs', blogsRoutes)
routes.use('/account', accountRoutes)
routes.use('/ManageAddress', addressManage)
routes.use('/wishlist', wishlistRoutes)
routes.use('/contact-us', contactRoutes)
routes.use('/cart', cartRoutes)
routes.use('/products', productRoutes)
routes.use('/faq', faqRoutes)
routes.use('/slider', sliderRoutes)
routes.use('/policy', policyRoutes)
routes.use('/changePassword', changePasswordRoutes)
routes.use('/payment', paymentRoutes)
routes.use('/order', orderRoutes)
routes.use('/complaintQuery', complaint)
routes.use('/home', homeRoutes)
routes.use('/chatBot', chatbotRoutes)
routes.use('/productSaved', savedRoutes)
routes.use('/ask-price', askPriceRoutes)


export default routes