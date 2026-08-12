"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { StatusPill } from "@/components/common/StatusPill";
import { ActivityTimeline } from "@/components/common/ActivityTimeline";
import { StaffDeviceCheckBoxes } from "@/components/staff-devices/StaffDeviceCheckBoxes";
import { TaskDetailSheet } from "@/components/tasks/TaskDetailSheet";
import { useStaffDevice } from "@/hooks/useStaffDevices";
import type { StaffDevice, StaffDeviceStatus, Task } from "@/types";

const DEVICE_STATUS_LABEL: Record<StaffDeviceStatus, string> = {
  PENDING: "Pending",
  COMPLIANT: "Compliant",
};

const DEVICE_STATUS_VARIANT: Record<StaffDeviceStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  COMPLIANT: "default",
};

const ACTIVITY_LABEL: Record<string, string> = {
  RECORD_CREATED: "registered this device",
  RECORD_UPDATED: "updated this device",
  CONTROL_LINKED: "linked a compliance control",
  STATUS_CHANGED: "changed the status",
  TASK_CREATED: "created a check",
  ASSIGNED: "assigned this",
  REASSIGNED: "reassigned this",
  EVIDENCE_UPLOADED: "uploaded evidence",
  REVIEW_APPROVED: "approved the evidence",
  REVIEW_REJECTED: "rejected the evidence",
};

export function StaffDeviceDetailSheet({
  device,
  onOpenChange,
}: {
  device: StaffDevice | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: detail } = useStaffDevice(device?.id ?? null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  return (
    <>
      <Sheet open={device !== null} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {device && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-2">
                  {detail && (
                    <StatusPill
                      status={detail.status}
                      labelMap={DEVICE_STATUS_LABEL}
                      variantMap={DEVICE_STATUS_VARIANT}
                    />
                  )}
                  <span className="text-xs uppercase text-muted-foreground">
                    {device.os}
                    {device.osVersion ? ` ${device.osVersion}` : ""}
                  </span>
                </div>
                <SheetTitle>{device.deviceName}</SheetTitle>
                <SheetDescription>Owned by {device.owner.name}</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 px-4 pb-6 text-sm">
                {detail?.control && (
                  <div>
                    <h4 className="mb-1 font-medium text-muted-foreground">Linked Control</h4>
                    <p>{detail.control.name ?? detail.control.code}</p>
                  </div>
                )}

                {detail && (
                  <>
                    <div className="space-y-2 border-t border-border pt-4">
                      <h4 className="font-medium text-muted-foreground">Compliance Checks</h4>
                      <StaffDeviceCheckBoxes tasks={detail.tasks} onSelect={setSelectedTask} />
                    </div>

                    <div className="space-y-3 border-t border-border pt-4">
                      <h4 className="font-medium text-muted-foreground">Activity</h4>
                      <ActivityTimeline activity={detail.activity} labelMap={ACTIVITY_LABEL} />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <TaskDetailSheet task={selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)} />
    </>
  );
}
