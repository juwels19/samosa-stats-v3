import { Alert } from "@heroui/react";

export default function PicksRandomSubmitBanner() {
  return (
    <Alert status="accent">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Random pick</Alert.Title>
        <Alert.Description>
          This pick is saved as random. You cannot change it after you submit.
        </Alert.Description>
      </Alert.Content>
    </Alert>
  );
}
