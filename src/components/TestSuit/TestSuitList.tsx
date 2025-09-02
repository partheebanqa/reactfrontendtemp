"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { Plus, Search, Filter, Play, RefreshCw, Layers, Loader2 } from "lucide-react";
import TestSuiteCard from "./TestSuiteCard";
import {
  getAllTestSuites,
  deleteTestSuite,
  executeTestSuite,
  duplicateTestSuite,
} from "@/services/testSuites.service";
import { TestSuite } from "@/shared/types/TestSuite.model";
import { useWorkspace } from "@/hooks/useWorkspace";
import HelpLink from "../HelpModal/HelpLink";
import { TestSuitePagination } from "./TestSuitePagination";
import BreadCum from "../BreadCum/Breadcum";
import { useDataManagement } from "@/hooks/useDataManagement";

const TestSuites: React.FC = () => {
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [testSuitListData, setTestSuitListData] = useState<
    TestSuite[] | undefined
  >(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [environmentFilter, setEnvironmentFilter] = useState<string>("all");
  const { environments, activeEnvironment } = useDataManagement();

  const [sortBy, setSortBy] = useState<
    "name" | "created" | "executed" | "success"
  >("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // NEW: pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const {
    data: apiData,
    isLoading,
    error,
    isFetching, // optional: for button spinner
    refetch,
  } = useQuery({
    queryKey: ["/api/test-suites", currentWorkspace?.id],
    enabled: !!currentWorkspace?.id,
    queryFn: () => getAllTestSuites(currentWorkspace!.id),
  });

  useEffect(() => {
    if (error) {
      console.error("Error fetching test suites:", error);
    }
    if (apiData) {
      setTestSuitListData(apiData);
    }
  }, [apiData, error]);

  const deleteSuiteMutation = useMutation({
    mutationFn: deleteTestSuite,
    onSuccess: () => {
      toast({
        title: "Deleted",
        description: "Test suite deleted successfully.",
      });

      queryClient.invalidateQueries({
        queryKey: ["/api/test-suites", currentWorkspace?.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const cloneSuiteMutation = useMutation({
    mutationFn: duplicateTestSuite,
    onSuccess: () => {
      toast({
        title: "Cloned",
        description: "Test suite Cloned successfully.",
      });

      queryClient.invalidateQueries({
        queryKey: ["/api/test-suites", currentWorkspace?.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Clone failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
  });

  const executeSuiteMutation = useMutation({
    mutationFn: executeTestSuite,
    onSuccess: () => {
      toast({
        title: "Queued",
        description: "Test suite has been added to the queue for execution.",
      });
      queryClient.invalidateQueries({ queryKey: ["testSuites"] });
    },
    onError: (error: any) => {
      toast({
        title: "Execute failed",
        description: "Execution failed. Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteSuite = (id: string) => {
    deleteSuiteMutation.mutate(id);
  };
  const handleClonseSuite = (id: string) => {
    cloneSuiteMutation.mutate(id);
  };

  const handleExecuteSuite = (id: string) => {
    executeSuiteMutation.mutate({ testSuiteId: id });
  };

  const handleEditSuite = (suite: TestSuite) => {
    setLocation(`/test-suites/${suite.id}/edit`);
  };

  const handleCreateSuite = () => {
    setLocation("/test-suites/create");
  };

  const envOptions = useMemo(() => {
    const set = new Set<string>();
    environments?.forEach((e) => e?.name && set.add(e.name));
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [environments]);

  // Optional: default to active environment on first load
  // useEffect(() => {
  //   if (environmentFilter === "all" && activeEnvironment?.name) {
  //     setEnvironmentFilter(activeEnvironment.name);
  //   }
  // }, [activeEnvironment?.name]);

  const filteredSuites = (testSuitListData ?? []).filter((suite) => {
    const term = searchQuery.toLowerCase();

    const matchesSearch =
      suite.name.toLowerCase().includes(term) ||
      suite.description.toLowerCase().includes(term) ||
      suite.id.toLowerCase().includes(term) ||
      suite.environment?.name?.toLowerCase().includes(term) ||
      suite.createdAt.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "All statuses" || suite.status === statusFilter;

    // Environment filter
    const envName = (suite.environment?.name ?? "No Environment").toLowerCase();
    const matchesEnvironment =
      environmentFilter === "all" ||
      envName === environmentFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesEnvironment;
  });

  const filteredAndSortedSuites = useMemo(() => {
    const arr = [...filteredSuites];

    arr.sort((a, b) => {
      let cmp = 0;

      switch (sortBy) {
        case "name": {
          cmp = a.name.localeCompare(b.name);
          break;
        }
        case "created": {
          // newest first when sortOrder === 'desc'
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          cmp = aTime - bTime;
          break;
        }

        default:
          cmp = 0;
      }

      return sortOrder === "asc" ? cmp : -cmp;
    });

    return arr;
  }, [filteredSuites, sortBy, sortOrder]);

  // NEW: compute page slice
  const totalItems = filteredAndSortedSuites.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedSuites = filteredAndSortedSuites.slice(startIndex, endIndex);

  return (
    <div className="space-y-3">
      <BreadCum
        title="Test Suites"
        subtitle="Manage your API automation workflows"
        buttonTitle=" Create Test suite"
        onClickQuickGuide={() => console.log("Exporting...")}
        onClickCreateNew={handleCreateSuite}
        icon={Layers}
        iconBgClass="bg-green-100"
        iconColor="#0f766e"
        iconSize={36}
        quickGuideTitle="How to Use Reports"
        quickGuideContent={
          <div>
            <p className="mb-2">Here’s how to get started:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                Step 1: Click <b>New Report</b> to create.
              </li>
              <li>Step 2: Fill in details like name and filters.</li>
              <li>Step 3: Save and view analytics.</li>
            </ul>
          </div>
        }
      />

      <div className="flex flex-col justify-between lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search test suites..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All environments" />
          </SelectTrigger>
          <SelectContent>
            {envOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name === "all" ? (
                  "All environments"
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{name}</span>
                  </div>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            {/* <Filter className='w-4 h-4 mr-2' /> */}
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All statuses">All status</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="generating">Generating</SelectItem>
            {/* <SelectItem value="Passed">Passed</SelectItem>
            <SelectItem value="Failed">Failed</SelectItem> */}
          </SelectContent>
        </Select>

        <Select
          value={`${sortBy}-${sortOrder}`}
          onValueChange={(value) => {
            const [field, order] = value.split("-");
            setSortBy(field as typeof sortBy);
            setSortOrder(order as typeof sortOrder);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">Name A-Z</SelectItem>
            <SelectItem value="name-desc">Name Z-A</SelectItem>
            <SelectItem value="created-desc">Newest First</SelectItem>
            <SelectItem value="created-asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="default"
          className="hover-scale"
          onClick={() => refetch()}
          disabled={isFetching} 
        >
          <RefreshCw
            className={`mr-2 ${isFetching ? "animate-spin" : ""}`}
            size={16}
          />
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="">
  {isFetching ? (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      <span className="ml-2 text-gray-500">Loading test suites...</span>
    </div>
  ) : paginatedSuites.length === 0 ? (
    <div className="text-center py-12">
      <p className="text-gray-500">No test suites found</p>
    </div>
  ) : (
    <>
      <div className="">
        {paginatedSuites.map((suite) => (
          <TestSuiteCard
            key={suite.id}
            suite={suite}
            onEdit={handleEditSuite}
            onDelete={handleDeleteSuite}
            onExecute={handleExecuteSuite}
            onClone={handleClonseSuite}
            onRefresh={() => refetch()}
            refreshing={isFetching}
          />
        ))}
      </div>

      {/* Pagination footer */}
      <TestSuitePagination
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    </>
  )}
</div>

    </div>
  );
};

export default TestSuites;
