import { createCredential } from "@/actions/credentials";
import CustomDialogHeader from "@/components/CustomDialogHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createCredentialSchema } from "@/schema/credential";
import type { createCredentialSchemaType } from "@/schema/credential";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Layers2Icon, Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useForm, type ControllerRenderProps } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "@clerk/clerk-react";

function CreateCredentialDialog({ triggeredText }: { triggeredText?: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<createCredentialSchemaType>({
    resolver: zodResolver(createCredentialSchema),
    defaultValues: {
      name: "",
      value: "",
    },
    mode: "onChange",
  });
  const { getToken } = useAuth();
  const { mutate, isPending } = useMutation({
    mutationFn: async (data: createCredentialSchemaType) => {
      const token = await getToken();
      if (!token) throw new Error("Unauthenticated");
      return createCredential(data, token);
    },
    onSuccess: () => {
      toast.success("Credential created", { id: "create-credential" });
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      setOpen(false);
      form.reset({
        name: "",
        value: "",
      });
    },
    onError: () => {
      toast.error("Failed to create credential", { id: "create-credential" });
    },
  });

  const onSubmit = useCallback(
    (values: createCredentialSchemaType) => {
      toast.loading("Creating credential...", { id: "create-credential" });
      mutate(values);
    },
    [mutate]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) {
          form.reset({
            name: "",
            value: "",
          });
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>{triggeredText ?? "Create credential"}</Button>
      </DialogTrigger>
      <DialogContent className="px-0">
        <CustomDialogHeader icon={Layers2Icon} title="Create Credential" />
        <div className="p-6">
          <Form {...form}>
            <form
              className="space-y-8 w-full"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }: { field: ControllerRenderProps<createCredentialSchemaType, "name"> }) => (
                  <FormItem>
                    <FormLabel className="flex gap-1 items-center">
                      Name <p className="text-xs text-primary">(required)</p>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter an unique and descriptive name for credential <br />
                      This name will be used to identify credential
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="value"
                render={({ field }: { field: ControllerRenderProps<createCredentialSchemaType, "value"> }) => (
                  <FormItem>
                    <FormLabel className="flex gap-1 items-center">
                      Description{" "}
                      <p className="text-xs text-muted-foreground">
                        (optinoal)
                      </p>
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} className="resize-none" />
                    </FormControl>
                    <FormDescription>
                      Enter the value assosiated with this credential <br />
                      This value wiil be securely encrypted and stored
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isPending}>
                {!isPending ? "Proceed" : <Loader2 className="animate-spin" />}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CreateCredentialDialog;
