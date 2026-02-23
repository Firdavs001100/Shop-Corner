import { ObjectId } from 'bson';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { T } from './types/common';

export const validMimeTypes = ['image/png', 'image/jpg', 'image/jpeg'];
export const getSerialForImage = (filename: string) => {
	const ext = path.parse(filename).ext;
	return uuidv4() + ext;
};

export const shapeIntoMongooseObjectId = (target: any) => {
	return typeof target === 'string' ? new ObjectId(target) : target;
};

export const memberSortOptions = ['createdAt', 'updatedAt', 'memberLikes', 'memberViews'];
export const boardArticleSortOptions = ['createdAt', 'updatedAt', 'articleLikes', 'articleViews'];
export const commentSortOptions = ['createdAt', 'updatedAt'];