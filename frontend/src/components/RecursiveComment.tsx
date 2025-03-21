import React from 'react'
import Comments from './Comments';

interface CommentType {
    id: string;
    username: string;
    content: string;
    replies?: CommentType[]; // Optional array of nested comments
    depth?: number;
    // Add other properties as needed
  }

// RecursiveComment component that handles both comments and replies
const RecursiveComment = ({ comment, depth = 0 }: { comment: CommentType; depth?: number }) => {
    // Calculate margin based on the depth
    const marginLeft = `${depth * 16}px`;
  
    return (
      <div>
        {/* The comment itself */}
        <div style={{ marginLeft }}>
          <Comments username={comment.username} content={comment.content} />
        </div>
  
        {/* Render replies if they exist */}
        {comment.replies && comment.replies.length > 0 && (
          <div>
            {comment.replies.map((reply) => (
              <RecursiveComment 
                key={reply.id} 
                comment={reply} 
                depth={depth + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

export default RecursiveComment