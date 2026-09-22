"use client";

import { useState } from "react";
import { CalendarDays, Clock3, ArrowRight } from "lucide-react";
import Link from "./navigation";
import { useSolace } from "@/lib/solace/store";
import { fmt } from "@/lib/solace/data";
import { Heading, SearchBox, Pick, Badge, Empty } from "./ui";

export function Activities() {
  const { data, clientId } = useSolace();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");

  const clientEngagements = data.engagements.filter(
    (engagement) =>
      clientId === "all" || engagement.clientId === clientId,
  );

  const engagementIds = new Set(
    clientEngagements.map((engagement) => engagement.id),
  );

  const clientActivities = data.events.filter(
    (event) =>
      event.type === "Activity" &&
      engagementIds.has(event.engagementId),
  );

  const categories = Array.from(
    new Set(clientActivities.map((activity) => activity.category)),
  );

  const activities = clientActivities
    .filter((activity) => {
      const engagement = data.engagements.find(
        (item) => item.id === activity.engagementId,
      );

      const matchesQuery =
        `${activity.name} ${engagement?.name || ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());

      return (
        matchesQuery &&
        (category === "All categories" || activity.category === category)
      );
    })
    .sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
    );

  return (
    <>
      <Heading
        title="Activities"
        description="Activities created for your corporate engagements."
      />

      <div className="toolbar">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search activities or engagements…"
        />

        <Pick
          label="Filter activity category"
          value={category}
          onChange={setCategory}
          options={["All categories", ...categories]}
        />

        <span className="toolbar-count">
          {activities.length} activities
        </span>
      </div>

      <div className="event-list">
        {activities.map((activity) => {
          const engagement = data.engagements.find(
            (item) => item.id === activity.engagementId,
          );

          const client = data.clients.find(
            (item) => item.id === engagement?.clientId,
          );

          return (
            <article className="event-card" key={activity.id}>
              <div className="date-tile">
                <CalendarDays size={20} />
              </div>

              <div className="event-main">
                <Badge tone="green">{activity.category}</Badge>

                <h3>{activity.name}</h3>

                <p>
                  {client?.name} · {engagement?.name}
                </p>

                <p>
                  <Clock3 size={14} />
                  {fmt(activity.date)} · {activity.time} ·{" "}
                  {activity.duration} min
                </p>

                <small>
                  {activity.facilitator} · {activity.location}
                </small>
              </div>

              <div className="event-actions">
                <span>Capacity: {activity.capacity}</span>

                <Link
                  className="button secondary"
                  href={
                    "/engagements?id=" +
                    activity.engagementId +
                    "&phase=1"
                  }
                >
                  Open engagement
                  <ArrowRight size={15} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {!activities.length && (
        <Empty
          title="No activities found"
          text="Open an engagement and choose Add activity, or adjust your filters."
        />
      )}
    </>
  );
}