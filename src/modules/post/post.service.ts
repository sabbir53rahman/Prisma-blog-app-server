import {
  CommentStatus,
  Post,
  PostStatus,
} from "../../../generated/prisma/client";
import { PostWhereInput } from "../../../generated/prisma/models";
import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

const createPost = async (
  data: Omit<Post, "id" | "createAt" | "updatedAt" | "authorId">,
  userId: string
) => {
  const result = await prisma.post.create({
    data: {
      ...data,
      authorId: userId,
    },
  });
  return result;
};

const getAllPost = async ({
  search,
  tags,
  isFeatured,
  status,
  authorId,
  page,
  limit,
  skip,
  sortBy,
  sortOrder,
}: {
  search?: string | undefined;
  tags: string[] | [];
  isFeatured: boolean | undefined;
  status: PostStatus | undefined;
  authorId: string | undefined;
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: string;
}) => {
  const andConditions: PostWhereInput[] = [];

  if (search) {
    {
      andConditions.push({
        OR: [
          {
            title: {
              contains: search as string,
              mode: "insensitive",
            },
          },
          {
            content: {
              contains: search as string,
              mode: "insensitive",
            },
          },
          {
            tags: {
              has: search as string,
            },
          },
        ],
      });
    }
  }

  if (tags.length > 0) {
    andConditions.push({
      tags: {
        hasEvery: tags as string[],
      },
    });
  }

  if (typeof isFeatured === "boolean") {
    andConditions.push({
      isFeatured,
    });
  }

  if (status) {
    andConditions.push({
      status,
    });
  }

  if (authorId) {
    andConditions.push({
      authorId,
    });
  }

  const allPost = await prisma.post.findMany({
    take: limit,
    skip,
    where: {
      AND: andConditions,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    include: {
      _count: {
        select: { comments: true },
      },
    },
  });

  const total = await prisma.post.count({
    where: {
      AND: andConditions,
    },
  });

  const totalPage = Math.ceil(total / limit);
  return {
    data: allPost,
    pagination: {
      total,
      page,
      limit,
      totalPage,
    },
  };
};

const getPostById = async (id: string) => {
  const result = await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: {
        id,
      },
      data: {
        views: {
          increment: 1,
        },
      },
    });
    const postData = await tx.post.findUnique({
      where: {
        id,
      },
      include: {
        comments: {
          where: {
            parentId: null,
            status: CommentStatus.APPROVED,
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            replies: {
              where: {
                status: CommentStatus.APPROVED,
              },
              orderBy: {
                createdAt: "asc",
              },
              include: {
                replies: true,
              },
            },
          },
        },
        _count: {
          select: { comments: true },
        },
      },
    });
    return postData;
  });
  return result;
};

const getMyPosts = async (authorId: string) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      id: authorId,
      status: "ACTIVE",
    },
    select: {
      id: true,
    },
  });

  const result = await prisma.post.findMany({
    where: {
      authorId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  const total = await prisma.post.count({
    //this count can be create with aggregate
    where: {
      authorId,
    },
  });

  return {
    data: result,
    total,
  };
};

// user isfeatured update korte parbe na admin sob kisu update korte parbe
const updatePost = async (
  postId: string,
  data: Partial<Post>,
  authorId: string,
  isAdmin: boolean
) => {
  const postData = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!isAdmin && postData.authorId !== authorId) {
    throw new Error("You are not authorized to update this post");
  }

  if (!isAdmin) {
    delete data.isFeatured;
  }

  return await prisma.post.update({
    where: {
      id: postId,
    },
    data: {
      ...data,
    },
  });
};

const deletePost = async (
  postId: string,
  authorId: string,
  isAdmin: boolean
) => {
  const postData = await prisma.post.findUniqueOrThrow({
    where: {
      id: postId,
    },
    select: {
      id: true,
      authorId: true,
    },
  });

  if (!isAdmin && postData.authorId !== authorId) {
    throw new Error("You are not authorized to update this post");
  }

  return await prisma.post.delete({
    where: {
      id: postId,
    },
  });
};

const getPostStats = async () => {
  return await prisma.$transaction(async (tx) => {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      featuredPosts,
      totalComments,
      approvedComments,
      totalUsers,
      adminCount,
      userCount,
      totalViews,
    ] = await Promise.all([
      // 1
      tx.post.count(),

      // 2
      tx.post.count({
        where: { status: PostStatus.PUBLISHED },
      }),

      // 3
      tx.post.count({
        where: { status: PostStatus.DRAFT },
      }),

      // 4
      tx.post.count({
        where: { isFeatured: true },
      }),

      // 5
      tx.comment.count(),

      // 6
      tx.comment.count({
        where: { status: CommentStatus.APPROVED },
      }),

      // 7 ✅ TOTAL USERS
      tx.user.count(),

      // 8 ✅ ADMINS
      tx.user.count({
        where: { role: "ADMIN" },
      }),

      // 9 ✅ USERS
      tx.user.count({
        where: { role: "USER" },
      }),
      tx.post.aggregate({
        _sum: {
          views: true,
        },
      }),
    ]);

    console.log("Stats:", totalUsers, adminCount, userCount);

    return {
      totalPosts,
      publishedPosts,
      draftPosts,
      featuredPosts,
      totalComments,
      approvedComments,
      totalUsers,
      adminCount,
      userCount,
      totalViews: totalViews._sum.views || 0,
    };
  });
};

export const postService = {
  createPost,
  getAllPost,
  getPostById,
  getMyPosts,
  updatePost,
  deletePost,
  getPostStats,
};
