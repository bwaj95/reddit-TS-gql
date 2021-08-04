"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResolver = void 0;
const argon2_1 = __importDefault(require("argon2"));
const type_graphql_1 = require("type-graphql");
const uuid_1 = require("uuid");
const constants_1 = require("../constants");
const User_1 = require("../entities/User");
const sendEmail_1 = require("../utils/sendEmail");
let UserEmailPasswordInput = class UserEmailPasswordInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], UserEmailPasswordInput.prototype, "useremail", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], UserEmailPasswordInput.prototype, "password", void 0);
UserEmailPasswordInput = __decorate([
    type_graphql_1.InputType()
], UserEmailPasswordInput);
let UserRegisterInput = class UserRegisterInput {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], UserRegisterInput.prototype, "username", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], UserRegisterInput.prototype, "useremail", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], UserRegisterInput.prototype, "password", void 0);
UserRegisterInput = __decorate([
    type_graphql_1.InputType()
], UserRegisterInput);
let FieldError = class FieldError {
};
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", Number)
], FieldError.prototype, "id", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], FieldError.prototype, "field", void 0);
__decorate([
    type_graphql_1.Field(),
    __metadata("design:type", String)
], FieldError.prototype, "message", void 0);
FieldError = __decorate([
    type_graphql_1.ObjectType()
], FieldError);
let UserResponse = class UserResponse {
};
__decorate([
    type_graphql_1.Field(() => type_graphql_1.Int, { nullable: true }),
    __metadata("design:type", Number)
], UserResponse.prototype, "id", void 0);
__decorate([
    type_graphql_1.Field(() => [FieldError], { nullable: true }),
    __metadata("design:type", Array)
], UserResponse.prototype, "error", void 0);
__decorate([
    type_graphql_1.Field(() => User_1.User, { nullable: true }),
    __metadata("design:type", User_1.User)
], UserResponse.prototype, "user", void 0);
UserResponse = __decorate([
    type_graphql_1.ObjectType()
], UserResponse);
let UserResolver = class UserResolver {
    users() {
        return User_1.User.find();
    }
    me({ req }) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const user = yield User_1.User.findOne(req.session.userId);
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
            }
            catch (error) {
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
        });
    }
    register(argInput, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
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
            var regexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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
                const hashedPassword = yield argon2_1.default.hash(argInput.password);
                const user = yield User_1.User.create({
                    username: argInput.username,
                    useremail: argInput.useremail,
                    password: hashedPassword,
                }).save();
                req.session.userId = user.id;
                return { id: user.id, user };
            }
            catch (error) {
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
        });
    }
    login(argInput, { req }) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(req.session);
            try {
                const user = yield User_1.User.findOne({
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
                if (yield argon2_1.default.verify(user.password, argInput.password)) {
                    req.session.userId = user.id;
                    return { id: user.id, user };
                }
                else {
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
            }
            catch (error) {
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
        });
    }
    logout({ req, res }) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                req.session.destroy((err) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                        return;
                    }
                    res.clearCookie(constants_1.COOKIE_NAME);
                    resolve(true);
                });
            });
        });
    }
    forgotPassword(useremail, { redis }) {
        return __awaiter(this, void 0, void 0, function* () {
            var regexp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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
                const user = yield User_1.User.findOne({ where: { useremail } });
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
                const token = uuid_1.v4();
                yield redis.set(constants_1.FORGET_PASSWORD_PREFIX + token, user.id, "ex", 1000 * 60 * 60);
                yield sendEmail_1.sendEmail(useremail, `<a href="http://localhost:3000/change-password/${token}">Click to reset your password.</a>`);
            }
            catch (error) {
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
        });
    }
    changePassword(token, newPassword, { redis, req }) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = yield redis.get(constants_1.FORGET_PASSWORD_PREFIX + token);
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
                const userIdNum = parseInt(userId);
                const user = yield User_1.User.findOne(userIdNum);
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
                yield User_1.User.update({ id: userIdNum }, { password: yield argon2_1.default.hash(newPassword) });
                yield redis.del(constants_1.FORGET_PASSWORD_PREFIX + token);
                req.session.userId = user.id;
                return { id: user.id, user };
            }
            catch (error) {
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
        });
    }
};
__decorate([
    type_graphql_1.Query(() => [User_1.User]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "users", null);
__decorate([
    type_graphql_1.Query(() => UserResponse),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "me", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("argInput", () => UserRegisterInput)),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserRegisterInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "register", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("argInput")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserEmailPasswordInput, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "login", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean),
    __param(0, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "logout", null);
__decorate([
    type_graphql_1.Mutation(() => Boolean || UserResponse),
    __param(0, type_graphql_1.Arg("useremail")),
    __param(1, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "forgotPassword", null);
__decorate([
    type_graphql_1.Mutation(() => UserResponse),
    __param(0, type_graphql_1.Arg("token")),
    __param(1, type_graphql_1.Arg("newPassword")),
    __param(2, type_graphql_1.Ctx()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UserResolver.prototype, "changePassword", null);
UserResolver = __decorate([
    type_graphql_1.Resolver()
], UserResolver);
exports.UserResolver = UserResolver;
//# sourceMappingURL=user.js.map