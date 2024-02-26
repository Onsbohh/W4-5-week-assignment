import { GraphQLError} from 'graphql';
import {Cat, LoginUser, TokenContent, UserInput, UserOutput} from '../../types/DBTypes';
import fetchData from '../../functions/fetchData';
import {LoginResponse, UserResponse} from '../../types/MessageTypes';

// TODO: create resolvers based on user.graphql
// note: when updating or deleting a user don't send id to the auth server, it will get it from the token. So token needs to be sent with the request to the auth server
// note2: when updating or deleting a user as admin, you need to send user id (dont delete admin btw) and also check if the user is an admin by checking the role from the user object form context

export default {
    Cat : {
        owner: async (parent: Cat) => { 
            return await fetchData<UserInput>(
                `${process.env.AUTH_URL}/users/${parent.owner}`
            );
        }  
    },
    Query: {
        users: async () => {
            return await fetchData<UserOutput[]>(
                `${process.env.AUTH_URL}/users`
            );
        },
        userById: async (_parent: undefined, args: {id: string}) => {
            return await fetchData<UserOutput>(
                `${process.env.AUTH_URL}/users/${args.id}`
            );
        },
        checkToken: async (_parent: undefined, args: undefined, context: TokenContent ) => {
            return await fetchData<UserResponse>(
                `${process.env.AUTH_URL}/users/token`,
                {
                    headers: {
                        Authorization: `Bearer ${context.token}`
                    }
                }
            );
        }
    },
    Mutation: {
        register: async (_parent: undefined, args: {user: UserInput}) => {
            return await fetchData<UserResponse> (
                `${process.env.AUTH_URL}/users`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify(args.user)
                }
            );
        },
        login: async (_parent: undefined, args: {credentials: {username: string, password: string}}) => {
            return await fetchData<LoginResponse> (
                `${process.env.AUTH_URL}/auth/login`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(args.credentials)
                }
            );
        },
        updateUser: async (_parent: undefined, args: {user: LoginUser}, context: TokenContent) => {
            console.log(context.token + "THE TOKEN");
            return await fetchData<UserResponse> (
                `${process.env.AUTH_URL}/users/`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${context.token}`
                    },
                    body: JSON.stringify(args.user)
                }
            );
        },
        deleteUser: async (_parent: undefined, args: undefined, context: TokenContent) => {
            return await fetchData<UserResponse> (
                `${process.env.AUTH_URL}/users/`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${context.token}`
                    }
                }
            );
        },
        updateUserAsAdmin: async (_parent: undefined, args: {id: string, user: UserOutput}, context: TokenContent ) => {
            if (context.user.role !== 'admin') {
                throw new GraphQLError("Unauthorized!");
            }
            return await fetchData<UserResponse> (
                `${process.env.AUTH_URL}/users/${args.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${context.token}`
                    },
                    body: JSON.stringify(args.user)
                }
            );
        },
        deleteUserAsAdmin: async (_parent: undefined, args: {id: string, user: UserOutput}, context: TokenContent ) => {
            if (context.user.role !== 'admin') {
                throw new GraphQLError("Unauthorized!");
            }
            return await fetchData<UserResponse> (
                `${process.env.AUTH_URL}/users/${args.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${context.token}`
                    }
                }
            );
        }
    }
}