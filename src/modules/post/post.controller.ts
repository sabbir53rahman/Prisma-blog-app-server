import { Request, Response } from "express";
import { postService } from "./post.service";
import { prisma } from "../../lib/prisma";
import { error } from "node:console";
import { PostStatus } from "../../../generated/prisma/enums";
import paginationSortingHelper from "../../helpers/paginationSortingHelper";
import { UserRole } from "../../middlewares/auth";

const createPost = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({
        error: "Unsuthorized! ",
      });
    }
    const result = await postService.createPost(req.body, user.id);
    return res.status(201).json(result);
  } catch (error: any) {
    console.log("POST CREATE ERROR >>>", error);

    res.status(400).json({
      success: false,
      message: "Post creation failed",
      error: error.message,
      meta: error.meta,
    });
  }
};

const getAllPost = async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    const searchString = typeof search === "string" ? search : undefined;

    const tags = req.query.tags ? (req.query.tags as string).split(",") : [];

    // true or false
    const isFeatured = req.query.isFeatured
      ? req.query.isFeatured === "true"
        ? true
        : req.query.isFeatured === "false"
        ? false
        : undefined
      : undefined;

    const status = req.query.status as PostStatus | undefined;

    const authorId = req.query.authorId as string | undefined;

    const { page, limit, skip, sortBy, sortOrder } = paginationSortingHelper(
      req.query
    );

    const result = await postService.getAllPost({
      search: searchString,
      tags,
      isFeatured,
      status,
      authorId,
      page,
      limit,
      skip,
      sortBy,
      sortOrder,
    });
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({
      error: "post creation failed",
      details: err,
    });
  }
};

const getPostById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new Error("Post id is required");
    }

    const result = await postService.getPostById(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({
      error: "post creation failed",
      details: err,
    });
  }
};

const getMyPosts = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      throw new Error("you are unauthorized");
    }

    const result = await postService.getMyPosts(user.id as string);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({
      error: "post update failed",
      details: err,
    });
  }
};

const updatePost = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      throw new Error("you are unauthorized");
    }
    const { postId } = req.params;

    const isAdmin = req.user?.role === UserRole.ADMIN;
    console.log(user);
    const result = await postService.updatePost(
      postId as string,
      req.body,
      user.id as string,
      isAdmin
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({
      error: "post fetched failed",
      details: err,
    });
  }
};

const deletePost = async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      throw new Error("you are unauthorized");
    }
    const { postId } = req.params;

    const isAdmin = req.user?.role === UserRole.ADMIN;
    console.log(user);
    const result = await postService.deletePost(
      postId as string,
      user.id as string,
      isAdmin
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({
      error: "post delete failed",
      details: err,
    });
  }
};

const getPostStats = async (req: Request, res: Response) => {
  try {
    const result = await postService.getPostStats();
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({
      error: "post stats fetched failed",
      details: err,
    });
  }
};
export const PostController = {
  createPost,
  getAllPost,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
  getPostStats,
};
