import {
	Body,
	Controller,
	Delete,
	Get,
	MaxFileSizeValidator,
	Param,
	ParseFilePipe,
	Post,
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/guard/jwt.auth.guard';
import { UserDecorator } from 'src/decorators/user.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { PostsService } from './posts.service';

@Controller('posts')
export class PostsController {
	constructor(private postsService: PostsService) {}

	@UseGuards(JwtAuthGuard)
	@Get('')
	async getMyPosts(@UserDecorator() user: User) {
		// TODO: Pagination
		return await this.postsService.getPosts(user);
	}

	@UseGuards(JwtAuthGuard)
	@Get(':id')
	async getPosts(@Param('id') id: string) {
		return await this.postsService.getPostsById(id);
	}

	@UseGuards(JwtAuthGuard)
	@Delete(':id')
	async deletePost(@UserDecorator() user: User, @Param('id') id: string) {
		return await this.postsService.deletePost(parseInt(id), user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Post('create')
	@UseInterceptors(FileInterceptor('file', {}))
	async createPost(
		@UserDecorator() user: User,
		@Body() createPostDto: CreatePostDto,
		@UploadedFile(
			new ParseFilePipe({
				validators: [new MaxFileSizeValidator({ maxSize: parseInt(process.env.MAX_FILE_UPLOAD_SIZE) * 1000 })],
				fileIsRequired: false,
			}),
		)
		file?: Express.Multer.File,
	) {
		return await this.postsService.createPost(user, createPostDto, file);
	}

	@UseGuards(JwtAuthGuard)
	@Post('like/:id')
	async likePost(@UserDecorator() user: User, @Param('id') id: string) {
		await this.postsService.undislikePost(parseInt(id), user.id);
		await this.postsService.likePost(parseInt(id), user.id);
		return await this.postsService.getReactions(parseInt(id));
	}

	@UseGuards(JwtAuthGuard)
	@Post('dislike/:id')
	async dislikePost(@UserDecorator() user: User, @Param('id') id: string) {
		await this.postsService.unlikePost(parseInt(id), user.id);
		await this.postsService.dislikePost(parseInt(id), user.id);
		return await this.postsService.getReactions(parseInt(id));
	}

	@UseGuards(JwtAuthGuard)
	@Get('/top/weekly')
	async getWeeklyTopPost() {
		return await this.postsService.getWeeklyTopPost();
	}

	@UseGuards(JwtAuthGuard)
	@Get('/recent/:page')
	async getRecentPosts(@UserDecorator() user: User, @Param('page') page: string) {
		let take = 2;
		let skip = (parseInt(page) - 1) * take;
		return await this.postsService.getRecentPosts(skip, take, parseInt(page), user);
	}
}
