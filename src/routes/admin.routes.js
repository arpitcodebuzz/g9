import { Router } from "express";
const routes = Router()
import authRoutes from '../admin/auth/auth.router.js'
import categoryRoutes from '../admin/category/category.router'
import subcategoryRoutes from '../admin/sub-category/subcategory.router'
import userRoutes from '../admin/users/user.router'
import productRoutes from '../admin/products/products.router'
import blogRoutes from '../admin/blogs/blogs.router'
import contactRoutes from '../admin/contact-us/contact.router'
import faqRoutes from '../admin/faq/faq.router'
import sliderRoutes from '../admin/slider/slider.router'
import metalRoutes from '../admin/metals/metals.router'
import shapeRoutes from '../admin/stone-shape/stoneShape.router'
import goldPurityRoutes from '../admin/gold-purity/goldPurity.router'
import policyRoutes from '../admin/policy/policy.router'
import orderRoutes from '../admin/order/order.router.js'
import offerbar from '../admin/offerbar/offerbar.router.js'
import complaintRoutes from '../admin/complaint-Query/complaint.router.js'
import mediaRoutes from '../admin/media/media.router.js'
import certificateRoutes from '../admin/certificate/certificate.router'
import festivalRoutes from '../admin/festival/festival.router'
import settingRoutes from '../admin/settings/setting.router'
import rolesRoutes from '../admin/roles/roles.router.js'
import exploreRoutes from '../admin/explore-collection/explore.router.js'
import reelRoutes from '../admin/reels/reels.router.js'
import newArrivalRoutes from '../admin/newArrival/newArrival.router.js'
import seoRoutes from '../admin/seo/seo.router.js'

routes.use('/auth', authRoutes)
routes.use('/category', categoryRoutes)
routes.use('/subcategory', subcategoryRoutes)
routes.use('/user', userRoutes)
routes.use('/products', productRoutes)
routes.use('/blogs', blogRoutes)
routes.use('/contact-us', contactRoutes)
routes.use('/faq', faqRoutes)
routes.use('/slider', sliderRoutes)
routes.use('/metals', metalRoutes)
routes.use('/stoneShape', shapeRoutes)
routes.use('/goldPurity', goldPurityRoutes)
routes.use('/policy',policyRoutes)
routes.use('/order',orderRoutes)
routes.use('/offerbar',offerbar)
routes.use('/complaint',complaintRoutes)
routes.use('/media',mediaRoutes)
routes.use('/certificate',certificateRoutes)
routes.use('/festival',festivalRoutes)
routes.use('/settings',settingRoutes)
routes.use('/roles',rolesRoutes)
routes.use('/exploreCollection',exploreRoutes)
routes.use('/reels',reelRoutes)
routes.use('/newArrival',newArrivalRoutes)
routes.use('/seo',seoRoutes)

export default routes;