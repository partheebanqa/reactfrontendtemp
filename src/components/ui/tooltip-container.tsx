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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          className="bg-gray-800 text-white px-2 py-1 rounded text-xs"
          sideOffset={5}  // Adjust the offset as needed
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