const {
  ListUsersCommand,
  ListAttachedUserPoliciesCommand,
} = require("@aws-sdk/client-iam");
const { iam } = require("../awsClients");

async function checkIamOverPrivileged() {
  const findings = [];
  const { Users } = await iam.send(new ListUsersCommand({}));

  for (const user of Users) {
    const { AttachedPolicies } = await iam.send(
      new ListAttachedUserPoliciesCommand({ UserName: user.UserName })
    );

    const hasAdmin = AttachedPolicies.some(
      (p) => p.PolicyName === "AdministratorAccess"
    );

    if (hasAdmin) {
      findings.push({
        check: "Over-Privileged IAM User",
        resource: user.UserName,
        severity: "HIGH",
        description: `User "${user.UserName}" has AdministratorAccess attached directly`,
        remediation: `Remove AdministratorAccess from ${user.UserName}; assign a least-privilege policy scoped to only what this user actually needs`,
      });
    }
  }

  return findings;
}

module.exports = checkIamOverPrivileged;