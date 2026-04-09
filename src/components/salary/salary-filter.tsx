"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SalaryFilter({ currentYear }: { currentYear: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const year = searchParams.get("year") ?? String(currentYear);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  function handleFilter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const selectedYear = (form.elements.namedItem("salary-year") as HTMLSelectElement).value;
    const params = new URLSearchParams();
    if (selectedYear) params.set("year", selectedYear);
    router.push(`/salary?${params.toString()}`);
  }

  return (
    <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-3">
      <div>
        <label
          htmlFor="salary-year"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-1"
        >
          Year
        </label>
        <select
          id="salary-year"
          name="salary-year"
          defaultValue={year}
          key={year}
          className="h-9 rounded-md bg-white/70 px-3 text-sm ring-1 ring-black/5 focus:ring-2 focus:ring-ring outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="outline" size="sm">
        <Filter className="h-3.5 w-3.5" />
        Filter
      </Button>
    </form>
  );
}