import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { SpacesService } from 'src/spaces/spaces.service';

@Injectable()
export class PostsService {
    constructor(private prisma: PrismaService, private spaces: SpacesService) { }

    async getPosts(user: User) {
        return await this.prisma.post.findMany({
            where: {
                authorId: user.id
            },
        });
    }

    async getPostsById(id: string) {
        if (isNaN(parseInt(id))) throw new BadRequestException("Invalid user id");
        return await this.prisma.post.findMany({
            where: {
                authorId: parseInt(id)
            },
        });
    }

    async createPost(user: User, data: any, file: Express.Multer.File) {
        let url;
        if (file) {
            url = await this.spaces.uploadFile(file);
            console.log(url);
        }
        return await this.prisma.post.create({
            data: {
                ...data,
                authorId: user.id,
                imageUrl: url
            }
        });
    }

    async getRecentPosts(skip: number, take: number, page: number) {
        let data = await this.prisma.post.findMany({
            skip,
            take,
            orderBy: {
                createdAt: 'desc'
            }
        });
        return { data,
            count: await this.prisma.post.count(), 
            page: page,
            pagesCount: Math.ceil(await this.prisma.post.count() / take) };
    }

    async getWeeklyTopPost() {
        return await this.prisma.post.findFirst({
            where: {
                createdAt: {
                    gte: this.getPastDate()
                }
            },
            orderBy: {
                likedBy: {
                    _count: 'desc'
                }
            },
            include: {
                likedBy: {
                    select: {
                        id: true,
                        name: true
                    },
                }
            },
        });
    }

    async likePost(postId: number, userId: number) {
        return await this.prisma.post.update({
            where: {
                id: postId
            },
            data: {
                likedBy: {
                    connect: {
                        id: userId
                    }
                }
            }
        });
    }

    async unlikePost(postId: number, userId: number) {
        return await this.prisma.post.update({
            where: {
                id: postId
            },
            data: {
                likedBy: {
                    disconnect: {
                        id: userId
                    }
                }
            }
        });
    }

    async dislikePost(postId: number, userId: number) {
        return await this.prisma.post.update({
            where: {
                id: postId
            },
            data: {
                dislikedBy: {
                    connect: {
                        id: userId
                    }
                }
            }
        });
    }

    async undislikePost(postId: number, userId: number) {
        return await this.prisma.post.update({
            where: {
                id: postId
            },
            data: {
                dislikedBy: {
                    disconnect: {
                        id: userId
                    }
                }
            }
        });
    }

    async getReactions(postId: number) {
        return await this.prisma.post.findMany({
            where: {
                id: postId
            },
            select: {
                id: true,
                content: true,
                imageUrl: true,
                authorId: true,
                createdAt: true,
                likedBy: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                dislikedBy: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
    }

    async deletePost(postId: number, userId: number) {
        let post = await this.prisma.post.findFirst({
            where: {
                id: postId,
            }
        });
        if (post === undefined || post === null) {
            throw new NotFoundException();
        }
        if (post?.authorId !== userId) {
            throw new UnauthorizedException();
        }
        return await this.prisma.post.delete({
            where: {
                id: postId
            }
        });
    }


    private getPastDate() {
        const today = new Date();
        today.setDate(today.getDate() - 7);
        return today;
    }

}
