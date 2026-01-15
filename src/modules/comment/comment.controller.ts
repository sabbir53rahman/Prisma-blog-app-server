import { Request, Response } from "express";
import { commentService } from "./comment.service";
import { CommentStatus } from "../../../generated/prisma/enums";

const createComment = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    req.body.authorId = user?.id;

    // if (!user) {
    //   return res.status(400).json({
    //     error: "Unauthorized! ",
    //   });
    // }
    const result = await commentService.createComment(req.body);
    return res.status(201).json(result);
  } catch (error: any) {
    console.log("POST CREATE ERROR >>>", error);

    res.status(400).json({
      success: false,
      message: "Comment creation failed",
      error: error.message,
      meta: error.meta,
    });
  }
};

const getCommentById = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const result = await commentService.getCommentById(commentId as string);
    return res.status(201).json(result);
  } catch (error: any) {
    console.log("POST CREATE ERROR >>>", error);

    res.status(400).json({
      success: false,
      message: "Comment fetched failed",
      error: error.message,
      meta: error.meta,
    });
  }
};

const getCommentByAuthorId = async (req: Request, res: Response) => {
  try {
    const { authorId } = req.params;
    const result = await commentService.getCommentByAuthorId(
      authorId as string
    );
    return res.status(201).json(result);
  } catch (error: any) {
    console.log("POST CREATE ERROR >>>", error);
    res.status(400).json({
      success: false,
      message: "Comment fetched failed",
      error: error.message,
      meta: error.meta,
    });
  }
};

const deleteComment = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { commentId } = req.params;
    const result = await commentService.deleteComment(
      commentId as string,
      user?.id as string
    );
    return res.status(201).json(result);
  } catch (error: any) {
    console.log("POST CREATE ERROR >>>", error);
    res.status(400).json({
      success: false,
      message: "Comment delete failed",
      error: error.message,
      meta: error.meta,
    });
  }
};

const updateComment = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { commentId } = req.params;
    const result = await commentService.updateComment(
      commentId as string,
      req.body,
      user?.id as string
    );
    return res.status(201).json(result);
  } catch (error: any) {
    console.log("POST CREATE ERROR >>>", error);
    res.status(400).json({
      success: false,
      message: "Comment update failed",
      error: error.message,
      meta: error.meta,
    });
  }
};

const moderateComment = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { commentId } = req.params;
    const result = await commentService.moderateComment(
      commentId as string,
      req.body
    );
    return res.status(201).json(result);
  } catch (error: any) {
    console.log("POST CREATE ERROR >>>", error);
    res.status(400).json({
      success: false,
      message: "Comment update failed",
      error: error.message,
      meta: error.meta,
    });
  }
};

export const commentController = {
  createComment,
  getCommentById,
  getCommentByAuthorId,
  deleteComment,
  updateComment,
  moderateComment,
};
