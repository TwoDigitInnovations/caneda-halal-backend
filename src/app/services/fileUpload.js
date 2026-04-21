
const multer = require("multer"),
    multerS3 = require("multer-s3");
const { S3Client } = require("@aws-sdk/client-s3");

s3 = new S3Client({
    credentials: {
        secretAccessKey: process.env.AWS_SECRET_KEY,
        accessKeyId: process.env.AWS_ACCESS_KEY,
    },
    region: process.env.BUCKET_REGION,
});

module.exports = {
     upload: multer({
    storage: multerS3({
      s3: s3,
      acl: "public-read",
      bucket: process.env.BUCKET_NAME,
      key: function (req, file, cb) {
        console.log("came in upload", file);
        let filename = file.originalname.replaceAll(" ", "");
        if (file.originalname === "blob") {
          const type = file.mimetype.split("/")[1];
          filename = `${file.originalname}.${type}`;
          console.log("came in upload", filename);
        }
        cb(null, `${new Date().getTime()}-${filename}`);
      },
    }),
  }),
};