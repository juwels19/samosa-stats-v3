import BackLink from "@/components/common/back-link";
import CategoryScoringEditor from "@/components/settings/seasons/categories/scoring/category-scoring-editor";

export const metadata = {
  title: "Category Scoring",
  description: "Set up how a category finds its winners",
};

export default async function CategoryScoringPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;

  return (
    <div className="flex flex-col gap-2">
      <BackLink href="/settings/seasons/categories" label="Categories" />
      <CategoryScoringEditor categoryId={categoryId} />
    </div>
  );
}
