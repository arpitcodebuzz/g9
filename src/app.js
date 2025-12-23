import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import cors from 'cors'
import helmet from "helmet";
import bodyParser from 'body-parser'
import passport from 'passport'
import "./common/passport/local.strategy.js";
import "./common/passport/jwt.strategy.js";
import path from 'path'
import multer from 'multer'

const app = express()

app.use(express.json({ limit: "100mb" }))
app.use(express.urlencoded({ extended: true, limit: "100mb" }))
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());
app.use(passport.initialize());
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));



// app.use(cors({
//    origin: ["https://yourfrontend.com"],
//    credentials: true
// }));


app.use(helmet());
app.use(cors({
   origin: '*',
   exposedHeaders: ["x-meta-title", "x-meta-description"]
}));

// ✅ HSTS
app.use(
   helmet.hsts({
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
   })
);

// ✅ CSP
app.use(
   helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
         "default-src": ["'self'"],
         "script-src": ["'self'", "https:"],
         "style-src": ["'self'", "https:", "'unsafe-inline'"],
         "img-src": ["'self'", "data:", "https:"],
         "font-src": ["'self'", "https:", "data:"],
         "connect-src": ["'self'", "https:"],
         "frame-ancestors": ["'self'"],
      },
   })
);

// ✅ X-Frame-Options
app.use(helmet.frameguard({ action: "sameorigin" }));

// ✅ X-Content-Type-Options
app.use(helmet.noSniff());

// ✅ Referrer-Policy
app.use(helmet.referrerPolicy({ policy: "strict-origin-when-cross-origin" }));

// ✅ Permissions-Policy (MANUAL FIX)
app.use((req, res, next) => {
   res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), fullscreen=(self)"
   );
   next();
});

import { errorHandler } from './common/config/errorhandler'
import adminSwagger from './common/config/admin.swagger.config'
import adminRoutes from './routes/admin.routes'
import userSwagger from './common/config/user.swagger.config'
import userRoutes from './routes/user.routes'

app.use("/admin/documentation", adminSwagger);
app.use('/admin-api', adminRoutes);
app.use('/user/documentation', userSwagger)
app.use('/user-api', userRoutes)
app.use(errorHandler)

// async function test() {
//    const { Convert } = require("easy-currencies");
//    const value = await Convert(100).from("INR").to("USD");

//    console.log(value);
// }

// test();


app.listen(process.env.PORT, () => {
   console.log(`Listening on (HTTP/HTTPS) ${process.env.PORT}`)
})

