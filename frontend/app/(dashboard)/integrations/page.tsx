import Link from "next/link";
import { Cloud, Users, GitFork, GitMerge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BitbucketCard } from "@/components/integrations/BitbucketCard";

function NotAvailableCard({
  icon: Icon,
  label,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <Card className="border-border shadow-sm opacity-70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
          Not available yet
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">Integrations</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Cloud</h2>
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cloud className="h-4 w-4" />
              AWS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Connect and scan AWS accounts from the Scans page.
            </p>
            <Link href="/scans" className="text-sm font-medium text-aws-blue hover:underline">
              Go to Scans →
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Identity</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NotAvailableCard
            icon={Users}
            label="Google Workspace"
            description="Sync users, groups, and MFA status for identity compliance evidence."
          />
          <NotAvailableCard
            icon={Users}
            label="Okta"
            description="Sync SSO configuration and user access for identity compliance evidence."
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Developer Tools</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NotAvailableCard
            icon={GitFork}
            label="GitHub"
            description="Connect repositories to collect branch protection and code review evidence."
          />
          <NotAvailableCard
            icon={GitMerge}
            label="GitLab"
            description="Connect projects to collect merge-request and CI/CD compliance evidence."
          />
          <BitbucketCard />
        </div>
      </section>
    </div>
  );
}
