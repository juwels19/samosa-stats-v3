import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { Doc } from "../../../../../convex/_generated/dataModel";
import { ListTodoIcon } from "lucide-react";

export default function CategoryCard({
  category,
}: {
  category: Doc<"categories">;
}) {
  return (
    <Item
      role="listitem"
      variant="outline"
      size="sm"
      className="rounded-3xl bg-card"
    >
      <ItemContent className="min-w-0">
        <ItemTitle>{category.text}</ItemTitle>
      </ItemContent>
      <ItemActions>
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" size="xs" variant="outline">
              <ListTodoIcon />
              Scoring
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Scoring Description</DialogTitle>
              <DialogDescription>{category.text}</DialogDescription>
            </DialogHeader>
            <p className="whitespace-pre-wrap text-sm leading-6">
              {category.scoringDescription}
            </p>
          </DialogContent>
        </Dialog>
      </ItemActions>
    </Item>
  );
}
