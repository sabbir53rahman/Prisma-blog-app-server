import { CommentStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const createComment = async (payload: {
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
}) => {
  const postData = await prisma.post.findUniqueOrThrow({
    where: { id: payload.postId },
  });
  // if (!postData) {
  //   throw new Error("Post not found");
  // }
  if (payload.parentId) {
    const parentComment = await prisma.comment.findUniqueOrThrow({
      where: { id: payload.parentId },
    });
  }

  return await prisma.comment.create({ data: { ...payload } });
};

const getCommentById = async (id: string) => {
  return await prisma.comment.findUnique({
    where: { id },
    include: {
      post: {
        select: {
          //for show post title with comment
          id: true,
          title: true,
          views: true,
        },
      },
    },
  });
};

const getCommentByAuthorId = async (authorId: string) => {
  return await prisma.comment.findMany({
    where: { authorId },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        select: {
          //for show post title with comment
          id: true,
          title: true,
          views: true,
        },
      },
    },
  });
};

const deleteComment = async (commentId: string, userId: string) => {
  const commentData = await prisma.comment.findFirst({
    where: { id: commentId, authorId: userId },
    select: { id: true, content: true },
  });

  if (!commentData) {
    throw new Error(
      "Comment not found or you are not authorized to delete this comment"
    );
  }

  const result = await prisma.comment.delete({
    where: { id: commentData.id },
  });

  return result;
};

const updateComment = async (
  commentId: string,
  data: { content?: string; status?: CommentStatus },
  authorId: string
) => {
  const commentData = await prisma.comment.findFirst({
    where: { id: commentId, authorId },
    select: { id: true, content: true },
  });

  if (!commentData) {
    throw new Error(
      "Comment not found or you are not authorized to delete this comment"
    );
  }

  return await prisma.comment.update({
    where: {
      id: commentData.id,
      authorId,
    },
    data,
  });
};

const moderateComment = async (
  commentId: string,
  data: { status: CommentStatus }
) => {
  const commentData = await prisma.comment.findUniqueOrThrow({
    where: { id: commentId },
    select: { id: true, content: true, status: true },
  });

  if (commentData.status === data.status) {
    throw new Error("Comment is already in the desired status");
  }

  return await prisma.comment.update({
    where: {
      id: commentData.id,
    },
    data,
  });
};

export const commentService = {
  createComment,
  getCommentById,
  getCommentByAuthorId,
  deleteComment,
  updateComment,
  moderateComment,
};
