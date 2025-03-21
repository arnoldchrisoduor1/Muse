"use client";
import React, { useEffect } from "react";

import PoetryComponent from "@/components/PoetryComponent";
import usePoetryStore from "@/store/poetryStore";


const page = () => {

    const { poems, isLoading, error, getPoems, setCurrentPoem } = usePoetryStore();

    useEffect(() => {
        // Fetching poems when the component mounts.
        getPoems().catch(err => console.error("Failed to fetch poems:", err));
    }, [getPoems]);

    if (isLoading) return <div className="p-4">Loading poems...</div>
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <>
    {poems.length === 0 ? (
        <p>No poems were found</p>
    ) : (

      <PoetryComponent />
    )}
    </>
  );
};

export default page;
