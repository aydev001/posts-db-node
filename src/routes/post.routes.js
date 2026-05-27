const express = require('express');
const upload = require('../middlewares/upload');
const controller = require('../controllers/post.controller');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id', controller.getOne);
router.post('/', upload.single('image'), controller.create);
router.put('/:id', upload.single('image'), controller.update);
router.patch('/:id', upload.single('image'), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
