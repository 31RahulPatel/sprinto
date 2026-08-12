"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusPill } from "@/components/common/StatusPill";
import { RegisterDeviceForm } from "@/components/staff-devices/RegisterDeviceForm";
import { DeviceCheckStepper } from "@/components/staff-devices/DeviceCheckStepper";
import { StaffDeviceDetailSheet } from "@/components/staff-devices/StaffDeviceDetailSheet";
import { useMyStaffDevice, useStaffDevices } from "@/hooks/useStaffDevices";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { StaffDevice, StaffDeviceStatus } from "@/types";

const DEVICE_STATUS_LABEL: Record<StaffDeviceStatus, string> = {
  PENDING: "Pending",
  COMPLIANT: "Compliant",
};

const DEVICE_STATUS_VARIANT: Record<StaffDeviceStatus, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  COMPLIANT: "default",
};

export default function StaffDevicesPage() {
  const { data: currentUser } = useCurrentUser();
  const { data: myDevice, isLoading: myDeviceLoading } = useMyStaffDevice();
  const { data: devices } = useStaffDevices();
  const [selectedDevice, setSelectedDevice] = useState<StaffDevice | null>(null);
  const isDev = currentUser?.role === "DEV";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">Staff Devices</h1>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>My Device</span>
            {myDevice && (
              <StatusPill
                status={myDevice.status}
                labelMap={DEVICE_STATUS_LABEL}
                variantMap={DEVICE_STATUS_VARIANT}
              />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myDeviceLoading ? null : !myDevice ? (
            <RegisterDeviceForm />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {myDevice.deviceName} · {myDevice.os}
                {myDevice.osVersion ? ` ${myDevice.osVersion}` : ""}
              </p>
              <DeviceCheckStepper tasks={myDevice.tasks} />
            </div>
          )}
        </CardContent>
      </Card>

      {!isDev && (
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">All Devices</CardTitle>
          </CardHeader>
          <CardContent>
            {!devices || devices.length === 0 ? (
              <EmptyState message="No devices registered yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Employee</th>
                      <th className="pb-2 font-medium">Device</th>
                      <th className="pb-2 font-medium">OS</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map((d) => (
                      <tr
                        key={d.id}
                        onClick={() => setSelectedDevice(d)}
                        className="cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-accent"
                      >
                        <td className="py-2 font-medium">{d.owner.name}</td>
                        <td className="py-2 text-muted-foreground">{d.deviceName}</td>
                        <td className="py-2 text-muted-foreground">
                          {d.os}
                          {d.osVersion ? ` ${d.osVersion}` : ""}
                        </td>
                        <td className="py-2">
                          <StatusPill
                            status={d.status}
                            labelMap={DEVICE_STATUS_LABEL}
                            variantMap={DEVICE_STATUS_VARIANT}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <StaffDeviceDetailSheet device={selectedDevice} onOpenChange={(open) => !open && setSelectedDevice(null)} />
    </div>
  );
}
