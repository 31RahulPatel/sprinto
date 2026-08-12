"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { StaffDevice, StaffDeviceDetail } from "@/types";

export interface StaffDeviceFilters {
  status?: string;
  search?: string;
}

function buildQuery(filters: StaffDeviceFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
}

async function fetchStaffDevices(filters: StaffDeviceFilters): Promise<StaffDevice[]> {
  const res = await fetch(`/api/staff-devices${buildQuery(filters)}`);
  if (!res.ok) throw new Error("Failed to load staff devices");
  return res.json();
}

export function useStaffDevices(filters: StaffDeviceFilters = {}) {
  return useQuery({
    queryKey: ["staff-devices", filters],
    queryFn: () => fetchStaffDevices(filters),
  });
}

async function fetchStaffDevice(id: string): Promise<StaffDeviceDetail> {
  const res = await fetch(`/api/staff-devices/${id}`);
  if (!res.ok) throw new Error("Failed to load staff device");
  return res.json();
}

export function useStaffDevice(id: string | null) {
  return useQuery({
    queryKey: ["staff-device", id],
    queryFn: () => fetchStaffDevice(id as string),
    enabled: id !== null,
  });
}

async function fetchMyStaffDevice(): Promise<StaffDeviceDetail | null> {
  const res = await fetch("/api/staff-devices/me");
  if (!res.ok) throw new Error("Failed to load your device");
  const data = await res.json();
  return data ?? null;
}

export function useMyStaffDevice() {
  return useQuery({
    queryKey: ["staff-device", "me"],
    queryFn: fetchMyStaffDevice,
  });
}

export function useInvalidateMyStaffDevice() {
  const queryClient = useQueryClient();
  return async () => {
    await queryClient.invalidateQueries({ queryKey: ["staff-device"] });
    await queryClient.invalidateQueries({ queryKey: ["staff-devices"] });
  };
}
