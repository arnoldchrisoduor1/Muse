"use client";
import React, { useEffect } from "react";
import PoetryComponent from "@/components/PoetryComponent";
import usePoetryStore from "@/store/poetryStore";

// Skeleton component for poetry cards
const PoetrySkeleton = () => (
  <div className="w-[95%] mx-auto mt-5 animate-pulse">
    <div className="border rounded-sm w-full p-4 bg-white shadow-sm">
      {/* Top Bar Skeleton */}
      <div className="flex w-full items-center justify-between border-b border-gray/30 pb-2">
        <div className="flex items-center gap-5">
          <div className="rounded-full bg-gray-200 h-10 w-10"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>

      {/* Title Skeleton */}
      <div className="h-5 bg-gray-200 rounded w-1/3 mt-3"></div>

      {/* Content Skeleton */}
      <div className="my-4 pb-2 border-b border-gray/30">
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>

      {/* Bottom Section Skeleton */}
      <div>
        <div className="flex justify-between gap-3 items-center">
          <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          <div className="flex gap-2 items-center">
            <div className="h-5 w-5 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-4 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="flex gap-2 mt-3 mb-4">
          <div className="h-3 bg-gray-200 rounded w-8"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  </div>
);

const Page = () => {
  const { poems, isLoading, error, getPoems } = usePoetryStore();

  // console.log(poems);

  useEffect(() => {
    // Fetching poems when the component mounts.
    getPoems().catch((err) => console.error("Failed to fetch poems:", err));
  }, [getPoems]);

  if (isLoading) {
    return (
      <div>
        <PoetrySkeleton />
        <PoetrySkeleton />
        <PoetrySkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 rounded border border-red-300 bg-red-50 mx-auto w-[95%] mt-5">
        <h3 className="font-medium">Error loading poems</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      {poems.length === 0 ? (
        <div className="p-8 text-center text-gray-500 border rounded-sm mx-auto w-[95%] mt-5">
          <h3 className="font-medium text-lg mb-2">No poems found</h3>
          <p>Be the first to share your poetry with the world!</p>
        </div>
      ) : (
        <div>
          {poems.map((poem) => (
            <PoetryComponent 
              key={poem.id}
              id={poem.id}
              user_id={poem.user}
              username={poem.username} 
              content={poem.content} 
              likes_num={poem.likes_count} 
              comment_num={poem.comments_count} 
              slug={poem.slug} 
              isLiked={poem.is_liked} 
              title={poem.title}
              date={poem.updated_at}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default Page;