"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface AdvancedFiltersProps {
  onFiltersChange?: (filters: FilterState) => void
}

export interface FilterState {
  scoreRange: [number, number]
  emailStatuses: string[]
  regions: string[]
  outreachReady: boolean | null
}

export function AdvancedFilters({ onFiltersChange }: AdvancedFiltersProps) {
  const [open, setOpen] = useState(false)
  const [scoreRange, setScoreRange] = useState<[number, number]>([0, 100])
  const [emailStatuses, setEmailStatuses] = useState<string[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [outreachReady, setOutreachReady] = useState<boolean | null>(null)

  const activeFiltersCount = 
    (scoreRange[0] !== 0 || scoreRange[1] !== 100 ? 1 : 0) +
    emailStatuses.length +
    regions.length +
    (outreachReady !== null ? 1 : 0)

  const handleApply = () => {
    onFiltersChange?.({
      scoreRange,
      emailStatuses,
      regions,
      outreachReady,
    })
    setOpen(false)
  }

  const handleReset = () => {
    setScoreRange([0, 100])
    setEmailStatuses([])
    setRegions([])
    setOutreachReady(null)
    onFiltersChange?.({
      scoreRange: [0, 100],
      emailStatuses: [],
      regions: [],
      outreachReady: null,
    })
  }

  const toggleEmailStatus = (status: string) => {
    setEmailStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const toggleRegion = (region: string) => {
    setRegions(prev =>
      prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region]
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="mr-2 h-4 w-4" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Advanced Filters</h4>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-auto p-0 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Clear all
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Lead Score Range</Label>
            <div className="pt-2">
              <Slider
                min={0}
                max={100}
                step={5}
                value={scoreRange}
                onValueChange={(value) => setScoreRange(value as [number, number])}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{scoreRange[0]}</span>
                <span>{scoreRange[1]}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email Status</Label>
            <div className="space-y-2">
              {['valid', 'invalid', 'unknown'].map((status) => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={emailStatuses.includes(status)}
                    onCheckedChange={() => toggleEmailStatus(status)}
                  />
                  <label
                    htmlFor={`status-${status}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize cursor-pointer"
                  >
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Region</Label>
            <div className="space-y-2">
              {['USA', 'Germany', 'Nigeria', 'UK', 'France'].map((region) => (
                <div key={region} className="flex items-center space-x-2">
                  <Checkbox
                    id={`region-${region}`}
                    checked={regions.includes(region)}
                    onCheckedChange={() => toggleRegion(region)}
                  />
                  <label
                    htmlFor={`region-${region}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {region}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Outreach Status</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ready"
                  checked={outreachReady === true}
                  onCheckedChange={(checked) => 
                    setOutreachReady(checked ? true : null)
                  }
                />
                <label
                  htmlFor="ready"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Ready for outreach
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="not-ready"
                  checked={outreachReady === false}
                  onCheckedChange={(checked) => 
                    setOutreachReady(checked ? false : null)
                  }
                />
                <label
                  htmlFor="not-ready"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Not ready
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
