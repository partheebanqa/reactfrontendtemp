'use client'

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

interface TooltipContainerProps {
  children: React.ReactNode;
  text: string;
  position?: "top" | "right" | "bottom" | "left";
}

const TooltipContainer = ({ children, text, position = "top" }: TooltipContainerProps) => {
  return (
    <TooltipProvider delayDuration={0} transition-all>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent
          className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm shadow-lg animate-fade-in border border-gray-200 dark:border-gray-700 backdrop-blur-md transition-all duration-200"
          sideOffset={5}
          side={position}
        >
          {text}
          <TooltipPrimitive.Arrow className="fill-gray-800" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default TooltipContainer;