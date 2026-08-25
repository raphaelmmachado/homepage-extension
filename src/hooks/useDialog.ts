import { useState } from "react";
import type { DialogConfig } from "../components/CustomDialog";

export function useDialog() {
  const [dialog, setDialog] = useState<DialogConfig>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
  });

  const showDialog = (
    options: Omit<DialogConfig, "isOpen" | "onConfirm" | "onCancel">,
  ): Promise<string | boolean | null> => {
    return new Promise((resolve) => {
      setDialog({
        ...options,
        isOpen: true,
        onConfirm: (val) => {
          setDialog((prev) => ({ ...prev, isOpen: false }));
          resolve(options.type === "prompt" ? val || null : true);
        },
        onCancel: () => {
          setDialog((prev) => ({ ...prev, isOpen: false }));
          resolve(options.type === "prompt" ? null : false);
        },
      });
    });
  };

  return { dialog, showDialog };
}
