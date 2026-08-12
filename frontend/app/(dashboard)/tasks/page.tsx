import { AssignedWorkSummary } from "@/components/dashboard/AssignedWorkSummary";

export default function AssignedTasksPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">Assigned Tasks</h1>
      <AssignedWorkSummary />
    </div>
  );
}
