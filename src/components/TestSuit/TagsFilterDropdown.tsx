import React from "react";
import { Tag, Check, ChevronDown } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const getTagRowStyle = (tag: string) => {
    const map: Record<string, string> = {
        functional: "border-blue-200 focus:ring-blue-200",
        performance: "border-purple-200 focus:ring-purple-200",
        security: "border-orange-200 focus:ring-orange-200",
        sanity: "border-blue-200 focus:ring-blue-200",
        regression: "border-purple-200 focus:ring-purple-200",
        integration: "border-pink-200 focus:ring-pink-200",
        smoke: "border-orange-200 focus:ring-orange-200",
        uat: "border-green-200 focus:ring-green-200",
        e2e: "border-indigo-200 focus:ring-indigo-200",
    };
    return map[tag.toLowerCase()] || "border-gray-200 focus:ring-gray-200";
};

const getTagBadgeColor = (tag: string) => {
    const map: Record<string, string> = {
        functional: "bg-blue-100 text-blue-700 border-blue-200",
        performance: "bg-purple-100 text-purple-700 border-purple-200",
        security: "bg-orange-100 text-orange-700 border-orange-200",
        sanity: "bg-blue-100 text-blue-700 border-blue-200",
        regression: "bg-purple-100 text-purple-700 border-purple-200",
        integration: "bg-pink-100 text-pink-700 border-pink-200",
        smoke: "bg-orange-100 text-orange-700 border-orange-200",
        uat: "bg-green-100 text-green-700 border-green-200",
        e2e: "bg-indigo-100 text-indigo-700 border-indigo-200",
    };
    return map[tag.toLowerCase()] || "bg-gray-100 text-gray-700 border-gray-200";
};

type TagsSelectProps = {
    allTags: string[];
    selectedTags: string[];
    setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
};

export const TagsSelect: React.FC<TagsSelectProps> = ({
    allTags,
    selectedTags,
    setSelectedTags,
}) => {
    const [open, setOpen] = React.useState(false);

    const toggle = (tag: string) => {
        setSelectedTags((prev) => {
            const exists = prev.some((t) => t.toLowerCase() === tag.toLowerCase());
            return exists
                ? prev.filter((t) => t.toLowerCase() !== tag.toLowerCase())
                : [...prev, tag];
        });

        // keep dropdown open (important)
        setOpen(true);
    };

    return (
        <Select open={open} onOpenChange={setOpen} value="__tags__" onValueChange={() => { }}>
            <SelectTrigger className="h-10 w-[170px] justify-between">
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-600" />
                    <span className="text-sm">Tags</span>
                    {selectedTags.length > 0 && (
                        <span className="text-xs text-gray-500">({selectedTags.length})</span>
                    )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
            </SelectTrigger>

            <SelectContent className="w-[360px] p-0">
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">Filter by Tags</p>

                        {selectedTags.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedTags([])}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <div className="mt-3 space-y-3">
                        {allTags.map((tag) => {
                            const isSelected = selectedTags.some(
                                (t) => t.toLowerCase() === tag.toLowerCase()
                            );

                            return (
                                <SelectItem
                                    key={tag}
                                    value={`tag:${tag}`}
                                    // ✅ KEY FIX: prevent Radix from "selecting" and closing
                                    onSelect={(e) => {
                                        e.preventDefault();
                                        toggle(tag);
                                    }}
                                    // some builds also need this to avoid close on pointer down
                                    onPointerDown={(e) => e.preventDefault()}
                                    className="p-0 focus:bg-transparent"
                                >
                                    <div
                                        className={[
                                            "w-full rounded-md border bg-white px-3 py-3",
                                            "flex items-center justify-between",
                                            "transition hover:bg-gray-50",
                                            "focus:outline-none focus:ring-2",
                                            getTagRowStyle(tag),
                                        ].join(" ")}
                                    >
                                        <span className="flex items-center gap-2 text-sm text-gray-800">
                                            <Tag className="w-4 h-4 text-gray-500" />
                                            {tag}
                                        </span>

                                        {isSelected ? (
                                            <Check className="w-4 h-4 text-gray-700" />
                                        ) : (
                                            <span className="w-4 h-4" />
                                        )}
                                    </div>
                                </SelectItem>
                            );
                        })}
                    </div>

                    {selectedTags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {selectedTags.map((t) => (
                                <Badge key={t} variant="outline" className={getTagBadgeColor(t)}>
                                    {t}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>
            </SelectContent>
        </Select>
    );
};