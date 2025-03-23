import React, { useEffect, useState } from 'react';
import Image from "next/image";
import Profile from "../../public/images/logo.png";
import { Heart, MessageCircleMore, Send, Trash } from "lucide-react";
import InputComponent from "@/components/InputComponent";
import { twMerge } from "tailwind-merge";
import usePoetryStore from "@/store/poetryStore";
import { useUserStore } from '@/store/userStore';
import { formatTimeDifference } from '@/utils/FormatTimeDifference';

// Comment skeleton for loading states
const CommentSkeleton = ({ depth = 0 }) => {
  const marginLeft = `${depth * 16}px`;
  
  return (
    <div className="animate-pulse" style={{ marginLeft }}>
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-gray-200 h-6 w-6"></div>
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-2 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-2 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    </div>
  );
};

const Comment = ({ 
  id,
  profileImg,
  username, 
  content, 
  isLiked, 
  likes_num, 
  comment_num,
  user_id,
  onUpdate,
  date
}) => {
  const { likeComment, commentOnPoem, deleteComment } = usePoetryStore();
  const { getSingleUser } = useUserStore();

  const timeDifference = formatTimeDifference(date);
  
  const [isLoading, setIsLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(parseInt(likes_num) || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [user, setUser] = useState(null);

  const handleChange = (e) => {
    setComment(e.target.value);
  };

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

  useEffect(() => {
    if (user_id) {
      getUser();
    }
  }, [user_id]);

  const handleLike = async () => {
    setIsAnimating(true);

    try {
      const response = await likeComment(id);

      if (response.status === "liked") {
        setLiked(true);
        setLikesCount(prev => prev + 1);
      } else if (response.status === "unliked") {
        setLiked(false);
        setLikesCount(prev => prev - 1);
      }
      
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
      await deleteComment(id);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to delete comment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!comment.trim()) return;
    
    try {
      setIsLoading(true);
      await commentOnPoem(comment, null, id);
      setComment("");
      setShowReplyInput(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Failed to submit reply:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="rounded-full flex-shrink-0">
          {isUserLoading ? (
            // Show skeleton while loading
            <div className="bg-gray-200 rounded-full w-[30px] h-[30px] animate-pulse"></div>
          ) : user && user.profile && user.profile.avatar_url ? (
            <Image
              src={user.profile.avatar_url}
              width={30}
              height={30}
              alt="Profile picture"
              className="rounded-full object-cover h-7 w-7"
            />
          ) : (
            // Fallback to default profile image
            <Image
              src={Profile}
              width={30}
              height={30}
              alt="Default profile"
              className="rounded-full"
            />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-sm">@{username}</p>
              <p className='text-xs'>{timeDifference} ago</p>
              <p className="text-sm text-gray-600 my-1">{content}</p>
            </div>

            
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteComment}
                disabled={isLoading}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash size={16} />
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
                      liked ? "fill-link text-link" : "fill-none text-gray-400 hover:text-gray-600"
                    )}
                    size={16}
                  />
                </button>
                <span className="text-xs text-gray-600">{likesCount}</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="text-xs text-link hover:underline mt-1"
          >
            {showReplyInput ? "Cancel" : "Reply"}
          </button>
          
          {showReplyInput && (
            <div className="flex gap-2 items-center mt-2">
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
                className={`p-1 rounded ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
              >
                <Send size={16} className={comment.trim() ? 'text-link' : 'text-gray-400'} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// RecursiveComment component that handles both comments and replies
const RecursiveComment = ({ 
  comment, 
  depth = 0, 
  onUpdate,
  isLoading = false
}) => {
  // Calculate margin based on the depth
  const marginLeft = `${depth * 16}px`;
  
  if (isLoading) {
    return <CommentSkeleton depth={depth} />;
  }

  // console.log(comment);
  
  return (
    <div style={{ marginLeft }}>
      {/* The comment itself */}
      <Comment
        username={comment.username}
        content={comment.content}
        id={comment.id}
        user_id={comment.user} // Pass the user_id from comment
        likes_num={comment.likes_count}
        comment_num={comment.replies_count}
        isLiked={comment.is_liked}
        onUpdate={onUpdate}
        date={comment.updated_at}
      />
  
      {/* Render replies if they exist */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-6 mt-1 border-l-2 border-gray-100 pl-2">
          {comment.replies.map((reply) => (
            <RecursiveComment 
              key={reply.id} 
              comment={reply} 
              depth={depth + 1} 
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecursiveComment;