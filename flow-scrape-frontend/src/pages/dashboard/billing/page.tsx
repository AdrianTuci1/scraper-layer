import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import CreditsPurchase from "./components/CreditsPurchase";
import CreditUsageChart from "./components/CreditUsageChart";
import { getCreditsUsageInPeriod } from "@/actions/analytics";
import { useSearchParams } from "react-router-dom";
import type { Period } from "@/lib/types";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { getAvailableCredits, getUserPurchases } from "@/actions/billings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CoinsIcon } from "lucide-react";
import InvoiceButton from "./components/InvoiceButton";

function BillingPage() {
  const [searchParams] = useSearchParams();
  const { getToken } = useAuth();
  const currDate = new Date();
  const month = searchParams.get("month");
  const year = searchParams.get("year");

  const period: Period = {
    month: month ? parseInt(month) : currDate.getMonth(),
    year: year ? parseInt(year) : currDate.getFullYear(),
  };

  const { data: credits = 0 } = useQuery({
    queryKey: ["credits"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthenticated");
      return getAvailableCredits(token);
    },
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthenticated");
      return getUserPurchases(token);
    },
  });

  return (
    <div className="flex flex-1 flex-col h-full">
      <h1 className="text-3xl text-bold mb-6">Billing</h1>
      <div className="h-full py-6 flex flex-col gap-5">
        {/* Available Credits */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <CoinsIcon className="h-6 w-6 text-primary" />
              Available Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{credits}</div>
          </CardContent>
        </Card>

        {/* Purchase Credits */}
        <CreditsPurchase />

        {/* Credit Usage Chart */}
        <Suspense fallback={<Skeleton className="w-full h-[300px]" />}>
          <CreditUsageChart
            data={[]}
            title="Credit Usage"
            description="Track your credit consumption over time"
          />
        </Suspense>

        {/* Purchase History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Purchase History</CardTitle>
          </CardHeader>
          <CardContent>
            {purchases.length === 0 ? (
              <p className="text-muted-foreground">No purchases yet</p>
            ) : (
              <div className="space-y-2">
                {purchases.map((purchase: any) => (
                  <div
                    key={purchase.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{purchase.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(purchase.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">
                        ${(purchase.amount / 100).toFixed(2)} {purchase.currency}
                      </span>
                      <InvoiceButton id={purchase.id} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default BillingPage;

