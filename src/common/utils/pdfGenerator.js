import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

export const generatePDF = async (htmlContent, fileName) => {
  const folderPath = path.join(process.cwd(), "public", "uploads", "invoice");
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  const filePath = path.join(folderPath, fileName);

  const browser = await puppeteer.launch({ headless: "new" });
  // const browser = await puppeteer.launch({
  //   executablePath: "/usr/bin/chromium-browser",
  //   headless: "new",
  // });

  const page = await browser.newPage();


  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  await page.pdf({
    path: filePath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "0px",  
      bottom: "50px",
    },
  });

  await browser.close();
  return fileName;
};
