const { AuthenticationError } = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");

const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        const userData = await User.findOne({ _id: context.user._id }).select(
          "-__v -password"
        );
        return userData;
      }
      throw new AuthenticationError("You must logged in!");
    },
  },

  Mutation: {
    addUser: async (parent, args) => {
      if (args) {
        const user = await User.create(args);
        const token = signToken(user);
        return { token, user };
      }
    },
    login: async (parent, { email, password }) => {
      if (email && password) {
        const user = await User.findOne({ email });

        if (!user) {
          throw new AuthenticationError(
            "can not find any user with this email"
          );
        } else {
          const checkPass = await user.isCorrectPassword(password);

          if (!checkPass) {
            throw new AuthenticationError("Incorrect credentials");
          } else {
            const token = signToken(user);

            return { token, user };
          }
        }
      } else {
        throw new AuthenticationError("email and password not defined");
      }
    },
    saveBook: async (parent, { new_book }, context) => {
      if (context.user) {
        if (new_book) {
          const updatedUser = await User.findByIdAndUpdate(
            { _id: context.user._id },
            { $push: { savedBooks: new_book } },
            { new: true }
          );
          // console.log(updatedUser);
          return updatedUser;
        }
        throw new AuthenticationError("new book data is missing");
      }
      throw new AuthenticationError("You must logged in!");
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        if (bookId) {
          const updatedUser = await User.findByIdAndUpdate(
            { _id: context.user._id },
            { $pull: { savedBooks: { bookId } } },
            { new: true }
          );
          return updatedUser;
        }
        throw new AuthenticationError("You must defined bookId");
      }
      throw new AuthenticationError("You must logged in!");
    },
  },
};

module.exports = resolvers;
