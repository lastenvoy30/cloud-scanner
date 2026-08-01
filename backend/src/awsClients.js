const { S3Client } = require("@aws-sdk/client-s3");
const { IAMClient } = require("@aws-sdk/client-iam");
const { EC2Client } = require("@aws-sdk/client-ec2");
require("dotenv").config();

const config = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

const s3 = new S3Client(config);
const iam = new IAMClient(config);
const ec2 = new EC2Client(config);

module.exports = { s3, iam, ec2 };