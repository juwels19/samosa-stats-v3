import { Alert } from "@heroui/react";

/** Lists the problems that stop the config from saving. */
export default function ConfigIssues({ issues }: { issues: string[] }) {
  // The same message can come from more than one place. Show it once.
  const unique = [...new Set(issues)];
  if (unique.length === 0) return null;

  return (
    <Alert status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Fix these to save</Alert.Title>
        <Alert.Description>
          <ul className="list-disc pl-4">
            {unique.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
