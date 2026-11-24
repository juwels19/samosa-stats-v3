import { Alert } from "@heroui/react";

/** Lists the problems that stop the config from saving. */
export default function ConfigIssues({ issues }: { issues: string[] }) {
  if (issues.length === 0) return null;

  return (
    <Alert status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Fix these to save</Alert.Title>
        <Alert.Description>
          <ul className="list-disc pl-4">
            {issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
