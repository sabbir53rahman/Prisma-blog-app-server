import express, { Router } from "express";
import { PostController } from "./post.controller";
import auth, { UserRole } from "../../middlewares/auth";

const router = express.Router();

router.get("/", PostController.getAllPost);

router.get(
  "/my-posts",
  auth(UserRole.USER, UserRole.ADMIN),
  PostController.getMyPosts
);

router.get("/stats", auth(UserRole.ADMIN), PostController.getPostStats);

router.get("/:id", PostController.getPostById);

router.post("/", auth(UserRole.USER), PostController.createPost);

router.patch(
  "/:postId",
  auth(UserRole.USER, UserRole.ADMIN),
  PostController.updatePost
);
router.delete(
  "/:postId",
  auth(UserRole.USER, UserRole.ADMIN),
  PostController.deletePost
);

export const postRouter: Router = router;
