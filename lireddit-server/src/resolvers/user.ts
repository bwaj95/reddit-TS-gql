import argon2 from "argon2";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "type-graphql";
import { v4 } from "uuid";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { User } from "../entities/User";
import { MyContext } from "../types";
import { sendEmail } from "../utils/sendEmail";

@InputType()
class UserEmailPasswordInput {
  @Field()
  useremail: string;

  @Field()
  password: string;
}

@InputType()
class UserRegisterInput {
  @Field()
  username: string;

  @Field()
  useremail: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  id: number;

  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => Int, { nullable: true })
  id: number;

  @Field(() => [FieldError], { nullable: true })
  error?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  users(): Promise<User[]> {
    return User.find();
  }

  @Query(() => UserResponse)
  async me(@Ctx() { req }: MyContext): Promise<UserResponse> {
    if (!req.session.userId) {
      return {
        id: 0,
        error: [
          {
            id: 110,
            field: "Session Missing",
            message: "Please login.",
          },
        ],
      };
    }

    try {
      const user = await User.findOne(req.session.userId);

      if (!user) {
        return {
          id: 0,
          error: [
            {
              id: 110,
              field: "Session Missing",
              message: "No user found. Please Register.",
            },
          ],
        };
      }

      return { id: user.id, user };
    } catch (error) {
      return {
        id: 0,
        error: [
          {
            id: 110,
            field: "Session Missing",
            message: error.message,
          },
        ],
      };
    }
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("argInput", () => UserRegisterInput)
    argInput: UserRegisterInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    // // // USERNAME VALIDATION
    if (argInput.username.length < 4) {
      return {
        id: 0,
        error: [
          {
            id: 101,
            field: "Username",
            message: "Username must be atleast 4 characters long.",
          },
        ],
      };
    }
    if (argInput.username.includes("@")) {
      return {
        id: 0,
        error: [
          {
            id: 101,
            field: "Username",
            message: `Username must not include "@"`,
          },
        ],
      };
    }

    // // // EMAIL VALIDATION
    var regexp =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!regexp.test(argInput.useremail)) {
      return {
        id: 0,
        error: [
          {
            id: 102,
            field: "Email ID",
            message: "Invalid Email ID.",
          },
        ],
      };
    }
    // // // Password length validation.
    if (argInput.password.length >= 16 || argInput.password.length <= 3) {
      return {
        id: 0,
        error: [
          {
            id: 103,
            field: "Password",
            message: "Password length should be 3 to 16 characters long.",
          },
        ],
      };
    }

    try {
      const hashedPassword = await argon2.hash(argInput.password);

      const user = await User.create({
        username: argInput.username,
        useremail: argInput.useremail,
        password: hashedPassword,
      }).save();

      // const result = await getConnection()
      //   .createQueryBuilder()
      //   .insert()
      //   .into(User)
      //   .values({
      //     username: argInput.username,
      //     useremail: argInput.useremail,
      //     password: hashedPassword,
      //   })
      //   .returning("*")
      //   .execute();
      //   const user = result.raw[0];
      //console.log("result: ", result);
      //console.log("User: ", user);

      //store user ID in session.
      //This will set a cookie on the user and keep them logged in.
      req.session.userId = user.id;

      return { id: user.id, user };
    } catch (error) {
      //console.log("error: ", error);
      if (error.code === "23505" || error.detail.includes("already exists")) {
        return {
          id: 0,
          error: [
            {
              id: 102,
              field: "Email ID",
              message: "Email already exists.",
            },
          ],
        };
      }

      return {
        id: 0,
        error: [
          {
            id: 104,
            field: "User Register",
            message: error.message,
          },
        ],
      };
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("argInput") argInput: UserEmailPasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    console.log(req.session);
    try {
      const user = await User.findOne({
        where: { useremail: argInput.useremail },
      });
      if (!user) {
        return {
          id: 0,
          error: [
            {
              id: 102,
              field: "Email ID",
              message: "Invalid Email ID.",
            },
          ],
        };
      }

      if (await argon2.verify(user.password, argInput.password)) {
        req.session.userId = user.id;
        return { id: user.id, user };
      } else {
        return {
          id: 0,
          error: [
            {
              id: 103,
              field: "Password",
              message: "Invalid Password.",
            },
          ],
        };
      }
    } catch (error) {
      return {
        id: 0,
        error: [
          {
            id: 105,
            field: "User Login",
            message: error.message,
          },
        ],
      };
    }
  }

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) => {
      req.session.destroy((err) => {
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        res.clearCookie(COOKIE_NAME);
        resolve(true);
      });
    });
  }

  @Mutation(() => Boolean || UserResponse)
  async forgotPassword(
    @Arg("useremail") useremail: string,
    @Ctx() { redis }: MyContext
  ): Promise<Boolean | UserResponse> {
    // // // EMAIL VALIDATION
    var regexp =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!regexp.test(useremail)) {
      return {
        id: 0,
        error: [
          {
            id: 102,
            field: "Email ID",
            message: "Invalid Email ID.",
          },
        ],
      };
    }

    try {
      const user = await User.findOne({ where: { useremail } });
      //when searching ny a value that's not a primary key,
      //use {where: {value}} syntax.

      if (!user) {
        return {
          id: 0,
          error: [
            {
              id: 102,
              field: "Email ID",
              message: "User not found. Please Register.",
            },
          ],
        };
      }

      const token = v4();
      await redis.set(
        FORGET_PASSWORD_PREFIX + token,
        user.id,
        "ex",
        1000 * 60 * 60
      ); //1 hr
      await sendEmail(
        useremail,
        `<a href="http://localhost:3000/change-password/${token}">Click to reset your password.</a>`
      );
    } catch (error) {
      console.log(error);
      return {
        id: 0,
        error: [
          {
            id: 106,
            field: "Forgot Password",
            message: error.messsage,
          },
        ],
      };
    }

    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    // // // Token validation
    const userId = await redis.get(FORGET_PASSWORD_PREFIX + token);
    console.log("UserID: ", userId);
    if (!userId) {
      return {
        id: 0,
        error: [
          {
            id: 107,
            field: "token",
            message: "Token Expired.",
          },
        ],
      };
    }

    // // // Password length validation.
    if (newPassword.length >= 16 || newPassword.length <= 3) {
      return {
        id: 0,
        error: [
          {
            id: 108,
            field: "newPassword",
            message: "Password length should be 3 to 16 characters long.",
          },
        ],
      };
    }

    try {
      // // // Find user.
      const userIdNum = parseInt(userId);
      const user = await User.findOne(userIdNum);

      if (!user) {
        return {
          id: 0,
          error: [
            {
              id: 102,
              field: "Email ID",
              message: "User doesn't exist. Please Register.",
            },
          ],
        };
      }

      // // // If user found, get newPassword, hash it and write to db.
      await User.update(
        { id: userIdNum },
        { password: await argon2.hash(newPassword) }
      );
      await redis.del(FORGET_PASSWORD_PREFIX + token);
      // // // Return user, set session and cookie. Auto Login.
      req.session.userId = user.id;
      return { id: user.id, user };
    } catch (error) {
      return {
        id: 0,
        error: [
          {
            id: 109,
            field: "Change Password.",
            message: error.message,
          },
        ],
      };
    }
  }
}
