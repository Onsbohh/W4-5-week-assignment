import {GraphQLError} from 'graphql';
import catModel from '../models/catModel';
import {Cat, LocationInput, TokenContent} from '../../types/DBTypes';
import { MyContext } from '../../types/MyContext';
import {isLoggedIn} from '../../functions/authorize';


// TODO: create resolvers based on cat.graphql
// note: when updating or deleting a cat, you need to check if the user is the owner of the cat
// note2: when updating or deleting a cat as admin, you need to check if the user is an admin by checking the role from the user object
// note3: updating and deleting resolvers should be the same for users and admins. Use if statements to check if the user is the owner or an admin

export default {
    Query: {
        cats: async () => {
            return await catModel.find();
        },
        catById: async (_parent: undefined, args: {id: string}) => {
            return await catModel.findById(args.id);
        },
        catsByArea: async (_parent: undefined, args: {location: LocationInput}) => {
            return await catModel.find({location: args.location});
        },
        catsByOwner: async (_parent: undefined, args: {owner: string}) => {
            return await catModel.find({owner: args.owner});
        },
    },
    Mutation: { 
        createCat: async (_parent: undefined,  args: {input: Omit<Cat, 'id'>}, context: MyContext) => {
            isLoggedIn(context);
            args.input.owner = context.userdata?.user.id;
            return await catModel.create(args.input);
        },
        updateCat: async (_parent: undefined, args: {id: string; input: Omit<Cat, 'id'>}, context: MyContext) => {
            isLoggedIn(context);

            const cat = await catModel.findById(args.id);
            if (!cat) {
                throw new GraphQLError('Cat not found');
            }

            if (context.userdata?.user.role == "admin") {
                return await catModel.findByIdAndUpdate(args.id, args.input, {new: true,});
            }

            if (cat.owner.toString() !== context.userdata?.user.id) {
                throw new GraphQLError('Not the owner of the cat');
              }
            return await catModel.findByIdAndUpdate({_id: args.id, owner: context.userdata?.user.id}, args.input, {new: true});
        },
        deleteCat: async (_parent: undefined, args: {id: string}, context: MyContext) => {
            isLoggedIn(context);

            const cat = await catModel.findById(args.id);
            if (!cat) {
                throw new GraphQLError('Cat not found');
            }

            if (context.userdata?.user.role !== 'admin') {
                const filter = {_id: args.id, owner: context.userdata?.user.id};
                return await catModel.findOneAndDelete(filter);
              } else {
                return await catModel.findByIdAndDelete(args.id);
            }
        }
    },
};