import { isAuth } from "../middleware/isAuth";
import { MyContext } from "src/types";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Post } from "../entities/Post";

@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@Resolver()
export class PostResolver {
  //READ
  @Query(() => [Post])
  posts(): Promise<Post[]> {
    return Post.find();
  }

  //READ
  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  //CREATE
  @Mutation(() => Post || Boolean)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("argInput") argInput: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post | Boolean> {
    try {
      return Post.create({
        ...argInput,
        creatorId: req.session.userId,
      }).save();
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  //UPDATE
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title", () => String, { nullable: true }) title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id); //Fisrt sql query to find.

    if (!post) {
      return null;
    }

    if (typeof title !== "undefined") {
      // post.title = title;
      // await em.persistAndFlush(post);
      await Post.update({ id }, { title }); //Second query to update.
      return post;
    }

    //if only id, no title then return null
    return null;
  }

  //DELETE
  @Mutation(() => Boolean)
  async deletePost(@Arg("id", () => Int) id: number): Promise<boolean> {
    try {
      await Post.delete(id);
      return true;
    } catch (error) {
      return false;
    }
  }
}
