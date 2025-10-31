import { downloadInvoice } from "@/actions/billings";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import React from "react";
import { toast } from "sonner";

function InvoiceButton({ id }: { id: string }) {
  const { getToken } = useAuth();
  const mutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthenticated");
      return downloadInvoice(invoiceId, token);
    },
    onSuccess: (data) => {
      window.open(data as string, "_blank");
    },
    onError: (error: any) => {
      toast.success(error.message || "Something went wrong", { id: "invoice" });
    },
  });

  return (
    <Button
      className="text-xs gap-2 text-muted-foreground px-1"
      variant={"ghost"}
      size={"sm"}
      disabled={mutation.isPending}
      onClick={() => {
        mutation.mutate(id);
      }}
    >
      Invoice
      {mutation.isPending && <Loader2Icon className="h-4 w-4 animate-spin" />}
    </Button>
  );
}

export default InvoiceButton;
