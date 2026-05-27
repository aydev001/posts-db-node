const mongoose = require('mongoose');

const TITLE_MAX_LENGTH = 120;
const DESCRIPTION_MAX_LENGTH = 2000;

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'title is required'],
      trim: true,
      minlength: [1, 'title must not be empty'],
      maxlength: [TITLE_MAX_LENGTH, `title must be at most ${TITLE_MAX_LENGTH} characters`],
    },
    description: {
      type: String,
      required: [true, 'description is required'],
      trim: true,
      minlength: [1, 'description must not be empty'],
      maxlength: [DESCRIPTION_MAX_LENGTH, `description must be at most ${DESCRIPTION_MAX_LENGTH} characters`],
    },
    imageUrl: {
      type: String,
      required: [true, 'imageUrl is required'],
    },
    imagePublicId: {
      type: String,
      required: [true, 'imagePublicId is required'],
    },
  },
  { timestamps: true }
);

postSchema.set('toJSON', {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Post', postSchema);
module.exports.TITLE_MAX_LENGTH = TITLE_MAX_LENGTH;
module.exports.DESCRIPTION_MAX_LENGTH = DESCRIPTION_MAX_LENGTH;
