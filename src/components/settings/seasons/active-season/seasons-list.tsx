"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CreateSeason from "@/components/settings/seasons/active-season/create-season";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import SeasonsEmptyState from "./seasons-empty";

export default function SeasonsList() {
  const currentUser = useCurrentUser();
  const seasons = useQuery(
    api.seasons.list,
    currentUser.user?.isAdmin ? {} : "skip",
  );
  const setActiveSeason = useMutation(api.seasons.setActive);
  const [pendingSeasonId, setPendingSeasonId] = useState<Id<"seasons"> | null>(
    null,
  );

  const handleSetActive = async (seasonId: Id<"seasons">) => {
    setPendingSeasonId(seasonId);

    try {
      await setActiveSeason({ seasonId });
      toast.success("Active season updated");
    } catch (error) {
      toast.error("Active season not updated", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPendingSeasonId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Season</CardTitle>
        <CardDescription>
          Manage saved seasons and choose which one is currently active.
        </CardDescription>
        <CardAction>
          <CreateSeason />
        </CardAction>
      </CardHeader>
      <CardContent>
        {currentUser.isLoading || seasons === undefined ? (
          <Skeleton className="h-40 w-full rounded-3xl" />
        ) : !currentUser.user?.isAdmin ? (
          <div className="text-sm text-muted-foreground">
            Admin access is required to manage seasons.
          </div>
        ) : seasons.length === 0 ? (
          <SeasonsEmptyState />
        ) : (
          <div className="overflow-hidden rounded-3xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead>Game</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seasons.map((season) => (
                  <TableRow key={season._id}>
                    <TableCell className="font-medium">{season.year}</TableCell>
                    <TableCell>{season.gameName}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          season.isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : "bg-destructive/10 text-destructive"
                        }
                      >
                        {season.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {season.isActive ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          disabled
                        >
                          Active
                        </Button>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={pendingSeasonId !== null}
                            >
                              {pendingSeasonId === season._id
                                ? "Updating..."
                                : "Set as active"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Set {season.year} as the active season?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will make {season.gameName} the active
                                season and mark any current active season as
                                inactive.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleSetActive(season._id)}
                              >
                                Set as active
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
