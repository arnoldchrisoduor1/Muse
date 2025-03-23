"use client";
import Image from "next/image";
import Profile from "../../public/images/profile.png";
import { Heart, MessageCircleMore, Send, Trash } from "lucide-react";
import InputComponent from "./InputComponent";
import { useState, useEffect } from "react";
import usePoetryStore from "@/store/poetryStore";
import { twMerge } from "tailwind-merge";

const Comments = ({
  username,
  content,
  id,
  isLiked,
  likes_num,
  comment_num,
  onUpdate
}) => {
  const { likeComment, commentOnPoem, deleteComment } = usePoetryStore();

  const [isLoading, setIsLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(likes_num);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);

  // Update local state when props change
  useEffect(() => {
    setLiked(isLiked);
    setLikesCount(likes_num);
  }, [isLiked, likes_num]);

  const handleChange = (e) => {
    const { value } = e.target;
    setComment(value);
  };

  const handleLike = async () => {
    setIsAnimating(true);

    try {
      const response = await likeComment(id);

      if (response.status === "liked") {
        setLiked(true);
        setLikesCount((prev) => prev + 1);
      } else if (response.status === "unliked") {
        setLiked(false);
        setLikesCount((prev) => prev - 1);
      }
      
      // Notify parent about the update
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error liking comment:", error);
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const handleDeleteComment = async () => {
    try {
      setIsLoading(true);
      const response = await deleteComment(id);
      console.log(response);
      
      // Notify parent about the update
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to delete comment:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await commentOnPoem(comment, null, id);
      setComment("");
      setShowReplyInput(false);
      
      // Notify parent about the update
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to submit comment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-between py-3 border-b border-gray-100">
      <div className="flex items-start gap-3 ml-3">
        <div className="rounded-full flex-shrink-0">
          <Image
            src={Profile}
            width={30}
            height={30}
            alt="Profile picture"
            className="rounded-full"
          />
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">{username}</p>
          <p className="text-sm text-gray-600 my-1">{content}</p>
          
          <button 
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="text-sm text-blue-500 hover:underline hover:cursor-pointer mb-2"
          >
            {showReplyInput ? "Cancel" : "Reply"}
          </button>
          
          {showReplyInput && (
            <div className="flex gap-2 items-center mt-1">
              <div className="flex-1">
                <InputComponent
                  type="text"
                  placeholder="Write a reply..."
                  Icon={MessageCircleMore}
                  name="comment"
                  value={comment}
                  onChange={handleChange}
                />
              </div>
              <button
                onClick={handleSubmitComment}
                disabled={isLoading || !comment.trim()}
                className={`p-2 ${isLoading ? 'opacity-50' : 'hover:text-blue-500'}`}
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4 mr-3">
        <button
          onClick={handleDeleteComment}
          disabled={isLoading}
          className="text-gray-500 hover:text-red-500 hover:cursor-pointer transition-colors"
        >
          <Trash size={18} />
        </button>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            disabled={isLoading}
            className={twMerge(
              "transition-transform duration-300",
              isAnimating && "scale-125"
            )}
          >
            <Heart
              className={twMerge(
                "transition-colors duration-200",
                liked ? "fill-red-500 text-red-500" : "fill-none text-gray-500 hover:text-gray-700 hover:cursor-pointer"
              )}
              size={18}
            />
          </button>
          <span className="text-sm">{likesCount}</span>
        </div>
      </div>
    </div>
  );
};

export default Comments;