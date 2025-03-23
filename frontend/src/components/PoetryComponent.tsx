"use client";
import Image from "next/image";
import Profile from "../../public/images/logo.png";
import InputComponent from "@/components/InputComponent";
import { Heart, MessageCircleMore, Send, User } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import usePoetryStore from "@/store/poetryStore";
import { twMerge } from "tailwind-merge";
import RecursiveComment from "./RecursiveComment";
import { useUserStore } from "@/store/userStore";

const CommentSkeleton = () => (
  <div className="animate-pulse mt-4">
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-gray-200 h-8 w-8"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  </div>
);

const PoetryComponent = ({
  id,
  slug,
  username,
  content,
  likes_num,
  comment_num,
  title,
  user_id,
  isLiked = false,
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(likes_num);
  const [commentCount, setCommentCount] = useState(comment_num);
  const [isAnimating, setIsAnimating] = useState(false);
  const [comments, setComments] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comment, setComment] = useState("");
  const [updateCounter, setUpdateCounter] = useState(0);
  const [user, setUser] = useState(null);

  const { likePoem, getPoemCommentsandReplies, commentOnPoem } = usePoetryStore();
  const { getSingleUser } = useUserStore();

  const getUser = async() => {
    try {
      setIsUserLoading(true);
      const response = await getSingleUser(user_id);
      setUser(response);
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setIsUserLoading(false);
    }
  }

  const handleChange = (e) => {
    const { value } = e.target;
    setComment(value);
  };

  const triggerRefresh = useCallback(() => {
    setUpdateCounter(prev => prev + 1);
  }, []);

  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    
    try {
      setIsSubmitting(true);
      await commentOnPoem(comment, id, null);
      setComment('');
      setCommentCount(prev => prev + 1);
      triggerRefresh();
    } catch (err) {
      console.error("Failed to submit comment:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async () => {
    setIsAnimating(true);

    try {
      const response = await likePoem(slug);

      if (response.status === "liked") {
        setLiked(true);
        setLikesCount(prev => prev + 1);
      } else if (response.status === "unliked") {
        setLiked(false);
        setLikesCount(prev => prev - 1);
      }
    } catch (error) {
      console.error("Error liking poem:", error);
    }

    setTimeout(() => {
      setIsAnimating(false);
    }, 500);
  };

  const fetchComments = useCallback(async () => {
    try {
      setIsLoading(true);
      const commentsData = await getPoemCommentsandReplies(slug);
      setComments(commentsData);
      // Update the comment count based on the fetched data
      if (commentsData) {
        setCommentCount(commentsData.length);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setIsLoading(false);
    }
  }, [slug, getPoemCommentsandReplies]);

  // Handle comment update from child components
  const handleCommentUpdate = useCallback(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    fetchComments();
    getUser();
  }, [fetchComments, updateCounter]);

  // Function to get the avatar source
  const getAvatarSrc = () => {
    if (!user || !user.profile || !user.profile.avatar_url) {
      return Profile; // Default profile image
    }
    return user.profile.avatar_url;
  };

  return (
    <div className="w-[95%] mx-auto mt-5">
      <div className="border rounded-sm w-full p-4 bg-white shadow-sm">
        {/* Top Bar */}
        <div className="flex w-full items-center justify-between border-b border-gray/30 pb-2">
          <div className="flex items-center gap-5">
            <div className="rounded-full">
              {isUserLoading ? (
                // Skeleton for user avatar while loading
                <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
                  <User size={16} className="text-gray-400" />
                </div>
              ) : (
                <Image
                  src={getAvatarSrc()}
                  width={40}
                  height={40}
                  alt="Picture of the author"
                  className="rounded-full object-cover w-10 h-10"
                />
              )}
            </div>
            <div>
              <p className="font-medium">@{isUserLoading ? "Loading..." : (user?.username || username)}</p>
              <p className="text-sm text-gray-500">Poem</p>
            </div>
          </div>
          <div className="text-gray-500 text-end text-sm">5 Mins Ago</div>
        </div>

        {/* Middle part */}
        <div className="font-semibold mt-3">{title}</div>
        <div
          className="my-4 pb-2 border-b border-gray/30 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />

        {/* Lower Section */}
        <div>
          <div className="flex justify-between gap-3 items-center">
            <div className="flex gap-2 items-center flex-1">
              <div className="flex-1">
                <InputComponent 
                  type="text"
                  placeholder="Write a comment..." 
                  Icon={MessageCircleMore} 
                  name="comment" 
                  value={comment} 
                  onChange={handleChange} 
                  // disabled={isSubmitting}
                />
              </div>
              <button
                onClick={handleSubmitComment}
                disabled={isSubmitting || !comment.trim()}
                className={`p-2 rounded-full transition ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              >
                <Send size={18} className={comment.trim() ? 'text-blue-500' : 'text-gray-400'} />
              </button>
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
                    liked ? "fill-link text-link" : "fill-none"
                  )}
                  size={20}
                />
              </button>
              <div className="text-gray-700">{likesCount}</div>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3 mb-4 text-sm text-gray-600 border-b pb-2">
            <span className="font-medium">{commentCount}</span>
            <span>{commentCount === 1 ? 'Comment' : 'Comments'}</span>
          </div>
          
          {/* Comments Section */}
          <div className="space-y-4">
            {isLoading ? (
              // Skeleton loading state
              <>
                <CommentSkeleton />
                <CommentSkeleton />
                <CommentSkeleton />
              </>
            ) : comments && comments.length > 0 ? (
              comments.map((comment) => (
                <RecursiveComment 
                  key={comment.id} 
                  comment={comment} 
                  onUpdate={handleCommentUpdate}
                />
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 text-sm">
                No comments yet. Be the first to share your thoughts!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoetryComponent;