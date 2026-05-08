import SettingsCard from "@/components/settings/common/settings-card";
import CreateSeason from "@/components/settings/seasons/active-season/create-season";

export default function ActiveSeasonPage() {
  return (
    <div className="flex flex-col gap-8">
      <SettingsCard
        title="Active Season"
        description="Manage which season is active"
        action={<CreateSeason />}
      />
    </div>
  );
}
