"use client";
import React, { PropsWithChildren } from "react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "./ui/sonner";

const qc = new QueryClient();

const Provider = ({ children }: PropsWithChildren) => {
  return (
    <>
      <QueryClientProvider client={qc}>
        {children}
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </>
  );
};

export default Provider;
