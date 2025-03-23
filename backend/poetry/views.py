from rest_framework import status, filters
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
import logging

from .models import Poem, Comment, Like
from .serializers import (
    PoemListSerializer, 
    PoemDetailSerializer,
    CommentSerializer,
    RecursiveCommentSerializer, 
    LikeSerializer
)

logger = logging.getLogger(__name__)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def poem_list(request):
    """
    List all poems or create a new poem
    """
    if request.method == 'GET':
        # Get base queryset
        poems = Poem.objects.all().select_related('user')
        
        # Add counts for likes and comments
        poems = poems.annotate(
                likes_count=Count('likes', distinct=True),
                comments_count=Count('comments', distinct=True)
        )
        
        # Filter by user if requested
        user_id = request.query_params.get('user')
        if user_id:
            poems = poems.filter(user_id=user_id)
        
        # Handle search
        search_query = request.query_params.get('search')
        if search_query:
            poems = poems.filter(
                Q(title__icontains=search_query) | 
                Q(content__icontains=search_query) | 
                Q(description__icontains=search_query)
            )
        
        # Handle ordering
        ordering = request.query_params.get('ordering', '-created_at')
        poems = poems.order_by(ordering)
        
        # Pagination (basic implementation)
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        poems_page = poems[start:end]
        
        serializer = PoemListSerializer(poems_page, many=True, context={'request': request})
        return Response({
            'count': poems.count(),
            'results': serializer.data
        })
    
    elif request.method == 'POST':
        serializer = PoemListSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            logger.info(f"Poem created: '{serializer.instance.title}' by {request.user.username}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticatedOrReadOnly])
def poem_detail(request, slug):
    """
    Retrieve, update or delete a poem
    """
    try:
        poem = Poem.objects.select_related('user').get(slug=slug)
        
        # Add counts for likes and comments
        poem.likes_count = Like.objects.filter(poem=poem).count()
        poem.comments_count = Comment.objects.filter(poem=poem).count()
        
    except Poem.DoesNotExist:
        return Response({'error': 'Poem not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = PoemDetailSerializer(poem)
        return Response(serializer.data)
    
    # Check if user is the author for PUT and DELETE
    if request.user != poem.user and not request.user.is_staff:
        return Response({'error': 'You do not have permission to modify this poem'}, 
                        status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'PUT':
        serializer = PoemDetailSerializer(poem, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Poem updated: '{poem.title}' by {request.user.username}")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        poem.delete()
        logger.info(f"Poem deleted: '{poem.title}' by {request.user.username}")
        return Response({'message': 'Poem deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def poem_like(request, slug):
    """
    Like or unlike a poem
    """
    poem = get_object_or_404(Poem, slug=slug)
    user = request.user
    
    # Check if the user has already liked this poem
    like = Like.objects.filter(
        user=user,
        poem=poem,
        content_type='poem'
    ).first()
    
    if like:
        # Unlike
        like.delete()
        logger.info(f"User {user.username} unliked poem: {poem.title}")
        return Response({"status": "unliked"}, status=status.HTTP_200_OK)
    else:
        # Like
        like = Like(user=user, poem=poem, content_type='poem')
        like.save()
        logger.info(f"User {user.username} liked poem: {poem.title}")
        return Response({"status": "liked"}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def poem_comments(request, slug):
    """
    Get all comments for a poem
    """
    poem = get_object_or_404(Poem, slug=slug)
    
    # Get only top-level comments
    top_comments = Comment.objects.filter(
        poem=poem, 
        parent=None
    ).select_related('user').prefetch_related('replies')
    
    # Count all descendants for each comment
    for comment in top_comments:
        # Use exclude instead of ne (which doesn't exist in Django)
        # This gets all comments with path starting with this comment's path
        # but excludes the comment itself
        descendants = Comment.objects.filter(
            path__startswith=comment.path
        ).exclude(id=comment.id).count()
        
        # Add the count as an attribute
        comment.total_replies_count = descendants
    
    # Annotate with like counts
    top_comments = top_comments.annotate(
        likes_count=Count('likes', distinct=True),
        replies_count=Count('replies', distinct=True)
    )
    
    serializer = RecursiveCommentSerializer(top_comments, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticatedOrReadOnly])
def comment_list(request):
    """
    List all comments or create a new comment
    """
    if request.method == 'GET':
        comments = Comment.objects.all().select_related('user', 'poem', 'parent')
        
        # Add counts for likes and replies
        comments = comments.annotate(
            likes_count=Count('likes', distinct=True),
            replies_count=Count('replies', distinct=True)
        )
        
        # Filter by poem if requested
        poem_id = request.query_params.get('poem')
        if poem_id:
            comments = comments.filter(poem_id=poem_id)
        
        # Filter by parent if requested (for replies)
        parent_id = request.query_params.get('parent')
        if parent_id:
            comments = comments.filter(parent_id=parent_id)
        
        # Filter by user if requested
        user_id = request.query_params.get('user')
        if user_id:
            comments = comments.filter(user_id=user_id)
        
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            
            # Log appropriate message based on whether it's a comment or reply
            if serializer.instance.parent:
                logger.info(f"Reply created by {request.user.username} on comment {serializer.instance.parent.id}")
            else:
                logger.info(f"Comment created by {request.user.username} on poem '{serializer.instance.poem.title}'")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticatedOrReadOnly])
def comment_detail(request, pk):
    """
    Retrieve, update or delete a comment
    """
    try:
        comment = Comment.objects.select_related('user', 'poem', 'parent').get(pk=pk)
        
        # Add counts for likes and replies
        comment.likes_count = Like.objects.filter(comment=comment).count()
        comment.replies_count = Comment.objects.filter(parent=comment).count()
        
    except Comment.DoesNotExist:
        return Response({'error': 'Comment not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = CommentSerializer(comment)
        return Response(serializer.data)
    
    # Check if user is the author for PUT and DELETE
    if request.user != comment.user and not request.user.is_staff:
        return Response({'error': 'You do not have permission to modify this comment'}, 
                        status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'PUT':
        serializer = CommentSerializer(comment, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Comment updated by {request.user.username}")
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        comment.delete()
        logger.info(f"Comment deleted by {request.user.username}")
        return Response({'message': 'Comment deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def comment_like(request, pk):
    """
    Like or unlike a comment
    """
    comment = get_object_or_404(Comment, pk=pk)
    user = request.user
    
    # Check if the user has already liked this comment
    like = Like.objects.filter(
        user=user,
        comment=comment,
        content_type='comment'
    ).first()
    
    if like:
        # Unlike
        like.delete()
        logger.info(f"User {user.username} unliked comment {comment.id}")
        return Response({"status": "unliked"}, status=status.HTTP_200_OK)
    else:
        # Like
        like = Like(user=user, comment=comment, content_type='comment')
        like.save()
        logger.info(f"User {user.username} liked comment {comment.id}")
        return Response({"status": "liked"}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def comment_replies(request, pk):
    """
    Get all replies for a specific comment
    """
    comment = get_object_or_404(Comment, pk=pk)
    
    # Get direct replies only
    replies = Comment.objects.filter(
        parent=comment
    ).select_related('user').prefetch_related('replies')
    
    # Annotate with counts
    replies = replies.annotate(
        likes_count=Count('likes', distinct=True),
        replies_count=Count('replies', distinct=True)
    )
    
    serializer = RecursiveCommentSerializer(replies, many=True, context={'request': request})
    return Response(serializer.data)