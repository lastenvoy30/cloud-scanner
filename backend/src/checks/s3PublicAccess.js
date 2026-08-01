const {
  ListBucketsCommand,
  GetBucketPolicyStatusCommand,
} = require("@aws-sdk/client-s3");
const { s3 } = require("../awsClients");

async function checkS3PublicAccess() {
  const findings = [];
  const { Buckets } = await s3.send(new ListBucketsCommand({}));

  for (const bucket of Buckets) {
    try {
      const policyStatus = await s3.send(
        new GetBucketPolicyStatusCommand({ Bucket: bucket.Name })
      );

      if (policyStatus.PolicyStatus?.IsPublic) {
        findings.push({
          check: "S3 Public Bucket",
          resource: bucket.Name,
          severity: "CRITICAL",
          description: `Bucket "${bucket.Name}" is publicly accessible`,
          remediation: `Run: aws s3api put-public-access-block --bucket ${bucket.Name} --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true`,
        });
      }
    } catch (err) {

      continue;
    }
  }

  return findings;
}

module.exports = checkS3PublicAccess;