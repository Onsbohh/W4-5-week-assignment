import {GraphQLError} from 'graphql';
import catModel from '../models/catModel';
import {Cat, LocationInput, TokenContent} from '../../types/DBTypes';
import {Query, Types} from 'mongoose';


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
            console.log("CAT LOCATION");
            console.log("Cats location : ", args.location.bottomLeft, args.location.topRight)
            return await catModel.find({location: args.location});
        },
        catsByOwner: async (_parent: undefined, args: Cat) => {
            return await catModel.find({owner: args.owner});
        },
    },
    Mutation: { 
        createCat: async (_parent: undefined, args: {cat: Cat}, context: TokenContent) => {
            if (!context) {
                throw new GraphQLError('Unauthorized create cat');
            }
            args.cat.owner = context.user.id as unknown as Types.ObjectId

            const newCat = new catModel(args.cat);
            return await newCat.save();
        },
        updateCat: async (_parent: undefined, args: {id: string, cat: Cat}, context: TokenContent) => {
            if (!context) {
                throw new GraphQLError('Unauthorized cat update');
            }

            const cat = await catModel.findById(args.id);
            if (!cat) {
                throw new GraphQLError('Cat not found');
            }

            if (context.user.role == "admin") {
                return await catModel.findByIdAndUpdate({_id: args.id, owner: context.user.id}, args.cat, {new: true});
            }

            if (cat.owner !== context.user) {
                throw new GraphQLError('Not the owner of the cat');
            }
            return await catModel.findByIdAndUpdate({_id: args.id, owner: context.user.id}, args.cat, {new: true});
        },
        deleteCat: async (_parent: undefined, args: {id: string}, context: TokenContent) => {
            if (!context) {
                throw new GraphQLError('Unauthorized cat delete');
            }

            const cat = await catModel.findById(args.id);
            if (!cat) {
                throw new GraphQLError('Cat not found');
            }

            if (context.user.role == "admin") {
                return await catModel.findByIdAndDelete(args.id);
            }
     
            if (cat.owner !== context.user) {
                throw new GraphQLError('Not the owner of the cat');
            }
            return await catModel.findByIdAndDelete(args.id);
        }
    },
};