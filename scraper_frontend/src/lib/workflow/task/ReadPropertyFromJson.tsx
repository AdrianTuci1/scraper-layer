import { TaskParamType, TaskType } from "@/lib/types";
import type { WorkflowTask } from "@/lib/types";
import type { LucideProps } from "lucide-react";
import { FileJson2Icon } from "lucide-react";

export const ReadPropertyFromJsonTask = {
  type: TaskType.READ_PROPERTY_FROM_JSON,
  label: "Read property from JSON",
  icon: (props: LucideProps) => (
    <FileJson2Icon className="stroke-orange-400" {...props} />
  ),
  isEntryPoint: false,
  inputs: [
    {
      name: "JSON",
      type: TaskParamType.STRING,
      required: true,
      variant: "textarea",
    },
    {
      name: "Property name",
      type: TaskParamType.STRING,
      required: true,
    },
  ] as const,
  outputs: [
    {
      name: "Property Value",
      type: TaskParamType.STRING,
    },
  ] as const,
  credits: 1,
} satisfies WorkflowTask;
