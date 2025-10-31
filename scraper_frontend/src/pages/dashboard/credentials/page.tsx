import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import CreateCredentialDialog from "./components/CreateCredentialDialog";
import DeleteCredentialDialog from "./components/DeleteCredentialDialog";
import { useQuery } from "@tanstack/react-query";
import { getUserCredentials } from "@/actions/credentials";
import { useAuth } from "@clerk/clerk-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldCheckIcon } from "lucide-react";

function CredentialsPage() {
  const { getToken } = useAuth();

  const { data: credentials = [], isLoading } = useQuery({
    queryKey: ["credentials"],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Unauthenticated");
      return getUserCredentials(token);
    },
  });

  return (
    <div className="flex flex-1 flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl text-bold">Credentials</h1>
        <CreateCredentialDialog />
      </div>
      <div className="h-full py-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="w-full h-[120px]" />
            <Skeleton className="w-full h-[120px]" />
          </div>
        ) : credentials.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5" />
                No Credentials
              </CardTitle>
              <CardDescription>
                Create your first credential to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateCredentialDialog triggeredText="Create First Credential" />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {credentials.map((credential: any) => (
              <Card key={credential.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{credential.name}</CardTitle>
                    <DeleteCredentialDialog
                      crendentialName={credential.name}
                      credentialId={credential.id}
                    />
                  </div>
                  <CardDescription>
                    Created {new Date(credential.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Value is encrypted and secure
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CredentialsPage;

