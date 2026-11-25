"use client";

import { Alert, Skeleton } from "@heroui/react";
import { useQuery } from "convex/react";

import { useCurrentUser } from "@/hooks/use-current-user";
import SettingsPageHeader from "@/components/settings/common/settings-page-header";
import { api } from "../../../../convex/_generated/api";
import DiscordLogSection from "./discord-log-section";
import MockEventsSection from "./mock-events-section";
import MockPicksSection from "./mock-picks-section";

/** Test tools for admins: mock picks, mock events and the Discord log. */
export default function TestingPage() {
  const currentUser = useCurrentUser();
  const data = useQuery(api.mocks.overview, currentUser.user?.isAdmin ? {} : "skip");

  const header = (
    <SettingsPageHeader
      title="Testing"
      description="Add mock picks, run mock events through each status and see the Discord messages."
    />
  );

  if (currentUser.isLoading || (currentUser.user?.isAdmin && data === undefined)) {
    return (
      <div className="flex flex-col gap-6">
        {header}
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!currentUser.user?.isAdmin || data === undefined) {
    return <p className="text-sm text-muted">You must be an admin to use the test tools.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      {header}
      <Alert status="warning">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Mock events post to the configured Discord webhook</Alert.Title>
          <Alert.Description>
            They use DISCORD_WEBHOOK_URL, the same as real events. Point it at a test channel
            before you run them.
          </Alert.Description>
        </Alert.Content>
      </Alert>
      <MockPicksSection data={data} />
      <MockEventsSection data={data} />
      <DiscordLogSection data={data} />
    </div>
  );
}
