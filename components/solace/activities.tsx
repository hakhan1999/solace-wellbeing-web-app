"use client";

import { useState } from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { useSolace } from "@/lib/solace/store";
import { Add, Heading } from "./ui";
import { ActivityForm } from "./activity-form";
import { EventsPanel } from "./program-content";
import { ProgramDocuments } from "./program-documents";

export function Activities() {
  const { clientId } = useSolace();
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <Heading
        eyebrow="ENGAGEMENT MANAGEMENT"
        title="Activities"
        description="Manage employee activities and their documents."
        action={
          <Add onClick={() => setShowForm(true)}>
            Add activity
          </Add>
        }
      />

      <Tabs defaultValue="activities" className="program-tabs">
        <TabsList className="section-tabs">
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="activities">
          <EventsPanel
            key={clientId}
            mode="activities"
            hideHeader
          />
        </TabsContent>

        <TabsContent value="documents">
          <ProgramDocuments
            key={clientId}
            kind="activities"
          />
        </TabsContent>
      </Tabs>

      {showForm && (
        <ActivityForm
          key={`new-activity-${clientId}`}
          onClose={() => setShowForm(false)}
        />
      )}
    </>
  );
}