import { Router } from "express";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "@/controllers/playlist.controller";
import { verifyJWT } from "@/middlewares/auth.middleware";
import { upload } from "@/middlewares/multer.middleware";
import { parseUpdateFields } from "@/middlewares/parse_update_playlist_fields.middleware";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(upload.single("thumbnail"), createPlaylist);

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(parseUpdateFields, updatePlaylist)
  .delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router;
