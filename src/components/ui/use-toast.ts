
import { useToast as useToastHook } from "@/hooks/use-toast";
import { toast } from "sonner";

// Re-export toast functions so they can be used throughout the app
export { useToastHook as useToast, toast };
