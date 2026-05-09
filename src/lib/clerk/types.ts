import type { WaitlistEntry } from "@clerk/backend";

type WaitlistEntryInvitation = NonNullable<WaitlistEntry["invitation"]>;

export type SerializedWaitlistEntry = {
  id: string;
  emailAddress: string;
  status: WaitlistEntry["status"];
  invitation: {
    status: WaitlistEntryInvitation["status"];
  } | null;
  createdAt: number;
  updatedAt: number;
  isLocked?: boolean;
};
