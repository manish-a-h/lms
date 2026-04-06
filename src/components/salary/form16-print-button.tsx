"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Form16PrintButton() {
  return (
    <div className="print:hidden flex justify-end">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => window.print()}
      >
        <Printer className="h-4 w-4" />
        Download / Print
      </Button>
    </div>
  );
}
