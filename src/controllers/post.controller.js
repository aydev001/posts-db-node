const Post = require('../models/post.model');
const { TITLE_MAX_LENGTH, DESCRIPTION_MAX_LENGTH } = require('../models/post.model');
const cloudinaryService = require('../services/cloudinary.service');
const ApiError = require('../utils/ApiError');

function validateString(value, { field, maxLength, required }) {
  if (value === undefined || value === null) {
    if (required) throw ApiError.badRequest(`${field} is required`);
    return undefined;
  }
  if (typeof value !== 'string') {
    throw ApiError.badRequest(`${field} must be a string`);
  }
  const trimmed = value.trim();
  if (required && trimmed.length === 0) {
    throw ApiError.badRequest(`${field} must not be empty`);
  }
  if (trimmed.length > maxLength) {
    throw ApiError.badRequest(`${field} must be at most ${maxLength} characters`);
  }
  return trimmed;
}

function validateTitle(title, { required } = { required: true }) {
  return validateString(title, { field: 'title', maxLength: TITLE_MAX_LENGTH, required });
}

function validateDescription(description, { required } = { required: true }) {
  return validateString(description, { field: 'description', maxLength: DESCRIPTION_MAX_LENGTH, required });
}

async function create(req, res, next) {
  let uploaded = null;
  try {
    const title = validateTitle(req.body.title, { required: true });
    const description = validateDescription(req.body.description, { required: true });
    if (!req.file) {
      throw ApiError.badRequest('image file is required (field name: "image")');
    }

    uploaded = await cloudinaryService.uploadBuffer(req.file.buffer);

    const post = await Post.create({
      title,
      description,
      imageUrl: uploaded.url,
      imagePublicId: uploaded.publicId,
    });

    res.status(201).json({ success: true, data: post });
  } catch (err) {
    if (uploaded?.publicId) {
      cloudinaryService.destroy(uploaded.publicId);
    }
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Post.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Post.countDocuments(),
    ]);

    res.json({
      success: true,
      data: items,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw ApiError.notFound('Post not found');
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  let uploaded = null;
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw ApiError.notFound('Post not found');

    const nextTitle = validateTitle(req.body.title, { required: false });
    if (nextTitle !== undefined) {
      post.title = nextTitle;
    }

    const nextDescription = validateDescription(req.body.description, { required: false });
    if (nextDescription !== undefined) {
      post.description = nextDescription;
    }

    if (req.file) {
      uploaded = await cloudinaryService.uploadBuffer(req.file.buffer);
      const oldPublicId = post.imagePublicId;
      post.imageUrl = uploaded.url;
      post.imagePublicId = uploaded.publicId;
      await post.save();
      cloudinaryService.destroy(oldPublicId);
    } else {
      await post.save();
    }

    res.json({ success: true, data: post });
  } catch (err) {
    if (uploaded?.publicId) {
      cloudinaryService.destroy(uploaded.publicId);
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw ApiError.notFound('Post not found');

    await post.deleteOne();
    cloudinaryService.destroy(post.imagePublicId);

    res.json({ success: true, data: { id: post.id } });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getOne, update, remove };
