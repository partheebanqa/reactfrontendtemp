import { useState } from 'react';
import { format } from 'date-fns';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Play, Edit, Trash2, Loader2 } from 'lucide-react';
import { PerformanceTestConfigApi } from '@/models/performanceTest.model';

interface ConfigListProps {
  configs: PerformanceTestConfigApi[];
  isLoading?: boolean;
  onEdit: (config: PerformanceTestConfigApi) => void;
  onDelete: (config: PerformanceTestConfigApi) => void;
  onExecute: (id: string) => void;
  // onSelectConfig: (config: PerformanceConfig) => void;
  // selectedConfigId?: string;
  executingConfigId?: string;
}

export function ConfigList({
  configs,
  isLoading,
  onEdit,
  onDelete,
  onExecute,
  // onSelectConfig,
  // selectedConfigId,
  executingConfigId,
}: ConfigListProps) {




  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurations</CardTitle>
          <CardDescription>Loading configurations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (configs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurations</CardTitle>
          <CardDescription>No configurations found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <p>Create your first performance test configuration</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">
                    RateLimitPeriod
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">RateLimitRequests</TableHead>
                  <TableHead className="hidden lg:table-cell">RateLimitType</TableHead>
                  <TableHead className="hidden xl:table-cell">Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>


              <TableBody>
                {configs.map((config) => {

                  const isRunning = executingConfigId === config.Id;

                  return (
                    <TableRow
                      key={config.Id}
                    // className={`cursor-pointer ${selectedConfigId === config.id ? 'bg-muted/50' : ''
                    //   }`}
                    // onClick={() => onSelectConfig(config)}
                    >
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{config?.Name}</div>
                          {/* {config?. && (
                          <div className="text-sm text-muted-foreground line-clamp-1 max-w-md">
                            {config?.description}
                          </div>
                        )} */}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {config?.RateLimitPeriod}s
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{config?.RateLimitRequests}</TableCell>
                      <TableCell className="hidden lg:table-cell">

                        <Badge variant="secondary">
                          {config?.RateLimitType}
                        </Badge>


                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                        {format(new Date(config?.CreatedAt), 'PPp')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExecute(config?.Id);
                            }}
                            disabled={isRunning}
                          >
                            {isRunning ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Running
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Run
                              </>
                            )}
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(config);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(config);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>

            </Table>
          </div>
        </CardContent>
      </Card>


    </>
  );
}
