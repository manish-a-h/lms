"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const months = [
  { value: "", label: "All months" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function SalaryFilter({ currentYear }: { currentYear: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [year, setYear] = useState(searchParams.get("year") ?? String(currentYear));

  useEffect(() => {
    const pYear = searchParams.get("year");
    if (pYear && pYear !== year) {
      setYear(pYear);
    } else if (!pYear && year !== String(currentYear)) {
      setYear(String(currentYear));
    }
  }, [searchParams, currentYear]);

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  function handleFilter() {
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    router.push(`/salary?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label
          htmlFor="salary-year"
          className="block text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground mb-1"
        >
          Year
        </label>
        <select
          id="salary-year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="h-9 rounded-md bg-white/70 px-3 text-sm ring-1 ring-black/5 focus:ring-2 focus:ring-ring outline-none"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <Button type="button" variant="outline" size="sm" onClick={handleFilter}>
        <Filter className="h-3.5 w-3.5" />
        Filter
      </Button>
    </div>
  );
}
