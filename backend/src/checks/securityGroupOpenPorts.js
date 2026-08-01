const { DescribeSecurityGroupsCommand } = require("@aws-sdk/client-ec2");
const { ec2 } = require("../awsClients");

const RISKY_PORTS = {
  22: "SSH",
  3389: "RDP",
  3306: "MySQL",
  5432: "PostgreSQL",
};

async function checkOpenSecurityGroups() {
  const findings = [];
  const { SecurityGroups } = await ec2.send(
    new DescribeSecurityGroupsCommand({})
  );

  for (const sg of SecurityGroups) {
    for (const perm of sg.IpPermissions || []) {
      const isOpenToWorld = perm.IpRanges?.some(
        (r) => r.CidrIp === "0.0.0.0/0"
      );

      if (isOpenToWorld && RISKY_PORTS[perm.FromPort]) {
        findings.push({
          check: "Open Security Group",
          resource: sg.GroupId,
          severity: "CRITICAL",
          description: `${sg.GroupName} allows ${RISKY_PORTS[perm.FromPort]} (port ${perm.FromPort}) from anywhere (0.0.0.0/0)`,
          remediation: `Restrict the inbound rule on ${sg.GroupId} to a specific trusted IP range instead of 0.0.0.0/0`,
        });
      }
    }
  }

  return findings;
}

module.exports = checkOpenSecurityGroups;