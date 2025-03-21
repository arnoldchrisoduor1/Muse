"use client";
import Image from "next/image";
import Profile from "../../public/images/profile.png";
import InputComponent from "@/components/InputComponent";
import { Heart, MessageCircleMore } from "lucide-react";
import Comments from "./Comments";
import { useState, useEffect } from "react";
import usePoetryStore from "@/store/poetryStore"; // Import your store
import { twMerge } from "tailwind-merge";
import RecursiveComment from "./RecursiveComment";

const PoetryComponent = ({
  id,
  slug,
  username,
  content,
  likes_num,
  comment_num,
  title,
  isLiked = false,
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(likes_num);
  const [isAnimating, setIsAnimating] = useState(false);
  const [comments, setComments] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const { likePoem, getPoemCommentsandReplies } = usePoetryStore();

  const handleLike = async () => {
    setIsAnimating(true);

    try {
      const response = await likePoem(slug);

      if (response.status === "liked") {
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      } else if (response.status === "unliked") {
        setLiked(false);
        setLikesCount((prev) => prev - 1);
      }
    } catch (error) {
      console.error("Error liking poem:", error);
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const commentsData = await getPoemCommentsandReplies(slug);
      setComments(commentsData);
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  console.log(comments);

  useEffect(() => {
    // Only fetch if we don't already have comments
    if (!comments) {
      fetchComments();
    }
  }, [slug, fetchComments]); 

  return (
    <div className="w-[95%] mx-auto mt-5">
      <div className="border rounded-sm w-full p-4">
        {/* Top Bar */}
        <div className="flex w-full items-center justify-between border-b border-gray/30 pb-2">
          <div className="flex items-center gap-5">
            <div className="rounded-full">
              <Image
                src={Profile}
                width={40}
                height={40}
                alt="Picture of the author"
                className="rounded-full"
              />
            </div>
            <div>
              <p>{username}</p>
              <p className="text-sm text-gray">Poem</p>
            </div>
          </div>
          <div className="text-gray text-end">5 Mins Ago</div>
        </div>

        {/* Middle part */}
        <div className="font-semibold">{title}</div>
        <div
          className="my-4 pb-2 border-b border-gray/30"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Lower Section */}
        <div>
          <div className="flex justify-between gap-3 items-center">
            <div className="">
              <InputComponent placeholder="comment" Icon={MessageCircleMore} />
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleLike}
                className={twMerge(
                  "transition-transform duration-300",
                  isAnimating && "scale-125"
                )}
              >
                <Heart
                  className={twMerge(
                    "transition-colors duration-200 hover:cursor-pointer",
                    liked && isLiked ? "fill-red-500 text-red-500" : "fill-none"
                  )}
                  size={20}
                />
              </button>
              <div>{likesCount}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-2 text-sm">
            <p>{comment_num}</p>
            <p>People commented</p>
          </div>
          {isLoading ? (
      <div>Loading comments...</div>
    ) : (
      comments && comments.map((comment) => (
        <RecursiveComment key={comment.id} comment={comment} />
      ))
    )}
        </div>
      </div>
    </div>
  );
};

export default PoetryComponent;
