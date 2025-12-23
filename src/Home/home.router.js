import { Router } from "express";
const routes = Router()
import homeController from './home.controller'


routes.get('/offerbarlist', homeController.offerbarlist)

routes.get('/mediaList', homeController.mediaList)

// routes.post('/generateLink', homeController.createlink)
// routes.get("/product-details/share/:shareId", homeController.getSharedProduct);


// routes.get('/product/:id', homeController.getProductById);
// routes.get('/productRedirect/:id', homeController.redirectTo);





routes.post('/generate', homeController.generateLink);
routes.get('/link/:uniqueId', homeController.redirectLink);



routes.get('/certificateList', homeController.certificateList)
routes.get('/festivalList', homeController.festivalList)


routes.get('/reelsList', homeController.reelsList)
routes.get('/exploreList', homeController.exploreList)
routes.get('/newArrivalList', homeController.newArrivalList)


routes.get('/seoList',homeController.seoList)
routes.get('/seoDetail/:pageName',homeController.seoDetail)


export default routes;

