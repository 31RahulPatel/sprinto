import { AwsIntegrationCard } from "@/components/integrations/AwsIntegrationCard";
import { BitbucketCard } from "@/components/integrations/BitbucketCard";

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-aws-navy dark:text-foreground">Integrations</h1>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Cloud</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <AwsIntegrationCard />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Developer Tools</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <BitbucketCard />
        </div>
      </section>
    </div>
  );
}
