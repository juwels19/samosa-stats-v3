"use client";

import { Button, Description, Label, Skeleton, Switch, toast } from "@heroui/react";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

import SettingsPageHeader from "@/components/settings/common/settings-page-header";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "../../../../convex/_generated/api";

/** Admin settings for AI features. Changes apply to the next request. */
export default function AiSettings() {
  const currentUser = useCurrentUser();
  // Wait for sign-in, or the admin check fails before the user loads.
  const settings = useQuery(api.aiSettings.get, currentUser.user?.isAdmin ? {} : "skip");

  return (
    <div className="flex flex-col gap-6">
      <SettingsPageHeader
        title="AI"
        description="Turn AI features on or off. Models are chosen in the AI Gateway routers."
      />
      {settings === undefined ? (
        <Skeleton className="h-56 w-full rounded-2xl" />
      ) : (
        <DisplayNameSuggestionsCard
          // A new key resets the draft when the saved settings change.
          key={String(settings.displayNameSuggestions.enabled)}
          saved={settings.displayNameSuggestions}
        />
      )}
    </div>
  );
}

function DisplayNameSuggestionsCard({ saved }: { saved: { enabled: boolean } }) {
  const save = useMutation(api.aiSettings.setDisplayNameSuggestions);
  const [enabled, setEnabled] = useState(saved.enabled);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = enabled !== saved.enabled;

  const submit = async () => {
    setIsSaving(true);
    try {
      await save({ enabled });
      toast.success("Name suggestions saved");
    } catch (error) {
      toast.danger("Name suggestions not saved", {
        description: error instanceof Error ? error.message : "Try again.",
      });
      setIsSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-lg font-semibold">Display name suggestions</h2>
        <p className="text-sm text-muted">
          The Suggest button on the picks page, and the names of new mock picks. Each player gets 25
          suggestions for each event.
        </p>
      </div>

      {/* Switch.Content is the clickable part, so the control goes inside it. */}
      <Switch isSelected={enabled} onChange={setEnabled}>
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Label>Suggestions on</Label>
        </Switch.Content>
        <Description>When off, the picks page has no Suggest button.</Description>
      </Switch>

      <p className="text-sm text-muted">
        Model: the <code className="text-foreground">router/ss-display-name</code> router in the AI
        Gateway. Change the model there. No redeploy is needed.
      </p>

      <div className="flex justify-end">
        <Button
          className="w-full sm:w-auto"
          isDisabled={!isDirty}
          isPending={isSaving}
          onPress={() => void submit()}
        >
          Save
        </Button>
      </div>
    </section>
  );
}
